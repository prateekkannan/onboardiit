import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { BOTTOM_NAV_HEIGHT } from "./BottomNav";
import { STOPS } from "@/data/stops";
import { ROUTES, ROUTE_ORDER } from "@/data/routes";
import { upcomingArrivalsAt } from "@/data/schedule";
import { getDemoNowMinutes } from "@/lib/onboard";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-iitm`;

const ROUTE_PILL_STYLE: Record<string, { bg: string; fg: string }> = {
  "Route 1": { bg: "#03AED2", fg: "#FFFFFF" },
  "Route 2": { bg: "#D12052", fg: "#FFFFFF" },
  "Route 3": { bg: "#F8DE22", fg: "#000000" },
  "Route 4": { bg: "#F45B26", fg: "#FFFFFF" },
  "Route 5": { bg: "#A7F432", fg: "#000000" },
  "Route 6": { bg: "#6600FF", fg: "#FFFFFF" },
};

const renderWithRoutePills = (text: string) => {
  const parts = text.split(/(Route\s[1-6])/g);
  return parts.map((part, i) => {
    const key = part.replace(/\s+/, " ");
    const style = ROUTE_PILL_STYLE[key];
    if (style) {
      return (
        <span
          key={i}
          className="mx-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-bold align-baseline"
          style={{ backgroundColor: style.bg, color: style.fg }}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const SUGGESTED_CHIPS = [
  "How do I get to the library?",
  "When is the last bus tonight?",
  "Nearest stop to OAT?",
];

export const AskPage = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async () => {
    await sendText(input);
  };

  const sendText = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;
    setError(null);
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    // Build live transit context (current time + next arrivals per stop)
    const nowMin = getDemoNowMinutes();
    const hh = String(Math.floor(nowMin / 60)).padStart(2, "0");
    const mm = String(nowMin % 60).padStart(2, "0");
    const realNow = new Date();
    const dayName = realNow.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = realNow.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const arrivalsByStop = STOPS.map((s) => {
      const next3 = upcomingArrivalsAt(s.id, nowMin, 90).slice(0, 3);
      const lines = next3.map(
        (a) => `${ROUTES[a.routeId].name} (${ROUTES[a.routeId].direction}) at ${a.arrivalTime} (${a.minutesAway} min)`,
      );
      return `• ${s.name}: ${lines.length ? lines.join(" | ") : "no buses in next 90 min"}`;
    }).join("\n");
    const liveContext = `LIVE TRANSIT CONTEXT\nToday: ${dayName}, ${dateStr}\nCurrent time: ${hh}:${mm}\nService hours: first bus ~06:15, last bus ~21:35.\nHeadway: 20 min on every route.\nRoutes: ${ROUTE_ORDER.map((r) => `${ROUTES[r].name} = ${ROUTES[r].direction}`).join("; ")}\n\nNext arrivals at each stop:\n${arrivalsByStop}`;

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, liveContext }),
      });

      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error ?? "Couldn't reach the assistant. Please try again.");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsertAssistant(delta);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 pb-4 pt-20">
        <div
          className="mx-auto flex max-w-2xl items-center gap-3 rounded-3xl border border-border p-4 shadow-sm"
          style={{
            background: "hsl(var(--card) / 0.65)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Onboard Assistant
            </p>
            <h1 className="text-base font-extrabold leading-tight text-foreground">
              Ask me anything about getting around IITM.
            </h1>
          </div>
        </div>
      </header>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 96 }}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.length === 0 && !loading && (
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTED_CHIPS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendText(q)}
                  className="rounded-full border border-border px-3.5 py-2 text-[13px] font-medium text-foreground shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: "hsl(var(--card) / 0.6)",
                    backdropFilter: "blur(16px) saturate(180%)",
                    WebkitBackdropFilter: "blur(16px) saturate(180%)",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex animate-fade-in ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground"
                }`}
                style={
                  m.role === "assistant"
                    ? {
                        background: "hsl(var(--card) / 0.7)",
                        backdropFilter: "blur(16px) saturate(180%)",
                        WebkitBackdropFilter: "blur(16px) saturate(180%)",
                      }
                    : undefined
                }
              >
                {m.content || (
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:240ms]" />
                  </span>
                ) }
                {m.content && m.role === "assistant" ? renderWithRoutePills(m.content) : null}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start animate-fade-in">
              <div
                className="rounded-3xl border border-border px-4 py-3 shadow-sm"
                style={{
                  background: "hsl(var(--card) / 0.7)",
                  backdropFilter: "blur(16px) saturate(180%)",
                }}
              >
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:240ms]" />
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div
        className="fixed inset-x-0 z-[450] px-4"
        style={{ bottom: BOTTOM_NAV_HEIGHT + 8 }}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-border p-1.5 shadow-lg"
          style={{
            background: "hsl(var(--card) / 0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Where on campus are you headed?"
            disabled={loading}
            className="flex-1 bg-transparent px-4 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { BOTTOM_NAV_HEIGHT } from "./BottomNav";
import { STOPS } from "@/data/stops";
import { ROUTES, ROUTE_ORDER } from "@/data/routes";
import { upcomingArrivalsAt } from "@/data/schedule";
import { getDemoNowMinutes } from "@/lib/onboard";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-iitm`;

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
    const text = input.trim();
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
    const arrivalsByStop = STOPS.map((s) => {
      const next3 = upcomingArrivalsAt(s.id, nowMin, 90).slice(0, 3);
      const lines = next3.map(
        (a) => `${ROUTES[a.routeId].name} (${ROUTES[a.routeId].direction}) at ${a.arrivalTime} (${a.minutesAway} min)`,
      );
      return `• ${s.name}: ${lines.length ? lines.join(" | ") : "no buses in next 90 min"}`;
    }).join("\n");
    const liveContext = `LIVE TRANSIT CONTEXT\nCurrent time: ${hh}:${mm}\nHeadway: 20 min on every route.\nRoutes: ${ROUTE_ORDER.map((r) => `${ROUTES[r].name} = ${ROUTES[r].direction}`).join("; ")}\n\nNext arrivals at each stop:\n${arrivalsByStop}`;

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
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                "I'm at CLT, how do I get to Jamuna hostel?",
                "Closest stop to Central Library?",
                "Next bus from Gajendra Circle to Velachery Gate?",
                "How do I reach Chemplast Stadium from Main Gate?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:scale-[1.01] hover:bg-muted"
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
                )}
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
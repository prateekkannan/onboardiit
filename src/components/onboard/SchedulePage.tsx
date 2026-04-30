import { useEffect, useMemo, useRef, useState } from "react";
import { ROUTES, ROUTE_ORDER, type RouteId } from "@/data/routes";
import { SCHEDULE, type Departure } from "@/data/schedule";
import { getDemoNowMinutes, hmToMin } from "@/lib/onboard";

type Filter = "all" | RouteId;

export const SchedulePage = () => {
  const now = getDemoNowMinutes();
  const [filter, setFilter] = useState<Filter>("all");
  const listRef = useRef<HTMLUListElement | null>(null);
  const nextRef = useRef<HTMLLIElement | null>(null);

  const departures = useMemo<Departure[]>(() => {
    const all =
      filter === "all"
        ? ROUTE_ORDER.flatMap((r) => SCHEDULE[r])
        : [...SCHEDULE[filter]];
    return all.sort((a, b) => hmToMin(a.time) - hmToMin(b.time));
  }, [filter]);

  const nextIdx = useMemo(
    () => departures.findIndex((d) => hmToMin(d.time) >= now),
    [departures, now],
  );

  // Smoothly scroll the "next" departure into view when filter changes / mount.
  useEffect(() => {
    if (nextRef.current && listRef.current) {
      // Slight delay so layout settles after filter swap.
      const t = window.setTimeout(() => {
        nextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
      return () => window.clearTimeout(t);
    }
  }, [filter, nextIdx]);

  const chips: Array<{ id: Filter; label: string; hex?: string }> = [
    { id: "all", label: "All directions" },
    ...ROUTE_ORDER.map((r) => ({
      id: r as Filter,
      label: ROUTES[r].direction,
      hex: ROUTES[r].hex,
    })),
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 pb-4 pt-10 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
          Schedule
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Centred on the next departure. Scroll up for earlier, down for later.
        </p>

        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
          {chips.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "scale-[1.02] border-black bg-black text-white shadow-sm"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {c.hex && (
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-white/60"
                    style={{ backgroundColor: c.hex }}
                  />
                )}
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-5 pt-6">
        <ul
          ref={listRef}
          className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card animate-fade-in"
        >
          {departures.map((d, i) => {
            const route = ROUTES[d.routeId];
            const past = hmToMin(d.time) < now;
            const isNext = i === nextIdx;
            return (
              <li
                key={`${d.routeId}-${d.time}-${d.busName}-${i}`}
                ref={isNext ? nextRef : undefined}
                className={`flex items-center justify-between px-4 py-3 transition-colors ${
                  past ? "text-muted-foreground" : "text-foreground"
                } ${isNext ? "animate-scale-in" : ""}`}
                style={
                  isNext
                    ? { backgroundColor: `${route.hex}26` }
                    : undefined
                }
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-8 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: route.hex }}
                    aria-hidden
                  />
                  <div className="flex flex-col">
                    <span className="tabular-nums text-base font-bold leading-none">
                      {d.time}
                    </span>
                    <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {route.shortName} · {d.busType}
                    </span>
                  </div>
                  {isNext && (
                    <span className="ml-1 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Next
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium">{d.busName}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

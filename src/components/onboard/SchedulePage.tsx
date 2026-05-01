import { useEffect, useMemo, useRef, useState } from "react";
import { ROUTES, ROUTE_ORDER, type RouteId } from "@/data/routes";
import { SCHEDULE, type Departure } from "@/data/schedule";
import { ROUTE_STOPS, getStop } from "@/data/stops";
import { getDemoNowMinutes, hmToMin, routeTextClass } from "@/lib/onboard";

type Filter = "all" | RouteId;

export const SchedulePage = () => {
  const now = getDemoNowMinutes();
  const [filter, setFilter] = useState<Filter>("all");
  const nextRefs = useRef<Record<RouteId, HTMLLIElement | null>>({
    r1: null, r2: null, r3: null, r4: null, r5: null, r6: null,
  });

  const visibleRoutes: RouteId[] = filter === "all" ? ROUTE_ORDER : [filter];

  // Find the index of the next departure per route.
  const nextIdxByRoute = useMemo(() => {
    const out: Partial<Record<RouteId, number>> = {};
    for (const rid of ROUTE_ORDER) {
      out[rid] = SCHEDULE[rid].findIndex((d) => hmToMin(d.time) >= now);
    }
    return out;
  }, [now]);

  // After mount/filter change, scroll the closest "next" into view.
  useEffect(() => {
    const t = window.setTimeout(() => {
      // Pick the soonest "next" across visible routes.
      let bestEl: HTMLLIElement | null = null;
      let bestMin = Infinity;
      for (const rid of visibleRoutes) {
        const idx = nextIdxByRoute[rid] ?? -1;
        if (idx === -1) continue;
        const dep = SCHEDULE[rid][idx];
        const mins = hmToMin(dep.time) - now;
        if (mins < bestMin) {
          bestMin = mins;
          bestEl = nextRefs.current[rid];
        }
      }
      bestEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [filter, nextIdxByRoute, now, visibleRoutes]);

  const chips: Array<{ id: Filter; label: string; hex?: string }> = [
    { id: "all", label: "All routes" },
    ...ROUTE_ORDER.map((r) => ({
      id: r as Filter,
      label: ROUTES[r].name,
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
          Centred on the next departure. Scroll to see earlier or later.
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

      <div className="space-y-8 px-5 pt-6">
        {visibleRoutes.map((rid) => (
          <RouteSchedule
            key={rid}
            routeId={rid}
            now={now}
            nextIdx={nextIdxByRoute[rid] ?? -1}
            registerNextRef={(el) => (nextRefs.current[rid] = el)}
          />
        ))}
      </div>
    </div>
  );
};

interface RouteScheduleProps {
  routeId: RouteId;
  now: number;
  nextIdx: number;
  registerNextRef: (el: HTMLLIElement | null) => void;
}

const RouteSchedule = ({
  routeId,
  now,
  nextIdx,
  registerNextRef,
}: RouteScheduleProps) => {
  const route = ROUTES[routeId];
  const text = routeTextClass(routeId);
  const departures: Departure[] = SCHEDULE[routeId];
  const seq = ROUTE_STOPS[routeId];
  const firstStopName = getStop(seq[0])!.name;
  const lastStopName = getStop(seq[seq.length - 1])!.name;

  return (
    <section>
      <div
        className={`flex items-center justify-between rounded-2xl px-4 py-3 ${text}`}
        style={{ backgroundColor: route.hex }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            {route.name}
          </p>
          <h2 className="text-base font-extrabold leading-tight">
            {firstStopName} → {lastStopName}
          </h2>
        </div>
        <span className="rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
          every 20 min
        </span>
      </div>

      <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {departures.map((d, i) => {
          const past = hmToMin(d.time) < now;
          const isNext = i === nextIdx;
          const lastEta = d.stopETAs[d.stopETAs.length - 1];
          return (
            <li
              key={`${d.busName}-${d.time}`}
              ref={isNext ? registerNextRef : undefined}
              className={`flex items-center justify-between px-4 py-3 transition-colors ${
                past ? "text-muted-foreground" : "text-foreground"
              } ${isNext ? "animate-scale-in" : ""}`}
              style={isNext ? { backgroundColor: `${route.hex}26` } : undefined}
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
                    {d.busName} · arr {lastEta.time}
                  </span>
                </div>
                {isNext && (
                  <span className="ml-1 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Next
                  </span>
                )}
              </div>
              <div className="text-sm font-medium tabular-nums">
                {Math.max(0, hmToMin(d.time) - now)} min
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

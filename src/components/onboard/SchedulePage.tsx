import { useState } from "react";
import { ROUTES, ROUTE_ORDER, type RouteId } from "@/data/routes";
import { SCHEDULE } from "@/data/schedule";
import { getDemoNowMinutes, hmToMin } from "@/lib/onboard";

type Filter = "all" | RouteId;

export const SchedulePage = () => {
  const now = getDemoNowMinutes();
  const [filter, setFilter] = useState<Filter>("all");

  const visibleRoutes =
    filter === "all" ? ROUTE_ORDER : ROUTE_ORDER.filter((r) => r === filter);

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
          Filter by direction.
        </p>

        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
          {chips.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-black bg-black text-white"
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
        {visibleRoutes.map((rid) => {
          const route = ROUTES[rid];
          const departures = SCHEDULE[rid];
          const nextIdx = departures.findIndex((d) => hmToMin(d.time) >= now);

          return (
            <section key={rid}>
              <div className="flex items-stretch">
                <div
                  className="w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: route.hex }}
                  aria-hidden
                />
                <div className="flex flex-1 items-baseline justify-between pl-4">
                  <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                    {route.direction}
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {departures[0].busType}
                  </span>
                </div>
              </div>

              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {departures.map((d, i) => {
                  const past = hmToMin(d.time) < now;
                  const isNext = i === nextIdx;
                  return (
                    <li
                      key={`${rid}-${d.time}-${d.busName}`}
                      className={`flex items-center justify-between px-4 py-3 ${
                        past ? "text-muted-foreground" : "text-foreground"
                      }`}
                      style={
                        isNext
                          ? { backgroundColor: `${route.hex}26` }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`tabular-nums text-base font-bold ${
                            past ? "" : "text-foreground"
                          }`}
                        >
                          {d.time}
                        </span>
                        {isNext && (
                          <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            Next
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium">{d.busName}</div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};

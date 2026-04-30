import { ROUTES, ROUTE_ORDER } from "@/data/routes";
import { SCHEDULE } from "@/data/schedule";
import { getDemoNowMinutes, hmToMin } from "@/lib/onboard";

export const SchedulePage = () => {
  const now = getDemoNowMinutes();

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="border-b border-border bg-background px-5 pb-5 pt-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
          Schedule
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All directions, all departures.
        </p>
      </header>

      <div className="space-y-8 px-5 pt-6">
        {ROUTE_ORDER.map((rid) => {
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
                          ? { backgroundColor: `${route.hex}26` } // ~15% alpha
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
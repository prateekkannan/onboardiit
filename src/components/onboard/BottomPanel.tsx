import { useMemo } from "react";
import { SCHEDULE } from "@/data/schedule";
import { NEAREST_STOP_ID, STOPS } from "@/data/stops";
import { ROUTES, type RouteId } from "@/data/routes";
import { getDemoNowMinutes, hmToMin } from "@/lib/onboard";
import { BusCard } from "./BusCard";

interface IncomingBus {
  routeId: RouteId;
  busName: string;
  busType: ReturnType<() => (typeof SCHEDULE)[RouteId][number]["busType"]>;
  minutesAway: number;
}

export const BottomPanel = () => {
  const now = getDemoNowMinutes();

  const stop = STOPS.find((s) => s.id === NEAREST_STOP_ID)!;

  const incoming = useMemo<IncomingBus[]>(() => {
    const result: IncomingBus[] = [];
    for (const routeId of stop.routes) {
      const next = SCHEDULE[routeId].find((d) => hmToMin(d.time) >= now);
      if (!next) continue;
      const minutesAway = hmToMin(next.time) - now;
      if (minutesAway > 60) continue; // only show within an hour
      result.push({
        routeId,
        busName: next.busName,
        busType: next.busType,
        minutesAway,
      });
    }
    return result.sort((a, b) => a.minutesAway - b.minutesAway);
  }, [now, stop.routes]);

  // Pre-compute pin colors for the route legend dots in the header
  const stopRouteColors = stop.routes.map((r) => ROUTES[r].hex);

  return (
    <div className="glass-panel pointer-events-auto absolute inset-x-0 bottom-0 z-[500] rounded-t-3xl px-5 pb-24 pt-5">
      <div className="mx-auto h-1 w-12 rounded-full bg-black/20" aria-hidden />

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-black/60">
            Nearest stop
          </p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight text-black">
            {stop.name}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 pb-1.5">
          {stopRouteColors.map((c, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full border border-white/70"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        {incoming.length === 0 ? (
          <p className="rounded-2xl bg-black/5 px-4 py-6 text-center text-sm font-medium text-black/60">
            No buses arriving in the next hour.
          </p>
        ) : (
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {incoming.map((b) => (
              <BusCard
                key={`${b.routeId}-${b.busName}`}
                routeId={b.routeId}
                minutesAway={b.minutesAway}
                busName={b.busName}
                busType={b.busType}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
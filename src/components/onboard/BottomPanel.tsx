import { useMemo, useRef, useState } from "react";
import { ChevronUp, MapPin } from "lucide-react";
import { SCHEDULE } from "@/data/schedule";
import { ROUTES, type RouteId } from "@/data/routes";
import { getDemoNowMinutes, hmToMin } from "@/lib/onboard";
import { BusCard } from "./BusCard";
import { useNearestStop } from "@/hooks/useNearestStop";

interface IncomingBus {
  routeId: RouteId;
  busName: string;
  busType: ReturnType<() => (typeof SCHEDULE)[RouteId][number]["busType"]>;
  minutesAway: number;
}

export const BottomPanel = () => {
  const now = getDemoNowMinutes();
  const { stop, source } = useNearestStop();
  const [collapsed, setCollapsed] = useState(false);

  // Track touch/pointer drag on the handle / header
  const startY = useRef<number | null>(null);

  const incoming = useMemo<IncomingBus[]>(() => {
    const result: IncomingBus[] = [];
    for (const routeId of stop.routes) {
      const next = SCHEDULE[routeId].find((d) => hmToMin(d.time) >= now);
      if (!next) continue;
      const minutesAway = hmToMin(next.time) - now;
      if (minutesAway > 60) continue;
      result.push({
        routeId,
        busName: next.busName,
        busType: next.busType,
        minutesAway,
      });
    }
    return result.sort((a, b) => a.minutesAway - b.minutesAway);
  }, [now, stop.routes]);

  const stopRouteColors = stop.routes.map((r) => ROUTES[r].hex);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    startY.current = null;
    if (dy > 30) setCollapsed(true);
    else if (dy < -30) setCollapsed(false);
  };

  // Collapsed: tiny pill peek that the user can tap or drag up to expand.
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="glass-panel pointer-events-auto absolute inset-x-0 bottom-0 z-[500] flex w-full flex-col items-center gap-1 rounded-t-3xl px-5 pb-6 pt-3"
        aria-label="Show nearest stop"
      >
        <div className="h-1 w-12 rounded-full bg-black/20" aria-hidden />
        <div className="mt-1 flex items-center gap-2 text-black">
          <ChevronUp className="h-4 w-4" />
          <span className="text-sm font-bold">{stop.name}</span>
          <span className="text-xs font-medium text-black/60">
            · {incoming.length} upcoming
          </span>
        </div>
      </button>
    );
  }

  return (
    <div
      className="glass-panel pointer-events-auto absolute inset-x-0 bottom-0 z-[500] rounded-t-3xl px-5 pb-24 pt-3"
    >
      <div
        className="mx-auto flex w-full cursor-grab touch-none flex-col items-center pb-2 pt-1 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className="h-1 w-12 rounded-full bg-black/20" aria-hidden />
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-black/60">
            <MapPin className="h-3 w-3" />
            {source === "geo" ? "Nearest stop" : "Nearest stop · default"}
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

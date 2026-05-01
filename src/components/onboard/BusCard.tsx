import { ROUTES, type BusType, type RouteId } from "@/data/routes";
import { formatCountdown, routeTextClass } from "@/lib/onboard";

interface BusCardProps {
  routeId: RouteId;
  minutesAway: number;
  busName: string;
  busType: BusType;
  arrivalTime?: string;
}

export const BusCard = ({
  routeId,
  minutesAway,
  busName,
  busType,
  arrivalTime,
}: BusCardProps) => {
  const route = ROUTES[routeId];
  const text = routeTextClass(routeId);
  const pillBg = route.textOnTop === "white" ? "bg-white/20" : "bg-black/10";

  return (
    <div
      className={`flex min-w-[260px] flex-col justify-between rounded-2xl p-5 shadow-sm ${text}`}
      style={{ backgroundColor: route.hex }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            {route.name}
          </p>
          <h3 className="mt-0.5 text-base font-bold leading-tight">
            {route.direction}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${pillBg}`}
        >
          {busType}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-extrabold leading-none">
          {formatCountdown(minutesAway)}
        </div>
        <div className="mt-2 flex items-center justify-between text-sm font-semibold opacity-90">
          <span>{busName}</span>
          {arrivalTime && <span className="tabular-nums">{arrivalTime}</span>}
        </div>
      </div>
    </div>
  );
};

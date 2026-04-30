import { ROUTES, type BusType, type RouteId } from "@/data/routes";
import { formatCountdown, routeTextClass } from "@/lib/onboard";

interface BusCardProps {
  routeId: RouteId;
  minutesAway: number;
  busName: string;
  busType: BusType;
}

export const BusCard = ({ routeId, minutesAway, busName, busType }: BusCardProps) => {
  const route = ROUTES[routeId];
  const text = routeTextClass(routeId);
  const pillBg =
    route.textOnTop === "white" ? "bg-white/20" : "bg-black/10";

  return (
    <div
      className={`flex min-w-[260px] flex-col justify-between rounded-2xl p-5 shadow-sm ${text}`}
      style={{ backgroundColor: route.hex }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold leading-tight">{route.direction}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${pillBg}`}>
          {busType}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-extrabold leading-none">
          {formatCountdown(minutesAway)}
        </div>
        <div className="mt-2 text-sm font-semibold opacity-90">{busName}</div>
      </div>
    </div>
  );
};
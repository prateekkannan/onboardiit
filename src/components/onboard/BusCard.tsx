import { useRef } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { ROUTES, type BusType, type RouteId } from "@/data/routes";
import { formatCountdown, routeTextClass } from "@/lib/onboard";

interface BusCardProps {
  routeId: RouteId;
  minutesAway: number;
  busName: string;
  busType: BusType;
  arrivalTime?: string;
  originStop?: string;
  destinationStop?: string;
  departureTime?: string;
}

export const BusCard = ({
  routeId,
  minutesAway,
  busName,
  busType,
  arrivalTime,
  originStop,
  destinationStop,
  departureTime,
}: BusCardProps) => {
  const route = ROUTES[routeId];
  const text = routeTextClass(routeId);
  const pillBg = route.textOnTop === "white" ? "bg-white/20" : "bg-black/10";
  const pressTimer = useRef<number | null>(null);
  const fired = useRef(false);

  const handleShare = async () => {
    fired.current = true;
    const origin = originStop ?? route.direction.split("→")[0]?.trim() ?? "";
    const dest = destinationStop ?? route.direction.split("→")[1]?.trim() ?? "";
    const dep = departureTime ?? arrivalTime ?? "";
    const arr = arrivalTime ?? "";
    const url =
      typeof window !== "undefined" ? window.location.origin : "https://onboardiit.lovable.app";
    const msg = `🚌 ${route.name} • ${origin} ${dep} → ${dest} ${arr}\nTrack live on Onboard: ${url}`;
    try {
      await navigator.clipboard.writeText(msg);
    } catch {
      // Ignore — toast still confirms intent
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(40);
    toast.success("Bus details copied — ready to share on WhatsApp", {
      icon: <Check className="h-4 w-4" />,
      duration: 2000,
    });
  };

  const startPress = () => {
    fired.current = false;
    pressTimer.current = window.setTimeout(handleShare, 550);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <div
      className={`flex min-w-[260px] flex-col justify-between rounded-2xl p-5 shadow-sm ${text}`}
      style={{ backgroundColor: route.hex }}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
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

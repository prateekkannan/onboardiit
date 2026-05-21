import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ROUTES, ROUTE_ORDER, type RouteId } from "@/data/routes";
import { ROUTE_STOPS, type Stop } from "@/data/stops";
import { SCHEDULE } from "@/data/schedule";
import { getDemoNowMinutes } from "@/lib/onboard";
import { useTheme } from "@/components/theme/ThemeProvider";

interface EtaCardProps {
  fromStop: Stop;
  toStop: Stop;
}

interface JourneyOption {
  routeId: RouteId;
  depart: string;
  arrive: string;
  minutesAway: number;
}

function hmToMin(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export const EtaCard = ({ fromStop, toStop }: EtaCardProps) => {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [nowMin, setNowMin] = useState(() => getDemoNowMinutes());

  useEffect(() => {
    const i = setInterval(() => setNowMin(getDemoNowMinutes()), 30000);
    return () => clearInterval(i);
  }, []);

  const options = useMemo<JourneyOption[]>(() => {
    const out: JourneyOption[] = [];
    for (const rid of ROUTE_ORDER) {
      const seq = ROUTE_STOPS[rid];
      const i = seq.indexOf(fromStop.id);
      const j = seq.indexOf(toStop.id);
      if (i === -1 || j === -1 || j <= i) continue;
      for (const dep of SCHEDULE[rid]) {
        const depEta = dep.stopETAs[i];
        const arrEta = dep.stopETAs[j];
        const delta = hmToMin(depEta.time) - nowMin;
        if (delta < 0) continue;
        out.push({
          routeId: rid,
          depart: depEta.time,
          arrive: arrEta.time,
          minutesAway: delta,
        });
        break;
      }
    }
    out.sort((a, b) => a.minutesAway - b.minutesAway);
    return out.slice(0, 2);
  }, [fromStop.id, toStop.id, nowMin]);

  const cardStyle = {
    background: dark ? "hsla(0,0%,8%,0.55)" : "hsla(0,0%,100%,0.55)",
    borderColor: dark ? "hsla(0,0%,100%,0.18)" : "hsla(0,0%,100%,0.6)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
  } as const;

  return (
    <div
      className="pointer-events-auto fixed right-3 top-[64px] z-[600] w-[min(58vw,210px)] animate-fade-in rounded-2xl border p-2 shadow-lg"
      style={cardStyle}
    >
      <div className="px-1 pb-1 text-[9px] font-bold uppercase tracking-wider text-foreground/55">
        Next bus
      </div>
      {options.length === 0 ? (
        <div className="px-2 py-2 text-[11px] text-foreground/60">
          No upcoming service today.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {options.map((o, idx) => {
            const r = ROUTES[o.routeId];
            return (
              <div
                key={`${o.routeId}-${idx}`}
                className="flex items-center gap-1.5 rounded-xl bg-foreground/5 px-2 py-1.5"
              >
                <span
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  style={{ backgroundColor: r.hex, color: r.textOnTop }}
                >
                  R{o.routeId.slice(1)}
                </span>
                <span className="text-[12px] font-bold text-foreground">
                  {o.depart}
                </span>
                <ArrowRight className="h-3 w-3 text-foreground/45" />
                <span className="text-[12px] font-semibold text-foreground/85">
                  {o.arrive}
                </span>
                <span className="ml-auto text-[10px] text-foreground/55">
                  {o.minutesAway === 0 ? "now" : `${o.minutesAway}m`}
                </span>
              </div>
            );
          })}
          <div className="truncate px-1 pt-0.5 text-[10px] text-foreground/55">
            From {fromStop.name} → {toStop.name}
          </div>
        </div>
      )}
    </div>
  );
};
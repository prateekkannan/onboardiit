import { useEffect, useState } from "react";
import { Crosshair, Layers, SlidersHorizontal, Bell } from "lucide-react";
import { toast } from "sonner";
import { ROUTES, ROUTE_ORDER, type RouteId } from "@/data/routes";
import { BOTTOM_NAV_HEIGHT } from "./BottomNav";
import { upcomingArrivalsAt, type UpcomingArrival } from "@/data/schedule";
import { useNearestStop } from "@/hooks/useNearestStop";
import { getDemoNowMinutes } from "@/lib/onboard";

type SheetKind = "legend" | "filter" | "alert" | null;

export interface ArmedAlert {
  routeId: RouteId;
  busName: string;
  arrivalTime: string;   // HH:MM
  stopId: string;
  stopName: string;
}

interface Props {
  onRecenter: () => void;
  hiddenRoutes: Set<RouteId>;
  onToggleRoute: (rid: RouteId) => void;
}

function safeBuzz(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {}
}

export const MapFloatingControls = ({ onRecenter, hiddenRoutes, onToggleRoute }: Props) => {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [armed, setArmed] = useState<ArmedAlert | null>(null);
  const { stop: nearest } = useNearestStop();

  // Outside-tap to dismiss
  useEffect(() => {
    if (!sheet) return;
    const close = () => setSheet(null);
    const t = window.setTimeout(() => {
      window.addEventListener("pointerdown", close, { once: true });
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", close);
    };
  }, [sheet]);

  // Proximity check — every 15s, fire when armed bus reaches 3 min away.
  useEffect(() => {
    if (!armed) return;
    const tick = () => {
      const now = getDemoNowMinutes();
      const upcoming = upcomingArrivalsAt(armed.stopId, now, 240);
      const match = upcoming.find(
        (u) => u.routeId === armed.routeId && u.busName === armed.busName && u.arrivalTime === armed.arrivalTime,
      );
      if (!match) {
        // bus already passed → disarm silently
        setArmed(null);
        return;
      }
      if (match.minutesAway <= 3) {
        safeBuzz([10, 60, 30, 60, 10]);
        toast("Your bus is 3 minutes away — head to the stop now.", {
          duration: 8000,
          position: "top-center",
        });
        setArmed(null);
      }
    };
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [armed]);

  const btnBase =
    "flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground shadow-lg transition-all hover:scale-105 active:scale-95";
  const btnStyle = {
    background: "hsl(var(--card) / 0.7)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
  };

  const armedColor = armed ? ROUTES[armed.routeId].hex : null;

  const sheetStyle = {
    bottom: BOTTOM_NAV_HEIGHT + 90,
    background: "hsl(var(--card) / 0.85)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
  } as const;

  const arrivals: UpcomingArrival[] =
    sheet === "alert"
      ? upcomingArrivalsAt(nearest.id, getDemoNowMinutes(), 90).slice(0, 8)
      : [];

  return (
    <>
      <div
        className="pointer-events-auto fixed right-4 z-[600] flex flex-col gap-2"
        style={{ bottom: BOTTOM_NAV_HEIGHT + 90 }}
      >
        <button
          aria-label="Set bus proximity alert"
          className={btnBase}
          style={{
            ...btnStyle,
            ...(armedColor
              ? {
                  boxShadow: `0 0 0 2px ${armedColor}, 0 0 18px ${armedColor}`,
                  color: armedColor,
                }
              : {}),
          }}
          onClick={(e) => {
            e.stopPropagation();
            safeBuzz(8);
            setSheet((s) => (s === "alert" ? null : "alert"));
          }}
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          aria-label="Filter routes"
          className={btnBase}
          style={btnStyle}
          onClick={(e) => {
            e.stopPropagation();
            safeBuzz(8);
            setSheet((s) => (s === "filter" ? null : "filter"));
          }}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
        <button
          aria-label="Show route legend"
          className={btnBase}
          style={btnStyle}
          onClick={(e) => {
            e.stopPropagation();
            safeBuzz(8);
            setSheet((s) => (s === "legend" ? null : "legend"));
          }}
        >
          <Layers className="h-5 w-5" />
        </button>
        <button
          aria-label="Recenter on nearest stop"
          className={btnBase}
          style={btnStyle}
          onClick={() => {
            safeBuzz(8);
            onRecenter();
          }}
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>

      {sheet === "legend" && (
        <div
          className="pointer-events-auto fixed left-1/2 z-[650] w-[min(92vw,360px)] -translate-x-1/2 animate-slide-up-in rounded-3xl border border-border p-4 shadow-2xl"
          style={sheetStyle}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Route Legend
          </p>
          <ul className="flex flex-col gap-2">
            {ROUTE_ORDER.map((rid) => {
              const r = ROUTES[rid];
              return (
                <li key={rid} className="flex items-center gap-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ backgroundColor: r.hex, color: r.textOnTop === "white" ? "#fff" : "#000" }}
                  >
                    {r.name}
                  </span>
                  <span className="text-sm font-medium text-foreground">{r.direction}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {sheet === "filter" && (
        <div
          className="pointer-events-auto fixed left-1/2 z-[650] w-[min(92vw,360px)] -translate-x-1/2 animate-slide-up-in rounded-3xl border border-border p-4 shadow-2xl"
          style={sheetStyle}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Filter Routes
          </p>
          <ul className="flex flex-col gap-2">
            {ROUTE_ORDER.map((rid) => {
              const r = ROUTES[rid];
              const on = !hiddenRoutes.has(rid);
              return (
                <li key={rid} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{
                        backgroundColor: r.hex,
                        color: r.textOnTop === "white" ? "#fff" : "#000",
                        opacity: on ? 1 : 0.35,
                      }}
                    >
                      {r.name}
                    </span>
                    <span className={`text-sm font-medium ${on ? "text-foreground" : "text-muted-foreground"}`}>
                      {r.direction}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      safeBuzz(6);
                      onToggleRoute(rid);
                    }}
                    className="relative h-6 w-11 rounded-full transition-colors"
                    style={{ backgroundColor: on ? r.hex : "hsl(var(--muted))" }}
                    aria-label={`Toggle ${r.name}`}
                  >
                    <span
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                      style={{ left: on ? "calc(100% - 22px)" : "2px" }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {sheet === "alert" && (
        <div
          className="pointer-events-auto fixed left-1/2 z-[650] w-[min(92vw,380px)] -translate-x-1/2 animate-slide-up-in rounded-3xl border border-border p-4 shadow-2xl"
          style={sheetStyle}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Alert me · {nearest.name}
            </p>
            {armed && (
              <button
                onClick={() => { safeBuzz(6); setArmed(null); }}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Disarm
              </button>
            )}
          </div>
          {arrivals.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No upcoming buses in the next 90 min.
            </p>
          ) : (
            <ul className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto no-scrollbar">
              {arrivals.map((u) => {
                const r = ROUTES[u.routeId];
                const isArmed =
                  armed?.routeId === u.routeId &&
                  armed?.busName === u.busName &&
                  armed?.arrivalTime === u.arrivalTime;
                return (
                  <li key={`${u.routeId}-${u.busName}-${u.arrivalTime}`}>
                    <button
                      onClick={() => {
                        safeBuzz(10);
                        setArmed({
                          routeId: u.routeId,
                          busName: u.busName,
                          arrivalTime: u.arrivalTime,
                          stopId: nearest.id,
                          stopName: nearest.name,
                        });
                        toast(`Alert armed for ${r.name} • ${u.arrivalTime}`, {
                          description: "We'll buzz when it's 3 min away.",
                        });
                        setSheet(null);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted"
                      style={isArmed ? { boxShadow: `0 0 0 2px ${r.hex}` } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ backgroundColor: r.hex, color: r.textOnTop === "white" ? "#fff" : "#000" }}
                        >
                          {r.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{u.busName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">{u.arrivalTime}</div>
                        <div className="text-[10px] text-muted-foreground">in {u.minutesAway} min</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
};
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, MapPin, X } from "lucide-react";
import { upcomingArrivalsAt } from "@/data/schedule";
import { ROUTES } from "@/data/routes";
import { getDemoNowMinutes } from "@/lib/onboard";
import { BusCard } from "./BusCard";
import { useNearestStop } from "@/hooks/useNearestStop";
import { BOTTOM_NAV_HEIGHT } from "./BottomNav";
import type { Stop } from "@/data/stops";

interface BottomPanelProps {
  selectedStop?: Stop | null;
  onClearSelected?: () => void;
}

// Visible peek height when collapsed — kept ABOVE the bottom nav so the
// drag handle is always reachable.
const PEEK_HEIGHT = 64;
const NAV_GAP = BOTTOM_NAV_HEIGHT + 8; // sit just above nav

export const BottomPanel = ({
  selectedStop,
  onClearSelected,
}: BottomPanelProps) => {
  const now = getDemoNowMinutes();
  const { stop: geoStop, source } = useNearestStop();
  const stop = selectedStop ?? geoStop;

  // Live wall-clock time, updating every minute.
  const [clock, setClock] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [sheetH, setSheetH] = useState(360);
  const [collapsed, setCollapsed] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const startCollapsed = useRef(false);

  useEffect(() => {
    if (!sheetRef.current) return;
    const ro = new ResizeObserver(() => {
      setSheetH(sheetRef.current!.offsetHeight);
    });
    ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (selectedStop) setCollapsed(false);
  }, [selectedStop]);

  const incoming = useMemo(
    () => upcomingArrivalsAt(stop.id, now, 90),
    [now, stop.id],
  );

  const stopRouteColors = stop.routes.map((r) => ROUTES[r].hex);

  // The sheet's natural bottom sits flush with screen bottom. We keep it
  // raised by NAV_GAP so the handle is always above the bottom nav.
  // Collapsed translation = full sheet height minus the peek visible area.
  const collapsedTranslate = Math.max(0, sheetH - PEEK_HEIGHT);
  const baseTranslate = collapsed ? collapsedTranslate : 0;
  const liveTranslate = Math.min(
    collapsedTranslate,
    Math.max(0, baseTranslate + dragY),
  );
  const isDragging = dragStart.current !== null;

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY;
    startCollapsed.current = collapsed;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    setDragY(e.clientY - dragStart.current);
  };
  const onPointerUp = () => {
    if (dragStart.current === null) return;
    const finalTranslate = baseTranslate + dragY;
    const shouldCollapse = finalTranslate > collapsedTranslate / 2;
    setCollapsed(shouldCollapse);
    setDragY(0);
    dragStart.current = null;
  };

  return (
    <div
      ref={sheetRef}
      className="glass-panel pointer-events-auto absolute inset-x-0 z-[500] rounded-t-3xl px-5 pt-3 will-change-transform"
      style={{
        bottom: NAV_GAP,
        paddingBottom: 16,
        transform: `translateY(${liveTranslate}px)`,
        transition: isDragging
          ? "none"
          : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Drag handle — always interactive, always above the bottom nav */}
      <div
        className="mx-auto flex w-full cursor-grab touch-none flex-col items-center pb-2 pt-1 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          if (!isDragging && Math.abs(dragY) < 4) setCollapsed((c) => !c);
        }}
      >
        <div className="h-1.5 w-12 rounded-full bg-foreground/30 transition-all" aria-hidden />
        {collapsed && (
          <div className="mt-2 flex items-center gap-2 text-foreground animate-fade-in">
            <ChevronUp className="h-4 w-4" />
            <span className="text-sm font-bold">{stop.name}</span>
            <span className="text-xs font-medium text-foreground/60">
              · {incoming.length} upcoming
            </span>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            <MapPin className="h-3 w-3" />
            {selectedStop
              ? "Selected stop"
              : source === "geo"
              ? "Nearest stop"
              : "Nearest stop · default"}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight text-foreground">
            {stop.name}
          </h1>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 pb-1.5">
          <span
            className="font-medium tabular-nums text-foreground/50"
            style={{ fontSize: "11px" }}
            aria-label="Current time"
          >
            {clock}
          </span>
          <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {stopRouteColors.map((c, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full border border-white/70"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          {selectedStop && onClearSelected && (
            <button
              onClick={onClearSelected}
              className="ml-1 rounded-full bg-foreground/10 p-1 text-foreground/70 hover:bg-foreground/15"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {incoming.length === 0 ? (
          <p className="rounded-2xl bg-foreground/5 px-4 py-6 text-center text-sm font-medium text-foreground/60">
            No buses arriving soon at this stop.
          </p>
        ) : (
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {incoming.map((b, i) => (
              <div
                key={`${b.routeId}-${b.busName}-${b.arrivalTime}`}
                className="animate-fade-in"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "both",
                }}
              >
                <BusCard
                  routeId={b.routeId}
                  minutesAway={b.minutesAway}
                  busName={b.busName}
                  busType={b.busType}
                  arrivalTime={b.arrivalTime}
                  originStop={ROUTES[b.routeId].direction.split("→")[0]?.trim()}
                  destinationStop={ROUTES[b.routeId].direction.split("→")[1]?.trim()}
                  departureTime={b.tripStartTime}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

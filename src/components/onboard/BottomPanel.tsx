import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, MapPin, X } from "lucide-react";
import { SCHEDULE } from "@/data/schedule";
import { ROUTES, type RouteId } from "@/data/routes";
import { getDemoNowMinutes, hmToMin } from "@/lib/onboard";
import { BusCard } from "./BusCard";
import { useNearestStop } from "@/hooks/useNearestStop";
import type { Stop } from "@/data/stops";

interface IncomingBus {
  routeId: RouteId;
  busName: string;
  busType: ReturnType<() => (typeof SCHEDULE)[RouteId][number]["busType"]>;
  minutesAway: number;
}

interface BottomPanelProps {
  /** Optional override of the stop displayed (e.g. user tapped a pin). */
  selectedStop?: Stop | null;
  onClearSelected?: () => void;
}

// Sheet collapses to a slim peek bar that's still visible above the nav.
const PEEK_HEIGHT = 72;       // px visible when collapsed
const COLLAPSE_THRESHOLD = 80; // px drag before snapping closed

export const BottomPanel = ({ selectedStop, onClearSelected }: BottomPanelProps) => {
  const now = getDemoNowMinutes();
  const { stop: geoStop, source } = useNearestStop();
  const stop = selectedStop ?? geoStop;

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [sheetH, setSheetH] = useState(360);
  const [collapsed, setCollapsed] = useState(false);
  const [dragY, setDragY] = useState(0); // additive offset while dragging
  const dragStart = useRef<number | null>(null);
  const startCollapsed = useRef(false);

  // Measure the sheet height so the collapsed translation matches it exactly.
  useEffect(() => {
    if (!sheetRef.current) return;
    const ro = new ResizeObserver(() => {
      setSheetH(sheetRef.current!.offsetHeight);
    });
    ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, []);

  // Tapping a new stop on the map should always reveal the sheet.
  useEffect(() => {
    if (selectedStop) setCollapsed(false);
  }, [selectedStop]);

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

  // Distance the sheet must travel down to be fully collapsed (peek visible).
  const collapsedTranslate = Math.max(0, sheetH - PEEK_HEIGHT);
  // Base translate based on collapsed state, plus live drag offset.
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
    // Snap based on whether we crossed midway.
    const shouldCollapse =
      finalTranslate > collapsedTranslate / 2
        ? true
        : finalTranslate > COLLAPSE_THRESHOLD && startCollapsed.current
        ? true
        : false;
    setCollapsed(shouldCollapse);
    setDragY(0);
    dragStart.current = null;
  };

  return (
    <div
      ref={sheetRef}
      className="glass-panel pointer-events-auto absolute inset-x-0 bottom-0 z-[500] rounded-t-3xl px-5 pb-24 pt-3 will-change-transform"
      style={{
        transform: `translateY(${liveTranslate}px)`,
        transition: isDragging
          ? "none"
          : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Drag handle / header — always pointer-interactive */}
      <div
        className="mx-auto flex w-full cursor-grab touch-none flex-col items-center pb-2 pt-1 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          // Tap (no drag) on handle toggles state.
          if (!isDragging && Math.abs(dragY) < 4) setCollapsed((c) => !c);
        }}
      >
        <div className="h-1 w-12 rounded-full bg-black/25 transition-all" aria-hidden />
        {collapsed && (
          <div className="mt-2 flex items-center gap-2 text-black animate-fade-in">
            <ChevronUp className="h-4 w-4" />
            <span className="text-sm font-bold">{stop.name}</span>
            <span className="text-xs font-medium text-black/60">
              · {incoming.length} upcoming
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-black/60">
            <MapPin className="h-3 w-3" />
            {selectedStop
              ? "Selected stop"
              : source === "geo"
              ? "Nearest stop"
              : "Nearest stop · default"}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight text-black">
            {stop.name}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 pb-1.5">
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
              className="ml-1 rounded-full bg-black/10 p-1 text-black/70 hover:bg-black/15"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        {incoming.length === 0 ? (
          <p className="rounded-2xl bg-black/5 px-4 py-6 text-center text-sm font-medium text-black/60">
            No buses arriving in the next hour.
          </p>
        ) : (
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {incoming.map((b, i) => (
              <div
                key={`${b.routeId}-${b.busName}`}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <BusCard
                  routeId={b.routeId}
                  minutesAway={b.minutesAway}
                  busName={b.busName}
                  busType={b.busType}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

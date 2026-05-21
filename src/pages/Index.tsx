import { useEffect, useMemo, useState } from "react";
import { CampusMap } from "@/components/onboard/CampusMap";
import { BottomPanel } from "@/components/onboard/BottomPanel";
import { BottomNav, type Screen } from "@/components/onboard/BottomNav";
import { SchedulePage } from "@/components/onboard/SchedulePage";
import { TopBar } from "@/components/onboard/TopBar";
import { AskPage } from "@/components/onboard/AskPage";
import { NearbyPage } from "@/components/onboard/NearbyPage";
import { MapFloatingControls } from "@/components/onboard/MapFloatingControls";
import { JourneyPlanner } from "@/components/onboard/JourneyPlanner";
import { EtaCard } from "@/components/onboard/EtaCard";
import { findBestRouteBetween, type Stop } from "@/data/stops";
import type { RouteId } from "@/data/routes";
import { useNearestStop } from "@/hooks/useNearestStop";
import { routeSegmentBetween } from "@/data/roads";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [hiddenRoutes, setHiddenRoutes] = useState<Set<RouteId>>(new Set());
  const { stop: nearestStop } = useNearestStop();
  const [fromStop, setFromStop] = useState<Stop | null>(null);
  const [toStop, setToStop] = useState<Stop | null>(null);
  const [fromManuallySet, setFromManuallySet] = useState(false);

  // Keep `from` synced to the live nearest stop unless the user picked one.
  useEffect(() => {
    if (!fromManuallySet) setFromStop(nearestStop);
  }, [nearestStop, fromManuallySet]);

  const effectiveFrom = fromStop ?? nearestStop;

  const focus = useMemo(() => {
    if (!toStop || effectiveFrom.id === toStop.id) return null;
    const best = findBestRouteBetween(effectiveFrom.id, toStop.id);
    if (!best) return null;
    const segment = routeSegmentBetween(best.routeId, effectiveFrom.id, toStop.id);
    if (!segment) return null;
    return {
      fromId: effectiveFrom.id,
      toId: toStop.id,
      routeId: best.routeId,
      segment,
    };
  }, [effectiveFrom, toStop]);

  const toggleRoute = (rid: RouteId) =>
    setHiddenRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(rid)) next.delete(rid);
      else next.add(rid);
      return next;
    });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {screen === "home" ? (
        <div className="fixed inset-0">
          <CampusMap
            selectedStopId={selectedStop?.id ?? null}
            onSelectStop={setSelectedStop}
            recenterTrigger={recenterTrigger}
            hiddenRoutes={hiddenRoutes}
            focus={focus}
          />
          <JourneyPlanner
            fromStop={effectiveFrom}
            toStop={toStop}
            isFromAuto={!fromManuallySet}
            onChangeFrom={(s) => {
              setFromStop(s);
              setFromManuallySet(true);
            }}
            onChangeTo={(s) => {
              setToStop(s);
              if (!s) {
                setFromManuallySet(false);
              }
            }}
          />
          {toStop && effectiveFrom.id !== toStop.id && (
            <EtaCard fromStop={effectiveFrom} toStop={toStop} />
          )}
          <MapFloatingControls
            onRecenter={() => setRecenterTrigger((n) => n + 1)}
            hiddenRoutes={hiddenRoutes}
            onToggleRoute={toggleRoute}
          />
          <BottomPanel
            selectedStop={selectedStop}
            onClearSelected={() => setSelectedStop(null)}
            forceCollapsed={!!focus}
          />
        </div>
      ) : screen === "schedule" ? (
        <SchedulePage />
      ) : screen === "nearby" ? (
        <NearbyPage />
      ) : (
        <AskPage />
      )}

      <TopBar />
      <BottomNav active={screen} onChange={setScreen} />
      <div
        className="pointer-events-none fixed bottom-1 left-2 z-[800] select-none text-[9px] leading-none text-muted-foreground/60"
        aria-label="copyright"
      >
        © Prateek Kannan 2026
      </div>
    </div>
  );
};

export default Index;

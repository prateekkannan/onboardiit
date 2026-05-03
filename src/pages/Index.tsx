import { useState } from "react";
import { CampusMap } from "@/components/onboard/CampusMap";
import { BottomPanel } from "@/components/onboard/BottomPanel";
import { BottomNav, type Screen } from "@/components/onboard/BottomNav";
import { SchedulePage } from "@/components/onboard/SchedulePage";
import { TopBar } from "@/components/onboard/TopBar";
import { AskPage } from "@/components/onboard/AskPage";
import type { Stop } from "@/data/stops";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {screen === "home" ? (
        <div className="fixed inset-0">
          <CampusMap
            selectedStopId={selectedStop?.id ?? null}
            onSelectStop={setSelectedStop}
          />
          <BottomPanel
            selectedStop={selectedStop}
            onClearSelected={() => setSelectedStop(null)}
          />
        </div>
      ) : screen === "schedule" ? (
        <SchedulePage />
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

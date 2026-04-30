import { useState } from "react";
import { CampusMap } from "@/components/onboard/CampusMap";
import { BottomPanel } from "@/components/onboard/BottomPanel";
import { BottomNav, type Screen } from "@/components/onboard/BottomNav";
import { SchedulePage } from "@/components/onboard/SchedulePage";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {screen === "home" ? (
        <div className="fixed inset-0">
          <CampusMap />
          <BottomPanel />
        </div>
      ) : (
        <SchedulePage />
      )}

      <BottomNav active={screen} onChange={setScreen} />
    </div>
  );
};

export default Index;

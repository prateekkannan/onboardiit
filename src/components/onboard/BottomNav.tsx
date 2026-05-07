import { Map as MapIcon, CalendarClock, Sparkles, Compass } from "lucide-react";

export type Screen = "home" | "schedule" | "nearby" | "ask";

interface BottomNavProps {
  active: Screen;
  onChange: (s: Screen) => void;
}

// Compact nav so it fits the safe area on small phones.
export const BOTTOM_NAV_HEIGHT = 60;

export const BottomNav = ({ active, onChange }: BottomNavProps) => {
  const tabs: Array<{ id: Screen; label: string; icon: React.ReactNode }> = [
    { id: "home", label: "Home", icon: <MapIcon className="h-[18px] w-[18px]" /> },
    { id: "schedule", label: "Schedule", icon: <CalendarClock className="h-[18px] w-[18px]" /> },
    { id: "nearby", label: "Nearby", icon: <Compass className="h-[18px] w-[18px]" /> },
    { id: "ask", label: "Ask", icon: <Sparkles className="h-[18px] w-[18px]" /> },
  ];

  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[700] flex items-end justify-center"
      style={{
        height: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)",
      }}
    >
      <div className="mx-2 mb-1 flex w-auto items-center justify-around gap-1 rounded-full border border-border bg-card/95 px-1.5 py-1 shadow-lg backdrop-blur">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                try {
                  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
                    navigator.vibrate(10);
                  }
                } catch {}
                onChange(t.id);
              }}
              className={`flex flex-col items-center justify-center rounded-full px-2.5 py-1 transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
              aria-label={t.label}
            >
              {t.icon}
              <span className="mt-0.5 font-semibold leading-none" style={{ fontSize: "10px" }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

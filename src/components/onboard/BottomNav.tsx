import { Map as MapIcon, CalendarClock, Sparkles, Compass } from "lucide-react";

export type Screen = "home" | "schedule" | "nearby" | "ask";

interface BottomNavProps {
  active: Screen;
  onChange: (s: Screen) => void;
}

// Exposed so other components (e.g. the bottom sheet) can sit above the nav.
export const BOTTOM_NAV_HEIGHT = 72;

export const BottomNav = ({ active, onChange }: BottomNavProps) => {
  const tabs: Array<{ id: Screen; label: string; icon: React.ReactNode }> = [
    { id: "home", label: "Home", icon: <MapIcon className="h-5 w-5" /> },
    {
      id: "schedule",
      label: "Schedule",
      icon: <CalendarClock className="h-5 w-5" />,
    },
    { id: "nearby", label: "Nearby", icon: <Compass className="h-5 w-5" /> },
    { id: "ask", label: "Ask", icon: <Sparkles className="h-5 w-5" /> },
  ];

  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[700] flex items-center justify-center pb-4"
      style={{ height: BOTTOM_NAV_HEIGHT }}
    >
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(50);
                }
                onChange(t.id);
              }}
              className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

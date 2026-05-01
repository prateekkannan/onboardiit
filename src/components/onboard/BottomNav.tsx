import { Map as MapIcon, CalendarClock } from "lucide-react";

export type Screen = "home" | "schedule";

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
  ];

  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[700] flex items-center justify-center pb-4"
      style={{ height: BOTTOM_NAV_HEIGHT }}
    >
      <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/95 p-1.5 shadow-lg backdrop-blur">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                isActive ? "bg-black text-white" : "text-black hover:bg-black/5"
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

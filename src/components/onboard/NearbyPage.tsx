import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Bed,
  Utensils,
  Building2,
  Dumbbell,
  BookOpen,
  Cross,
  Trees,
  MapPin,
  Check,
} from "lucide-react";
import { STOPS, getStop } from "@/data/stops";
import { useFavorites } from "@/hooks/useFavorites";
import { Heart } from "lucide-react";
import { ROUTES } from "@/data/routes";
import { NEARBY, CATEGORY_ORDER, STOP_HEADER_ROUTE, type Landmark, type LandmarkCategory } from "@/data/nearby";
import { useNearestStop } from "@/hooks/useNearestStop";
import { routeTextClass } from "@/lib/onboard";
import { BOTTOM_NAV_HEIGHT } from "./BottomNav";

const CATEGORY_ICON: Record<LandmarkCategory, React.ComponentType<{ className?: string }>> = {
  Departments: GraduationCap,
  Hostels: Bed,
  Food: Utensils,
  Sports: Dumbbell,
  "Admin and Services": Building2,
  Other: Trees,
};

function iconForLandmark(l: Landmark) {
  const n = l.name.toLowerCase();
  if (n.includes("library")) return BookOpen;
  if (n.includes("medical") || n.includes("hospital")) return Cross;
  if (n.includes("park") || n.includes("temple") || n.includes("ground") || n.includes("garden")) return Trees;
  return CATEGORY_ICON[l.category];
}

export const NearbyPage = () => {
  const { stop: nearest } = useNearestStop();
  const [stopId, setStopId] = useState<string>(nearest.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { favorites } = useFavorites();

  // Sync once when geo resolves and user hasn't manually changed.
  const stop = getStop(stopId) ?? nearest;
  const route = ROUTES[STOP_HEADER_ROUTE[stop.id] ?? "r1"];
  const textCls = routeTextClass(STOP_HEADER_ROUTE[stop.id] ?? "r1");

  const grouped = useMemo(() => {
    const list = NEARBY[stop.id] ?? [];
    const out: Record<LandmarkCategory, Landmark[]> = {
      Departments: [], Hostels: [], Food: [], Sports: [], "Admin and Services": [], Other: [],
    };
    for (const l of list) out[l.category].push(l);
    for (const k of CATEGORY_ORDER) out[k].sort((a, b) => a.minutes - b.minutes);
    return out;
  }, [stop.id]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 pb-4 pt-10 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Walkable from
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">Nearby</h1>

        <div className="mt-4">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold shadow-sm ${textCls}`}
            style={{ backgroundColor: route.hex }}
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
          >
            <MapPin className="h-4 w-4" />
            <span>{stop.name}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </header>

      {pickerOpen && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setPickerOpen(false)}
            aria-hidden
          />
          <div className="relative z-[70] mx-5 mt-3 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
            {favorites.length > 0 && (
              <>
                <div className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Saved
                </div>
                {favorites
                  .map((id) => STOPS.find((s) => s.id === id))
                  .filter((s): s is typeof STOPS[number] => Boolean(s))
                  .map((s) => {
                    const sel = s.id === stop.id;
                    return (
                      <button
                        key={`fav-${s.id}`}
                        onClick={() => { setStopId(s.id); setPickerOpen(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${sel ? "font-bold text-foreground" : "text-foreground"}`}
                      >
                        <span className="flex items-center gap-2">
                          <Heart className="h-3.5 w-3.5 fill-current text-[#ff3b6b]" />
                          {s.name}
                        </span>
                        {sel && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                <div className="my-1 border-t border-border" />
                <div className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  All stops
                </div>
              </>
            )}
            {STOPS.map((s) => {
              const sel = s.id === stop.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { setStopId(s.id); setPickerOpen(false); }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-muted ${sel ? "font-bold text-foreground" : "text-foreground"}`}
                >
                  <span>{s.name}</span>
                  {sel && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="space-y-4 px-5 pt-6">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (!items.length) return null;
          const isCollapsed = collapsed[cat] ?? false;
          const CatIcon = CATEGORY_ICON[cat];
          return (
            <section key={cat} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [cat]: !isCollapsed }))}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <CatIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground/70">
                    · {items.length}
                  </span>
                </div>
                {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {!isCollapsed && (
                <ul className="divide-y divide-border">
                  {items.map((l) => {
                    const Icon = iconForLandmark(l);
                    return (
                      <li key={l.name} className="flex items-center justify-between px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/70">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="truncate text-[14px] font-medium text-foreground">
                            {l.name}
                          </span>
                        </div>
                        <span className="ml-3 shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground">
                          {l.minutes} min
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}

        {(NEARBY[stop.id] ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No landmarks listed for this stop yet.</p>
        )}
      </div>

      <div style={{ height: BOTTOM_NAV_HEIGHT }} />
    </div>
  );
};
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import {
  CAMPUS_BOUNDS,
  CAMPUS_CENTER,
  STOPS,
  type Stop,
} from "@/data/stops";
import { ROUTES, ROUTE_ORDER, type RouteId } from "@/data/routes";
import { ROUTE_PATHS, type LL } from "@/data/roads";
import { useTheme } from "@/components/theme/ThemeProvider";
import stopIconLight from "@/assets/stop-icon-light.png";
import stopIconDark from "@/assets/stop-icon-dark.png";
import { useFavorites } from "@/hooks/useFavorites";

// ─────────────────── Icons ────────────────────
function makeStopIcon(active: boolean, dark: boolean, favorite: boolean, popKey?: number, faded?: boolean) {
  const baseSize = favorite ? 36 : 28;
  const size = active ? Math.max(baseSize, 40) : baseSize;
  const src = dark ? stopIconDark : stopIconLight;
  const heart = popKey
    ? `<span class="onboard-heart-pop" key="${popKey}">
         <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
           <path d="M12 21s-7-4.35-9.5-8.5C.7 9.4 2.3 6 5.5 6c1.9 0 3.4 1 4.5 2.6C11.1 7 12.6 6 14.5 6 17.7 6 19.3 9.4 17.5 12.5 19 16.65 12 21 12 21z"/>
         </svg>
       </span>`
    : "";
  const star = favorite
    ? `<span style="position:absolute;top:-2px;right:-2px;width:12px;height:12px;border-radius:9999px;background:#ff3b6b;border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>`
    : "";
  return L.divIcon({
    className: "leaflet-stop-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="onboard-stop ${active ? "is-active" : ""}" style="position:relative;opacity:${faded ? 0.12 : 1};
        width:${size}px;height:${size}px;
        display:flex;align-items:center;justify-content:center;
        transition: all 200ms ease;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
      ">
        <img src="${src}" style="width:100%;height:100%;object-fit:contain;display:block;" alt="stop"/>
        ${star}
        ${heart}
      </div>
    `,
  });
}

function makeBusIcon(routeId: RouteId) {
  const c = ROUTES[routeId].hex;
  return L.divIcon({
    className: "leaflet-bus-dot",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `
      <div style="position:relative;width:22px;height:22px;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:${c};opacity:0.35;animation:pulse-ring 2.4s ease-in-out infinite;"></div>
        <div style="position:absolute;inset:5px;border-radius:9999px;background:${c};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
      </div>
    `,
  });
}

function makeUserIcon() {
  return L.divIcon({
    className: "leaflet-user-pin",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:#1d4ed8;opacity:0.18;animation:pulse-ring 2.2s ease-in-out infinite;"></div>
        <div style="position:absolute;inset:11px;border-radius:9999px;background:#1d4ed8;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6v.5H5z"/></svg>
        </div>
      </div>
    `,
  });
}

// ───────── Path geometry helpers ─────────
function pathLengths(path: LL[]) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dx = (b[1] - a[1]) * 108400;
    const dy = (b[0] - a[0]) * 111130;
    const len = Math.sqrt(dx * dx + dy * dy);
    segs.push(len);
    total += len;
  }
  return { segs, total };
}

/** Position at given meters along path, ping-ponging back and forth. */
function interpolatePingPong(
  path: LL[],
  segs: number[],
  total: number,
  meters: number,
): LL {
  if (total === 0 || path.length < 2) return path[0];
  const cycle = total * 2;
  let m = ((meters % cycle) + cycle) % cycle;
  // Reverse direction on second half.
  if (m > total) m = cycle - m;
  let acc = 0;
  for (let i = 0; i < segs.length; i++) {
    const len = segs[i];
    if (acc + len >= m) {
      const f = len === 0 ? 0 : (m - acc) / len;
      const a = path[i];
      const b = path[i + 1];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    acc += len;
  }
  return path[path.length - 1];
}

const BUS_SPEED_MPS = (20 * 1000) / 3600; // 20 km/h ≈ 5.55 m/s

// Offset a polyline perpendicular to each segment by `meters`.
// Positive = right of travel direction. Used to render overlapping routes
// as parallel lines so every colour stays visible.
function offsetPath(path: LL[], meters: number): LL[] {
  if (meters === 0 || path.length < 2) return path;
  const out: LL[] = [];
  const mPerLat = 111130;
  const latRef = path[0][0];
  const mPerLng = 111320 * Math.cos((latRef * Math.PI) / 180);
  for (let i = 0; i < path.length; i++) {
    // average direction at vertex
    const prev = path[i - 1] ?? path[i];
    const next = path[i + 1] ?? path[i];
    const dx = (next[1] - prev[1]) * mPerLng;
    const dy = (next[0] - prev[0]) * mPerLat;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // perpendicular to the right of travel: (dy, -dx)
    const nx = dy / len;
    const ny = -dx / len;
    const p = path[i];
    out.push([p[0] + (ny * meters) / mPerLat, p[1] + (nx * meters) / mPerLng]);
  }
  return out;
}

// Spacing in meters between adjacent parallel route lines.
const ROUTE_OFFSET_M = 6;
const ROUTE_OFFSET_INDEX: Record<RouteId, number> = {
  r1: -2.5, r2: -1.5, r3: -0.5, r4: 0.5, r5: 1.5, r6: 2.5,
};

// ───────── Map effects ─────────
const FitToCampus = () => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(CAMPUS_BOUNDS, { padding: [24, 24] });
  }, [map]);
  return null;
};

interface CampusMapProps {
  selectedStopId?: string | null;
  onSelectStop?: (s: Stop) => void;
  /** Increment to trigger a smooth re-centre on the user's nearest stop. */
  recenterTrigger?: number;
  /** Routes that should be visually hidden (faded near-invisible). */
  hiddenRoutes?: Set<RouteId>;
}

interface BusMarker {
  id: string;
  routeId: RouteId;
  pos: LL;
}

function RecenterOnTrigger({
  trigger,
  target,
}: {
  trigger: number | undefined;
  target: LL | null;
}) {
  const map = useMap();
  const last = useRef<number | undefined>(trigger);
  useEffect(() => {
    if (trigger === undefined || trigger === last.current) return;
    last.current = trigger;
    if (target) map.flyTo(target, 17, { duration: 0.9 });
  }, [trigger, target, map]);
  return null;
}

export const CampusMap = ({ selectedStopId, onSelectStop, recenterTrigger, hiddenRoutes }: CampusMapProps) => {
  const [tMs, setTMs] = useState<number>(() => Date.now());
  const [userPos, setUserPos] = useState<LL | null>(null);
  const startedAt = useRef<number>(Date.now());
  const { resolvedTheme } = useTheme();
  const { isFavorite, toggle } = useFavorites();
  const [popMap, setPopMap] = useState<Record<string, number>>({});
  const tapRef = useRef<Record<string, number>>({});

  // Animation tick
  useEffect(() => {
    const id = window.setInterval(() => setTMs(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  // Geolocation
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  // Use fixed hand-drawn road geometry — strictly on the three campus roads.
  const paths = ROUTE_PATHS;

  const lengths = useMemo(() => {
    const out: Partial<Record<RouteId, ReturnType<typeof pathLengths>>> = {};
    (Object.keys(paths) as RouteId[]).forEach((r) => {
      out[r] = pathLengths(paths[r]!);
    });
    return out;
  }, []);

  // Two buses per route, offset along the route.
  const busSpecs = useMemo(
    () =>
      ROUTE_ORDER.flatMap((rid) => [
        { id: `${rid}-a`, routeId: rid, offsetM: 0 },
        { id: `${rid}-b`, routeId: rid, offsetM: 800 },
      ]),
    [],
  );

  const seconds = (tMs - startedAt.current) / 1000;
  const liveBuses: BusMarker[] = busSpecs
    .map((b) => {
      const path = paths[b.routeId];
      const len = lengths[b.routeId];
      if (!path || !len || path.length < 2) return null;
      const m = b.offsetM + BUS_SPEED_MPS * seconds;
      return {
        id: b.id,
        routeId: b.routeId,
        pos: interpolatePingPong(path, len.segs, len.total, m),
      };
    })
    .filter(Boolean) as BusMarker[];

  const tileUrl =
    resolvedTheme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={15}
      minZoom={13}
      maxZoom={18}
      zoomControl={false}
      attributionControl={true}
      style={{ width: "100%", height: "100%" }}
    >
      <FitToCampus />
      <RecenterOnTrigger
        trigger={recenterTrigger}
        target={
          userPos
            ? (() => {
                let best: Stop = STOPS[0];
                let bestD = Infinity;
                for (const s of STOPS) {
                  const dx = (s.lng - userPos[1]) * 108400;
                  const dy = (s.lat - userPos[0]) * 111130;
                  const d = dx * dx + dy * dy;
                  if (d < bestD) { bestD = d; best = s; }
                }
                return [best.lat, best.lng] as LL;
              })()
            : null
        }
      />

      <TileLayer
        key={resolvedTheme}
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url={tileUrl}
      />

      {ROUTE_ORDER.map((rid) =>
        paths[rid] ? (
          <Polyline
            key={rid}
            positions={offsetPath(paths[rid]!, ROUTE_OFFSET_INDEX[rid] * ROUTE_OFFSET_M)}
            pathOptions={{
              color: ROUTES[rid].hex,
              weight: hiddenRoutes?.has(rid) ? 2 : 5,
              opacity: hiddenRoutes?.has(rid) ? 0.06 : 0.85,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ) : null,
      )}

      {STOPS.map((s) => {
        const allHidden =
          hiddenRoutes && s.routes.length > 0 && s.routes.every((r) => hiddenRoutes.has(r));
        return (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={makeStopIcon(
            selectedStopId === s.id,
            resolvedTheme === "dark",
            isFavorite(s.id),
            popMap[s.id],
            allHidden,
          )}
          eventHandlers={{
            click: () => {
              const now = Date.now();
              const last = tapRef.current[s.id] ?? 0;
              if (now - last < 320) {
                // Double-tap → toggle favorite with stronger haptic + heart pulse.
                tapRef.current[s.id] = 0;
                const added = toggle(s.id);
                if (added && typeof navigator !== "undefined" && navigator.vibrate) {
                  try { navigator.vibrate([4, 30, 6]); } catch {}
                }
                setPopMap((m) => ({ ...m, [s.id]: now }));
                window.setTimeout(() => {
                  setPopMap((m) => {
                    const { [s.id]: _, ...rest } = m;
                    return rest;
                  });
                }, 750);
                return;
              }
              tapRef.current[s.id] = now;
              try {
                if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
                  navigator.vibrate(6);
                }
              } catch {}
              onSelectStop?.(s);
            },
          }}
        />
        );
      })}

      {liveBuses.map((b) => (
        <Marker key={b.id} position={b.pos} icon={makeBusIcon(b.routeId)} />
      ))}

      {userPos && <Marker position={userPos} icon={makeUserIcon()} />}
    </MapContainer>
  );
};

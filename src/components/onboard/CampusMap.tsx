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

// ─────────────────── Icons ────────────────────
function makeStopIcon(active: boolean, dark: boolean) {
  const size = active ? 38 : 28;
  const src = dark ? stopIconDark : stopIconLight;
  return L.divIcon({
    className: "leaflet-stop-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="onboard-stop ${active ? "is-active" : ""}" style="
        width:${size}px;height:${size}px;
        display:flex;align-items:center;justify-content:center;
        transition: all 200ms ease;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
      ">
        <img src="${src}" style="width:100%;height:100%;object-fit:contain;display:block;" alt="stop"/>
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
}

interface BusMarker {
  id: string;
  routeId: RouteId;
  pos: LL;
}

export const CampusMap = ({ selectedStopId, onSelectStop }: CampusMapProps) => {
  const [tMs, setTMs] = useState<number>(() => Date.now());
  const [userPos, setUserPos] = useState<LL | null>(null);
  const startedAt = useRef<number>(Date.now());
  const { resolvedTheme } = useTheme();

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

      <TileLayer
        key={resolvedTheme}
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url={tileUrl}
      />

      {ROUTE_ORDER.map((rid) =>
        paths[rid] ? (
          <Polyline
            key={rid}
            positions={paths[rid]!}
            pathOptions={{
              color: ROUTES[rid].hex,
              weight: 5,
              opacity: 0.85,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ) : null,
      )}

      {STOPS.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={makeStopIcon(selectedStopId === s.id, resolvedTheme === "dark")}
          eventHandlers={{
            click: () => {
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(25);
              }
              onSelectStop?.(s);
            },
          }}
        />
      ))}

      {liveBuses.map((b) => (
        <Marker key={b.id} position={b.pos} icon={makeBusIcon(b.routeId)} />
      ))}

      {userPos && <Marker position={userPos} icon={makeUserIcon()} />}
    </MapContainer>
  );
};

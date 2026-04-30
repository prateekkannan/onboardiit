import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { CAMPUS_CENTER, STOPS, type Stop } from "@/data/stops";
import { ROUTES, type RouteId } from "@/data/routes";

// Polylines along the actual avenues:
//   Bonn Ave, Delhi Ave, Alumni Ave, Playfield Ave, Hostel Ave.
// All stops on each route lie ON the polyline.
const ROUTE_PATHS: Record<RouteId, [number, number][]> = {
  // Main Gate ↘ Admin ↘ Gajendra Circle ↘ Library (Bonn → Delhi)
  mainGate: [
    [12.9916, 80.2337], // Main Gate
    [12.9911, 80.2336],
    [12.9905, 80.2336], // Admin
    [12.9901, 80.2335],
    [12.9897, 80.2335], // Gajendra Circle
    [12.9897, 80.2342],
    [12.9897, 80.2348], // Central Library
    [12.9901, 80.2348],
    [12.9905, 80.2348], // HSB
    [12.9905, 80.2342],
    [12.9905, 80.2336],
    [12.9911, 80.2336],
  ],
  // Hostel Avenue loop
  hostel: [
    [12.9897, 80.2335], // Gajendra Circle
    [12.9888, 80.2342],
    [12.9879, 80.2348], // Himalaya Mess
    [12.9874, 80.2351],
    [12.9870, 80.2354], // Ganga
    [12.9865, 80.2357],
    [12.9860, 80.2360], // Tapti
    [12.9856, 80.2363],
    [12.9852, 80.2366], // Saraswathi
    [12.9856, 80.2363],
    [12.9860, 80.2360],
    [12.9865, 80.2357],
    [12.9870, 80.2354],
    [12.9874, 80.2351],
    [12.9879, 80.2348],
    [12.9888, 80.2342],
  ],
  // Velachery shuttle: Gajendra → EE → Saraswathi → Taramani GH → Velachery Gate
  velachery: [
    [12.9897, 80.2335],
    [12.9902, 80.2348],
    [12.9905, 80.2362],
    [12.9908, 80.2378], // EE
    [12.9900, 80.2380],
    [12.9890, 80.2378],
    [12.9876, 80.2372],
    [12.9860, 80.2368],
    [12.9852, 80.2366], // Saraswathi
    [12.9844, 80.2374], // Taramani GH
    [12.9838, 80.2381],
    [12.9832, 80.2388], // Velachery Gate
    [12.9838, 80.2381],
    [12.9844, 80.2374],
    [12.9852, 80.2366],
    [12.9860, 80.2368],
    [12.9876, 80.2372],
    [12.9890, 80.2378],
    [12.9900, 80.2380],
    [12.9908, 80.2378],
    [12.9905, 80.2362],
    [12.9902, 80.2348],
  ],
  // Gajendra: Alumni Avenue + Playfield Avenue inner loop
  gajendra: [
    [12.9905, 80.2336], // Admin
    [12.9897, 80.2335], // Gajendra Circle
    [12.9897, 80.2348], // Library
    [12.9898, 80.2358], // CLT
    [12.9905, 80.2358],
    [12.9909, 80.2358], // MechE
    [12.9912, 80.2369], // Civil
    [12.9908, 80.2378], // EE
    [12.9900, 80.2370],
    [12.9893, 80.2360],
    [12.9889, 80.2342], // OAT
    [12.9883, 80.2333], // Stadium
    [12.9876, 80.2326], // SAC
    [12.9866, 80.2334],
    [12.9860, 80.2360], // Tapti
    [12.9866, 80.2354],
    [12.9876, 80.2335],
    [12.9883, 80.2333],
    [12.9889, 80.2342],
    [12.9897, 80.2335],
  ],
  // E-Cart: dense full-campus loop touching everything
  ecart: [
    [12.9916, 80.2337],
    [12.9905, 80.2336],
    [12.9905, 80.2348], // HSB
    [12.9909, 80.2358], // MechE
    [12.9912, 80.2369], // Civil
    [12.9908, 80.2378], // EE
    [12.9902, 80.2386], // Biotech
    [12.9890, 80.2380],
    [12.9876, 80.2372],
    [12.9860, 80.2368],
    [12.9852, 80.2366], // Saraswathi
    [12.9844, 80.2374], // Taramani GH
    [12.9852, 80.2366],
    [12.9860, 80.2360], // Tapti
    [12.9870, 80.2354], // Ganga
    [12.9879, 80.2348], // Himalaya
    [12.9888, 80.2342],
    [12.9889, 80.2342], // OAT
    [12.9883, 80.2333], // Stadium
    [12.9876, 80.2326], // SAC
    [12.9883, 80.2333],
    [12.9897, 80.2335], // Gajendra Circle
    [12.9897, 80.2348], // Library
    [12.9898, 80.2358], // CLT
    [12.9905, 80.2348],
    [12.9905, 80.2336],
    [12.9911, 80.2336],
  ],
};

function busSvg(color: string) {
  // Simple bus glyph in white, on a colored circle.
  return `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="5" width="16" height="12" rx="2.5" fill="${color}" stroke="white"/>
      <path d="M4 11h16"/>
      <circle cx="8" cy="18" r="1.4" fill="white" stroke="white"/>
      <circle cx="16" cy="18" r="1.4" fill="white" stroke="white"/>
    </svg>`;
}

function makeStopIcon(routeIds: RouteId[], active: boolean) {
  const primary = ROUTES[routeIds[0]].hex;
  const size = active ? 34 : 26;
  return L.divIcon({
    className: "leaflet-stop-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="onboard-stop ${active ? "is-active" : ""}" style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:white;
        display:flex;align-items:center;justify-content:center;
        border:2px solid ${primary};
        box-shadow:0 3px 10px rgba(0,0,0,0.18);
        transition: all 200ms ease;
      ">
        ${busSvg(primary)}
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
        <div style="
          position:absolute;inset:0;border-radius:9999px;
          background:${c};opacity:0.35;
          animation:pulse-ring 2.4s ease-in-out infinite;
        "></div>
        <div style="
          position:absolute;inset:5px;border-radius:9999px;
          background:${c};
          border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
  });
}

interface BusMarker {
  id: string;
  routeId: RouteId;
  pos: [number, number];
}

function pathLengths(path: [number, number][]) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < path.length; i++) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    const dx = (b[1] - a[1]) * 108400;
    const dy = (b[0] - a[0]) * 111130;
    const len = Math.sqrt(dx * dx + dy * dy);
    segs.push(len);
    total += len;
  }
  return { segs, total };
}

function interpolateAtMeters(
  path: [number, number][],
  segs: number[],
  total: number,
  meters: number,
): [number, number] {
  const m = ((meters % total) + total) % total;
  let acc = 0;
  for (let i = 0; i < path.length; i++) {
    const len = segs[i];
    if (acc + len >= m) {
      const f = len === 0 ? 0 : (m - acc) / len;
      const a = path[i];
      const b = path[(i + 1) % path.length];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    acc += len;
  }
  return path[0];
}

const BUS_SPEED_MPS = 5.5;   // 20 km/h
const ECART_SPEED_MPS = 3.3; // 12 km/h

interface CampusMapProps {
  selectedStopId?: string | null;
  onSelectStop?: (s: Stop) => void;
}

export const CampusMap = ({ selectedStopId, onSelectStop }: CampusMapProps) => {
  const [tMs, setTMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTMs(Date.now()), 120);
    return () => window.clearInterval(id);
  }, []);

  const lengths = useMemo(() => {
    const out = {} as Record<RouteId, ReturnType<typeof pathLengths>>;
    (Object.keys(ROUTE_PATHS) as RouteId[]).forEach(
      (r) => (out[r] = pathLengths(ROUTE_PATHS[r])),
    );
    return out;
  }, []);

  const buses = useMemo<
    Array<{ id: string; routeId: RouteId; offsetM: number; speed: number }>
  >(
    () => [
      { id: "mg-1", routeId: "mainGate", offsetM: 0, speed: BUS_SPEED_MPS },
      { id: "mg-2", routeId: "mainGate", offsetM: 220, speed: BUS_SPEED_MPS },
      { id: "hz-1", routeId: "hostel", offsetM: 0, speed: BUS_SPEED_MPS },
      { id: "hz-2", routeId: "hostel", offsetM: 380, speed: BUS_SPEED_MPS },
      { id: "vg-1", routeId: "velachery", offsetM: 0, speed: BUS_SPEED_MPS },
      { id: "gc-1", routeId: "gajendra", offsetM: 0, speed: BUS_SPEED_MPS },
      { id: "gc-2", routeId: "gajendra", offsetM: 500, speed: BUS_SPEED_MPS },
      { id: "ec-1", routeId: "ecart", offsetM: 0, speed: ECART_SPEED_MPS },
      { id: "ec-2", routeId: "ecart", offsetM: 400, speed: ECART_SPEED_MPS },
      { id: "ec-3", routeId: "ecart", offsetM: 800, speed: ECART_SPEED_MPS },
    ],
    [],
  );

  const seconds = tMs / 1000;
  const liveBuses: BusMarker[] = buses.map((b) => {
    const { segs, total } = lengths[b.routeId];
    const m = b.offsetM + b.speed * seconds;
    return {
      id: b.id,
      routeId: b.routeId,
      pos: interpolateAtMeters(ROUTE_PATHS[b.routeId], segs, total, m),
    };
  });

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={16}
      minZoom={14}
      maxZoom={18}
      zoomControl={false}
      attributionControl={true}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {(Object.keys(ROUTE_PATHS) as RouteId[]).map((rid) => (
        <Polyline
          key={rid}
          positions={ROUTE_PATHS[rid]}
          pathOptions={{
            color: ROUTES[rid].hex,
            weight: 3,
            opacity: 0.35,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}

      {STOPS.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={makeStopIcon(s.routes, selectedStopId === s.id)}
          eventHandlers={{
            click: () => onSelectStop?.(s),
          }}
        />
      ))}

      {liveBuses.map((b) => (
        <Marker key={b.id} position={b.pos} icon={makeBusIcon(b.routeId)} />
      ))}
    </MapContainer>
  );
};

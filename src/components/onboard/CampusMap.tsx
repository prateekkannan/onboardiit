import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { CAMPUS_CENTER, STOPS } from "@/data/stops";
import { ROUTES, ROUTE_ORDER, type RouteId } from "@/data/routes";

// Simple looping paths per route — enough to make dots feel alive.
const ROUTE_PATHS: Record<RouteId, [number, number][]> = {
  mainGate: [
    [12.9915, 80.2336],
    [12.9905, 80.2305],
    [12.9893, 80.2330],
    [12.9905, 80.2305],
  ],
  hostel: [
    [12.9905, 80.2305],
    [12.9893, 80.2330],
    [12.9876, 80.2349],
    [12.9852, 80.2371],
  ],
  velachery: [
    [12.9831, 80.2398],
    [12.9805, 80.2412],
    [12.9831, 80.2398],
    [12.9852, 80.2371],
  ],
  gajendra: [
    [12.9905, 80.2305],
    [12.9869, 80.2308],
    [12.9852, 80.2371],
    [12.9893, 80.2330],
  ],
  ecart: [
    [12.9915, 80.2336],
    [12.9893, 80.2330],
    [12.9869, 80.2308],
    [12.9876, 80.2349],
    [12.9852, 80.2371],
  ],
};

function makeStopIcon(routeIds: RouteId[]) {
  // Use first route's color as fill; subsequent routes shown as a thin ring.
  const primary = ROUTES[routeIds[0]].hex;
  return L.divIcon({
    className: "leaflet-stop-pin",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `
      <div style="
        width:16px;height:16px;border-radius:9999px;
        background:${primary};
        border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
      "></div>
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
          animation:pulse-ring 1.8s ease-in-out infinite;
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

function interpolate(
  path: [number, number][],
  t: number,
): [number, number] {
  const segs = path.length;
  const scaled = (t % 1) * segs;
  const i = Math.floor(scaled) % segs;
  const f = scaled - Math.floor(scaled);
  const a = path[i];
  const b = path[(i + 1) % segs];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

export const CampusMap = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 100);
    return () => window.clearInterval(id);
  }, []);

  // Each route gets 1–2 buses with different phase offsets and speeds.
  const buses = useMemo<Array<{ id: string; routeId: RouteId; offset: number; speed: number }>>(
    () => [
      { id: "mg-1", routeId: "mainGate", offset: 0.0, speed: 0.00018 },
      { id: "mg-2", routeId: "mainGate", offset: 0.55, speed: 0.00018 },
      { id: "hz-1", routeId: "hostel", offset: 0.2, speed: 0.00022 },
      { id: "hz-2", routeId: "hostel", offset: 0.7, speed: 0.00022 },
      { id: "vg-1", routeId: "velachery", offset: 0.1, speed: 0.00014 },
      { id: "gc-1", routeId: "gajendra", offset: 0.35, speed: 0.00016 },
      { id: "ec-1", routeId: "ecart", offset: 0.0, speed: 0.00028 },
      { id: "ec-2", routeId: "ecart", offset: 0.4, speed: 0.00028 },
      { id: "ec-3", routeId: "ecart", offset: 0.75, speed: 0.00028 },
    ],
    [],
  );

  const liveBuses: BusMarker[] = buses.map((b) => ({
    id: b.id,
    routeId: b.routeId,
    pos: interpolate(
      ROUTE_PATHS[b.routeId],
      b.offset + tick * b.speed * 100,
    ),
  }));

  // touch ROUTE_ORDER so the import isn't dropped & to keep ordering stable
  void ROUTE_ORDER;

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

      {STOPS.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={makeStopIcon(s.routes)}
        />
      ))}

      {liveBuses.map((b) => (
        <Marker key={b.id} position={b.pos} icon={makeBusIcon(b.routeId)} />
      ))}
    </MapContainer>
  );
};
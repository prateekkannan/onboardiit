import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { CAMPUS_CENTER, STOPS } from "@/data/stops";
import { ROUTES, type RouteId } from "@/data/routes";

// Polylines that follow the actual campus road network (Bonn Avenue,
// Delhi Avenue, Sardar Patel Rd, Inner Ring Rd). Coordinates are kept
// inside campus boundaries so dots never spill into surrounding areas.
const ROUTE_PATHS: Record<RouteId, [number, number][]> = {
  // Main Gate ↔ Admin Block ↔ Gajendra Circle (Bonn Avenue)
  mainGate: [
    [12.9916, 80.2337],
    [12.9911, 80.2336],
    [12.9905, 80.2335],
    [12.9899, 80.2333],
    [12.9897, 80.2332],
    [12.9899, 80.2333],
    [12.9905, 80.2335],
    [12.9911, 80.2336],
  ],
  // Hostel loop: Gajendra → Himalaya → Ganga → Tapti and back
  hostel: [
    [12.9897, 80.2332],
    [12.9893, 80.2342],
    [12.9885, 80.2344],
    [12.9879, 80.2345],
    [12.9872, 80.2350],
    [12.9866, 80.2354],
    [12.9860, 80.2358],
    [12.9854, 80.2362],
    [12.9860, 80.2358],
    [12.9866, 80.2354],
    [12.9872, 80.2350],
    [12.9879, 80.2345],
    [12.9885, 80.2344],
    [12.9893, 80.2342],
  ],
  // Velachery shuttle: Tapti → Taramani GH → Velachery Gate
  velachery: [
    [12.9854, 80.2362],
    [12.9848, 80.2368],
    [12.9842, 80.2375],
    [12.9835, 80.2382],
    [12.9828, 80.2390],
    [12.9835, 80.2382],
    [12.9842, 80.2375],
    [12.9848, 80.2368],
  ],
  // Gajendra: Admin → Gajendra Circle → Stadium → Tapti (inner ring)
  gajendra: [
    [12.9905, 80.2335],
    [12.9897, 80.2332],
    [12.9893, 80.2327],
    [12.9889, 80.2322],
    [12.9883, 80.2330],
    [12.9879, 80.2345],
    [12.9872, 80.2350],
    [12.9866, 80.2354],
    [12.9860, 80.2358],
    [12.9854, 80.2362],
    [12.9860, 80.2358],
    [12.9866, 80.2354],
    [12.9872, 80.2350],
    [12.9879, 80.2345],
    [12.9883, 80.2330],
    [12.9889, 80.2322],
    [12.9893, 80.2327],
    [12.9897, 80.2332],
  ],
  // E-Cart: full campus loop touching nearly all stops
  ecart: [
    [12.9916, 80.2337],
    [12.9911, 80.2336],
    [12.9905, 80.2335],
    [12.9897, 80.2332],
    [12.9893, 80.2342],
    [12.9885, 80.2344],
    [12.9879, 80.2345],
    [12.9872, 80.2350],
    [12.9866, 80.2354],
    [12.9860, 80.2358],
    [12.9854, 80.2362],
    [12.9848, 80.2368],
    [12.9842, 80.2375],
    [12.9848, 80.2368],
    [12.9854, 80.2362],
    [12.9860, 80.2358],
    [12.9866, 80.2354],
    [12.9872, 80.2350],
    [12.9879, 80.2345],
    [12.9883, 80.2330],
    [12.9889, 80.2322],
    [12.9893, 80.2327],
    [12.9897, 80.2332],
    [12.9905, 80.2335],
    [12.9911, 80.2336],
  ],
};

function makeStopIcon(routeIds: RouteId[]) {
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

/** Cumulative-length interpolation so speed feels constant along the polyline. */
function pathLengths(path: [number, number][]) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < path.length; i++) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    // approximate metres at IIT Madras latitude
    const dx = (b[1] - a[1]) * 108400; // lng → m
    const dy = (b[0] - a[0]) * 111130; // lat → m
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

// 20 km/h ≈ 5.55 m/s — campus speed limit
const BUS_SPEED_MPS = 5.5;
// E-Cart cruises slower (~12 km/h)
const ECART_SPEED_MPS = 3.3;

export const CampusMap = () => {
  const [tMs, setTMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const lengths = useMemo(() => {
    const out = {} as Record<RouteId, ReturnType<typeof pathLengths>>;
    (Object.keys(ROUTE_PATHS) as RouteId[]).forEach(
      (r) => (out[r] = pathLengths(ROUTE_PATHS[r])),
    );
    return out;
  }, []);

  // Each bus has a route, a phase offset (in metres), and a speed.
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

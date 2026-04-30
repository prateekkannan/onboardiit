import type { RouteId } from "./routes";

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: RouteId[];
}

// IIT Madras campus stops — coordinates lie on actual campus roads
// (Bonn Avenue / Delhi Avenue / Sardar Patel Rd / Inner Ring Rd) and are
// named after the nearest landmark building.
export const STOPS: Stop[] = [
  {
    id: "main-gate",
    name: "Main Gate",
    lat: 12.9916,
    lng: 80.2337,
    routes: ["mainGate", "ecart"],
  },
  {
    id: "admin-block",
    name: "Administrative Block",
    lat: 12.9905,
    lng: 80.2335,
    routes: ["mainGate", "gajendra", "ecart"],
  },
  {
    id: "gajendra-circle",
    name: "Gajendra Circle",
    lat: 12.9897,
    lng: 80.2332,
    routes: ["mainGate", "hostel", "gajendra", "ecart"],
  },
  {
    id: "central-library",
    name: "Central Library",
    lat: 12.9893,
    lng: 80.2342,
    routes: ["mainGate", "gajendra", "ecart"],
  },
  {
    id: "stadium",
    name: "Stadium",
    lat: 12.9889,
    lng: 80.2322,
    routes: ["gajendra", "ecart"],
  },
  {
    id: "himalaya-mess",
    name: "Himalaya Mess",
    lat: 12.9879,
    lng: 80.2345,
    routes: ["hostel", "ecart"],
  },
  {
    id: "ganga-hostel",
    name: "Ganga Hostel",
    lat: 12.9866,
    lng: 80.2354,
    routes: ["hostel", "ecart"],
  },
  {
    id: "tapti-hostel",
    name: "Tapti Hostel",
    lat: 12.9854,
    lng: 80.2362,
    routes: ["hostel", "gajendra", "ecart"],
  },
  {
    id: "taramani-guest-house",
    name: "Taramani Guest House",
    lat: 12.9842,
    lng: 80.2375,
    routes: ["velachery", "ecart"],
  },
  {
    id: "velachery-gate",
    name: "Velachery Gate",
    lat: 12.9828,
    lng: 80.2390,
    routes: ["velachery"],
  },
];

// Default fallback nearest stop (used until geolocation resolves or if denied).
export const NEAREST_STOP_ID = "gajendra-circle";

// IIT Madras campus center
export const CAMPUS_CENTER: [number, number] = [12.9889, 80.2348];

/** Haversine distance in metres between two lat/lng points. */
export function distanceMeters(
  a: [number, number],
  b: [number, number],
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Returns the stop closest to the given coordinate. */
export function findNearestStop(coord: [number, number]): Stop {
  let best = STOPS[0];
  let bestD = distanceMeters(coord, [best.lat, best.lng]);
  for (const s of STOPS) {
    const d = distanceMeters(coord, [s.lat, s.lng]);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
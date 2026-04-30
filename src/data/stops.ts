import type { RouteId } from "./routes";

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: RouteId[];
}

// IIT Madras campus stops placed along the actual road network:
//  - Bonn Avenue   : Main Gate → Admin → Gajendra Circle (N–S spine)
//  - Delhi Avenue  : Gajendra Circle → eastward across academic zone
//  - Alumni Avenue : long E–W spine through academics & central facilities
//  - Playfield Avenue : along OAT / Stadium / Sports complex
//  - Hostel Avenue : down the hostel zone (Himalaya → Tapti)
//
// All coordinates kept inside campus (≈12.985–12.992 N, 80.230–80.240 E).
export const STOPS: Stop[] = [
  // ── Bonn Avenue ────────────────────────────────────────────────
  { id: "main-gate",        name: "Main Gate",                  lat: 12.9916, lng: 80.2337, routes: ["mainGate", "ecart"] },
  { id: "admin-block",      name: "Administrative Block",       lat: 12.9905, lng: 80.2336, routes: ["mainGate", "gajendra", "ecart"] },
  { id: "gajendra-circle",  name: "Gajendra Circle",            lat: 12.9897, lng: 80.2335, routes: ["mainGate", "hostel", "gajendra", "velachery", "ecart"] },

  // ── Delhi Avenue (E from Gajendra Circle) ──────────────────────
  { id: "central-library",  name: "Central Library",            lat: 12.9897, lng: 80.2348, routes: ["mainGate", "gajendra", "ecart"] },
  { id: "clt",              name: "CLT (Central Lecture Theatre)", lat: 12.9898, lng: 80.2358, routes: ["gajendra", "ecart"] },

  // ── Alumni Avenue (E–W academic spine) ─────────────────────────
  { id: "humanities",       name: "HSB (Humanities & Sciences)", lat: 12.9905, lng: 80.2348, routes: ["mainGate", "gajendra", "ecart"] },
  { id: "meche-dept",       name: "MechE Department",            lat: 12.9909, lng: 80.2358, routes: ["gajendra", "ecart"] },
  { id: "civile-dept",      name: "Civil Engg Department",       lat: 12.9912, lng: 80.2369, routes: ["gajendra", "ecart"] },
  { id: "ee-dept",          name: "EE Department",               lat: 12.9908, lng: 80.2378, routes: ["gajendra", "velachery", "ecart"] },
  { id: "biotech",          name: "Biotech Block",               lat: 12.9902, lng: 80.2386, routes: ["velachery", "ecart"] },

  // ── Playfield Avenue (Stadium / OAT / Sports) ──────────────────
  { id: "oat",              name: "Open Air Theatre",            lat: 12.9889, lng: 80.2342, routes: ["gajendra", "ecart"] },
  { id: "stadium",          name: "Chemplast Stadium",           lat: 12.9883, lng: 80.2333, routes: ["gajendra", "ecart"] },
  { id: "sac",              name: "Students Activities Centre",  lat: 12.9876, lng: 80.2326, routes: ["gajendra", "ecart"] },

  // ── Hostel Avenue (S through hostel zone) ──────────────────────
  { id: "himalaya-mess",    name: "Himalaya Mess",               lat: 12.9879, lng: 80.2348, routes: ["hostel", "ecart"] },
  { id: "ganga-hostel",     name: "Ganga Hostel",                lat: 12.9870, lng: 80.2354, routes: ["hostel", "ecart"] },
  { id: "tapti-hostel",     name: "Tapti Hostel",                lat: 12.9860, lng: 80.2360, routes: ["hostel", "gajendra", "ecart"] },
  { id: "saraswathi-hostel",name: "Saraswathi Hostel",           lat: 12.9852, lng: 80.2366, routes: ["hostel", "velachery", "ecart"] },

  // ── Velachery branch ───────────────────────────────────────────
  { id: "taramani-gh",      name: "Taramani Guest House",        lat: 12.9844, lng: 80.2374, routes: ["velachery", "ecart"] },
  { id: "velachery-gate",   name: "Velachery Gate",              lat: 12.9832, lng: 80.2388, routes: ["velachery"] },
];

export const NEAREST_STOP_ID = "gajendra-circle";
export const CAMPUS_CENTER: [number, number] = [12.9889, 80.2355];

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

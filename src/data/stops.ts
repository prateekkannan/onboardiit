import type { RouteId } from "./routes";

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: RouteId[];
}

// Exact GPS coordinates for IIT Madras campus stops — do not adjust.
export const STOPS: Stop[] = [
  { id: "main-gate",   name: "Main Gate",                       lat: 13.0060118, lng: 80.2418353, routes: ["r1","r2","r4"] },
  { id: "d1-bonn",     name: "D1 Bonn Avenue",                  lat: 13.0026140, lng: 80.2401673, routes: ["r1","r2","r4"] },
  { id: "school-bonn", name: "School Bonn Avenue",              lat: 12.9988140, lng: 80.2392483, routes: ["r1","r2","r4"] },
  { id: "park-bonn",   name: "Park Bonn Avenue",                lat: 12.9956337, lng: 80.2355311, routes: ["r1","r2","r4"] },
  { id: "post-office", name: "Post Office",                     lat: 12.9935759, lng: 80.2342617, routes: ["r1","r2","r4"] },
  { id: "gajendra",    name: "Gajendra Circle",                 lat: 12.9917762, lng: 80.2337504, routes: ["r1","r2","r3","r4"] },
  { id: "hsb",         name: "Humanities and Sciences Block",   lat: 12.9909643, lng: 80.2318796, routes: ["r1","r2","r3"] },
  { id: "library",     name: "Central Library",                 lat: 12.9912299, lng: 80.2336106, routes: ["r3","r4"] },
  { id: "cc",          name: "Classroom Complex",               lat: 12.9908964, lng: 80.2303403, routes: ["r1","r2","r3"] },
  { id: "oat",         name: "Open Air Theatre",                lat: 12.9897203, lng: 80.2331707, routes: ["r3","r4"] },
  { id: "nac2",        name: "New Academic Complex 2",          lat: 12.9901914, lng: 80.2272461, routes: ["r1","r2","r3"] },
  { id: "edb",         name: "Engineering Design Block",        lat: 12.9899794, lng: 80.2263928, routes: ["r1","r2","r3"] },
  { id: "velachery",   name: "Velachery Gate",                  lat: 12.9885641, lng: 80.2233424, routes: ["r1","r2","r3"] },
  { id: "gymkhana",    name: "Gymkhana",                        lat: 12.9865899, lng: 80.2333454, routes: ["r3","r4"] },
  { id: "narmada",     name: "Narmada",                         lat: 12.9862811, lng: 80.2348287, routes: ["r3","r4"] },
  { id: "jamuna",      name: "Jamuna and Ganga",                lat: 12.9867356, lng: 80.2394226, routes: ["r3","r4"] },
];

// Stop ID sequence for each route (in service direction).
export const ROUTE_STOPS: Record<RouteId, string[]> = {
  r1: ["main-gate","d1-bonn","school-bonn","park-bonn","post-office","gajendra","hsb","cc","nac2","edb","velachery"],
  r2: ["velachery","edb","nac2","cc","hsb","gajendra","post-office","park-bonn","school-bonn","d1-bonn","main-gate"],
  r3: ["velachery","edb","nac2","cc","hsb","gajendra","library","oat","gymkhana","narmada","jamuna"],
  r4: ["jamuna","narmada","gymkhana","oat","library","gajendra","post-office","park-bonn","school-bonn","d1-bonn","main-gate"],
};

export const NEAREST_STOP_ID = "gajendra";

// Campus bounding box for default fit-to-view.
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [12.9850, 80.2230], // SW
  [13.0070, 80.2425], // NE
];
export const CAMPUS_CENTER: [number, number] = [12.9960, 80.2330];

const STOP_BY_ID = new Map(STOPS.map((s) => [s.id, s]));
export function getStop(id: string): Stop | undefined {
  return STOP_BY_ID.get(id);
}

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

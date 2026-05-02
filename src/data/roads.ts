// Hand-drawn polylines for the three internal IIT Madras campus roads
// the shuttle uses. Anchored to known stop coordinates and extra mid-road
// waypoints so the rendered lines hug the actual roads and never spill
// outside campus.
//
// The three roads:
//   Bonn Avenue   — Main Gate → Gajendra Circle (residential strip)
//   Alumni Avenue — Gajendra Circle → Velachery Gate (academic strip)
//   Hostel Avenue — Gajendra Circle → Jamuna & Ganga (hostel strip)

import { getStop } from "./stops";
import type { RouteId } from "./routes";

export type LL = [number, number];

const s = (id: string): LL => {
  const st = getStop(id)!;
  return [st.lat, st.lng];
};

// ───────── Bonn Avenue (Main Gate → Gajendra) ─────────
// Stops along the way: main-gate, d1-bonn, school-bonn, park-bonn,
// post-office, gajendra. Extra subtle waypoints inserted to follow the
// gentle SW curve of Bonn Avenue without leaving campus.
export const BONN_AVENUE: LL[] = [
  s("main-gate"),
  [13.0044, 80.2410],
  s("d1-bonn"),
  [13.0008, 80.2397],
  s("school-bonn"),
  [12.9974, 80.2374],
  s("park-bonn"),
  [12.9945, 80.2349],
  s("post-office"),
  [12.9925, 80.2340],
  s("gajendra"),
];

// ───────── Alumni Avenue (Gajendra → Velachery Gate) ─────────
// Runs west through the academic zone. Library + HSB + OAT sit on short
// spurs off Alumni; we route through them by including their coords as
// part of the polyline so the visible line still follows Alumni cleanly.
export const ALUMNI_AVENUE: LL[] = [
  s("gajendra"),
  s("library"),
  s("hsb"),
  [12.9909, 80.2310],
  s("cc"),
  [12.9904, 80.2295],
  s("oat"),
  [12.9902, 80.2285],
  s("nac2"),
  s("edb"),
  [12.9893, 80.2250],
  s("velachery"),
];

// ───────── Hostel Avenue (Gajendra → Jamuna & Ganga) ─────────
// Heads south to Gymkhana, then east along the hostel strip.
export const HOSTEL_AVENUE: LL[] = [
  s("gajendra"),
  [12.9895, 80.2335],
  [12.9878, 80.2334],
  s("gymkhana"),
  s("narmada"),
  [12.9865, 80.2370],
  s("jamuna"),
];

// Helper: reverse a polyline.
const rev = (p: LL[]): LL[] => [...p].reverse();

// For each route, glue together the appropriate road polylines
// (in correct service direction). This keeps every drawn line strictly
// on these three roads.
export const ROUTE_PATHS: Record<RouteId, LL[]> = {
  // Main Gate → Velachery (Bonn → Alumni)
  r1: [...BONN_AVENUE, ...ALUMNI_AVENUE.slice(1)],
  // Velachery → Main Gate (reverse)
  r2: [...rev(ALUMNI_AVENUE), ...rev(BONN_AVENUE).slice(1)],
  // Velachery → Hostel (Alumni reversed to Gajendra, then Hostel)
  r3: [...rev(ALUMNI_AVENUE), ...HOSTEL_AVENUE.slice(1)],
  // Hostel → Main Gate (Hostel reversed to Gajendra, then Bonn reversed)
  r4: [...rev(HOSTEL_AVENUE), ...rev(BONN_AVENUE).slice(1)],
  // Hostel → Velachery (Hostel reversed to Gajendra, then Alumni)
  r5: [...rev(HOSTEL_AVENUE), ...ALUMNI_AVENUE.slice(1)],
  // Main Gate → Hostel (Bonn → Hostel)
  r6: [...BONN_AVENUE, ...HOSTEL_AVENUE.slice(1)],
};
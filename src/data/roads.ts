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
// Pure academic strip. Goes Gajendra → HSB → CC → NAC2 → EDB →
// Velachery. Library and OAT are NOT on Alumni — they are reached via
// a separate spur (LIBRARY_OAT_SPUR) used only by hostel-bound routes.
export const ALUMNI_AVENUE: LL[] = [
  s("gajendra"),
  [12.9912, 80.2330],
  s("hsb"),
  [12.9909, 80.2310],
  s("cc"),
  [12.9905, 80.2288],
  s("nac2"),
  s("edb"),
  [12.9893, 80.2250],
  s("velachery"),
];

// ───────── Library / OAT spur (Gajendra → OAT) ─────────
// Short branch south from Gajendra past the Central Library down to
// the Open Air Theatre. Used by hostel-bound routes (r3, r4, r5, r6)
// which do NOT serve the academic strip beyond HSB on this leg.
export const LIBRARY_OAT_SPUR: LL[] = [
  s("gajendra"),
  s("library"),
  [12.9905, 80.2334],
  s("oat"),
];

// ───────── Hostel Avenue (OAT → Jamuna & Ganga) ─────────
// From OAT south to Gymkhana, then east along the hostel strip.
export const HOSTEL_AVENUE: LL[] = [
  s("oat"),
  [12.9882, 80.2332],
  s("gymkhana"),
  s("narmada"),
  [12.9865, 80.2370],
  s("jamuna"),
];

// Helper: reverse a polyline.
const rev = (p: LL[]): LL[] => [...p].reverse();

// Catmull–Rom spline smoother. Converts an angular polyline into a
// gently curved one that reads as a road rather than a sequence of
// straight segments. Stop coordinates are preserved exactly because
// the spline passes through every input vertex.
function smooth(path: LL[], samplesPerSeg = 10): LL[] {
  if (path.length < 3) return path;
  const out: LL[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i - 1] ?? path[i];
    const p1 = path[i];
    const p2 = path[i + 1];
    const p3 = path[i + 2] ?? p2;
    for (let s = 0; s < samplesPerSeg; s++) {
      const t = s / samplesPerSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      const lat =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const lng =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push([lat, lng]);
    }
  }
  out.push(path[path.length - 1]);
  return out;
}

// For each route, glue together the appropriate road polylines
// (in correct service direction). This keeps every drawn line strictly
// on these three roads.
export const ROUTE_PATHS_RAW: Record<RouteId, LL[]> = {
  // Main Gate → Velachery (Bonn → Alumni; no library, no OAT)
  r1: [...BONN_AVENUE, ...ALUMNI_AVENUE.slice(1)],
  // Velachery → Main Gate (reverse)
  r2: [...rev(ALUMNI_AVENUE), ...rev(BONN_AVENUE).slice(1)],
  // Velachery → Hostel: academic strip back to Gajendra, then library/OAT spur, then Hostel
  r3: [...rev(ALUMNI_AVENUE), ...LIBRARY_OAT_SPUR.slice(1), ...HOSTEL_AVENUE.slice(1)],
  // Hostel → Main Gate: Hostel reversed to OAT, library spur reversed to Gajendra, then Bonn reversed
  r4: [...rev(HOSTEL_AVENUE), ...rev(LIBRARY_OAT_SPUR).slice(1), ...rev(BONN_AVENUE).slice(1)],
  // Hostel → Velachery: Hostel reversed to OAT, spur reversed to Gajendra, then Alumni
  r5: [...rev(HOSTEL_AVENUE), ...rev(LIBRARY_OAT_SPUR).slice(1), ...ALUMNI_AVENUE.slice(1)],
  // Main Gate → Hostel: Bonn → library/OAT spur → Hostel
  r6: [...BONN_AVENUE, ...LIBRARY_OAT_SPUR.slice(1), ...HOSTEL_AVENUE.slice(1)],
};

export const ROUTE_PATHS: Record<RouteId, LL[]> = {
  r1: smooth(ROUTE_PATHS_RAW.r1),
  r2: smooth(ROUTE_PATHS_RAW.r2),
  r3: smooth(ROUTE_PATHS_RAW.r3),
  r4: smooth(ROUTE_PATHS_RAW.r4),
  r5: smooth(ROUTE_PATHS_RAW.r5),
  r6: smooth(ROUTE_PATHS_RAW.r6),
};

/** Returns the smoothed polyline segment of `routeId` between two
 *  stop ids (inclusive). Uses the raw road geometry so the slice lands
 *  exactly on the stop coordinates, then smooths the result. */
export function routeSegmentBetween(
  routeId: RouteId,
  fromId: string,
  toId: string,
): LL[] | null {
  const a = getStop(fromId);
  const b = getStop(toId);
  if (!a || !b) return null;
  const raw = ROUTE_PATHS_RAW[routeId];
  const sameLL = (p: LL, lat: number, lng: number) =>
    Math.abs(p[0] - lat) < 1e-7 && Math.abs(p[1] - lng) < 1e-7;
  const iA = raw.findIndex((p) => sameLL(p, a.lat, a.lng));
  const iB = raw.findIndex((p) => sameLL(p, b.lat, b.lng));
  if (iA === -1 || iB === -1 || iA === iB) return null;
  const slice = iA < iB ? raw.slice(iA, iB + 1) : raw.slice(iB, iA + 1).reverse();
  return smooth(slice);
}
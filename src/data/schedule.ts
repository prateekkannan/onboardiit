import { ROUTE_ORDER, ROUTES, type RouteId, type BusType } from "./routes";
import { ROUTE_STOPS, getStop, distanceMeters } from "./stops";

export interface StopETA {
  stopId: string;
  /** Minutes after departure that the bus arrives at this stop */
  offsetMin: number;
  /** Absolute clock time "HH:MM" */
  time: string;
}

export interface Departure {
  routeId: RouteId;
  /** Departure time from the route's first stop, "HH:MM" */
  time: string;
  busName: string;
  busType: BusType;
  /** Per-stop arrival times, computed from real distances at 20 km/h */
  stopETAs: StopETA[];
}

const SPEED_KMH = 20;
const SPEED_M_PER_MIN = (SPEED_KMH * 1000) / 60;

function toHM(totalMin: number): string {
  const t = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = Math.round(t % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hmToMin(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

/** Cumulative minutes from start of route to each stop along the route. */
function cumulativeOffsets(routeId: RouteId): number[] {
  const seq = ROUTE_STOPS[routeId];
  const out: number[] = [0];
  for (let i = 1; i < seq.length; i++) {
    const a = getStop(seq[i - 1])!;
    const b = getStop(seq[i])!;
    const meters = distanceMeters([a.lat, a.lng], [b.lat, b.lng]);
    out.push(out[i - 1] + meters / SPEED_M_PER_MIN);
  }
  return out;
}

const ROUTE_OFFSETS: Record<RouteId, number[]> = {
  r1: cumulativeOffsets("r1"),
  r2: cumulativeOffsets("r2"),
  r3: cumulativeOffsets("r3"),
  r4: cumulativeOffsets("r4"),
};

interface RouteSpec {
  startMin: number;  // first departure (minutes since midnight)
  endMin: number;    // last departure
  intervalMin: number;
  prefix: string;
  fleetSize: number;
}

const ROUTE_SPEC: Record<RouteId, RouteSpec> = {
  r1: { startMin: 6 * 60 + 15, endMin: 21 * 60 + 35, intervalMin: 20, prefix: "R1", fleetSize: 4 },
  r2: { startMin: 6 * 60 + 15, endMin: 21 * 60 + 35, intervalMin: 20, prefix: "R2", fleetSize: 4 },
  r3: { startMin: 6 * 60 + 20, endMin: 21 * 60 + 20, intervalMin: 20, prefix: "R3", fleetSize: 4 },
  r4: { startMin: 6 * 60 + 20, endMin: 21 * 60 + 20, intervalMin: 20, prefix: "R4", fleetSize: 4 },
};

function buildRouteSchedule(routeId: RouteId): Departure[] {
  const spec = ROUTE_SPEC[routeId];
  const seq = ROUTE_STOPS[routeId];
  const offsets = ROUTE_OFFSETS[routeId];
  const out: Departure[] = [];
  let i = 0;
  for (let t = spec.startMin; t <= spec.endMin; t += spec.intervalMin) {
    const busNum = (i % spec.fleetSize) + 1;
    const stopETAs: StopETA[] = seq.map((sid, idx) => ({
      stopId: sid,
      offsetMin: offsets[idx],
      time: toHM(t + offsets[idx]),
    }));
    out.push({
      routeId,
      time: toHM(t),
      busName: `${spec.prefix}-${String(busNum).padStart(2, "0")}`,
      busType: "Bus",
      stopETAs,
    });
    i++;
  }
  return out;
}

export const SCHEDULE: Record<RouteId, Departure[]> = {
  r1: buildRouteSchedule("r1"),
  r2: buildRouteSchedule("r2"),
  r3: buildRouteSchedule("r3"),
  r4: buildRouteSchedule("r4"),
};

/**
 * Find next arrivals at a given stop across all routes that serve it.
 * Returns each upcoming arrival within the next maxAheadMin minutes.
 */
export interface UpcomingArrival {
  routeId: RouteId;
  busName: string;
  busType: BusType;
  arrivalTime: string;        // "HH:MM"
  minutesAway: number;
  /** Departure (trip) start time the bus belongs to */
  tripStartTime: string;
}

export function upcomingArrivalsAt(
  stopId: string,
  nowMin: number,
  maxAheadMin = 120,
): UpcomingArrival[] {
  const out: UpcomingArrival[] = [];
  for (const rid of ROUTE_ORDER) {
    const seq = ROUTE_STOPS[rid];
    const idx = seq.indexOf(stopId);
    if (idx === -1) continue;
    for (const dep of SCHEDULE[rid]) {
      const eta = dep.stopETAs[idx];
      const arrMin = hmToMin(eta.time);
      const delta = arrMin - nowMin;
      if (delta < 0) continue;
      if (delta > maxAheadMin) break;
      out.push({
        routeId: rid,
        busName: dep.busName,
        busType: dep.busType,
        arrivalTime: eta.time,
        minutesAway: delta,
        tripStartTime: dep.time,
      });
    }
  }
  out.sort((a, b) => a.minutesAway - b.minutesAway);
  return out;
}

export { ROUTE_ORDER, ROUTES };

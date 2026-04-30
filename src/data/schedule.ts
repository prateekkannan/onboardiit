import { ROUTE_ORDER, ROUTES, type RouteId, type BusType } from "./routes";

export interface Departure {
  routeId: RouteId;
  time: string;        // "HH:MM" 24h
  busName: string;     // e.g. "Bus 12"
  busType: BusType;
}

// Generate a plausible day schedule (06:00 → 22:00) per route.
function generateRouteSchedule(
  routeId: RouteId,
  busType: BusType,
  busPrefix: string,
  intervalMin: number,
  startMin: number,
  fleetSize: number,
): Departure[] {
  const out: Departure[] = [];
  const endMin = 22 * 60;
  let i = 0;
  for (let t = 6 * 60 + startMin; t <= endMin; t += intervalMin) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    const busNum = (i % fleetSize) + 1;
    out.push({
      routeId,
      time: `${hh}:${mm}`,
      busName: `${busPrefix} ${String(busNum).padStart(2, "0")}`,
      busType,
    });
    i++;
  }
  return out;
}

export const SCHEDULE: Record<RouteId, Departure[]> = {
  mainGate: generateRouteSchedule("mainGate", "Regular", "MG", 15, 0, 4),
  hostel: generateRouteSchedule("hostel", "EV-AC", "HZ", 12, 5, 5),
  velachery: generateRouteSchedule("velachery", "Regular", "VG", 20, 10, 3),
  gajendra: generateRouteSchedule("gajendra", "EV-AC", "GC", 18, 7, 3),
  ecart: generateRouteSchedule("ecart", "E-Cart", "EC", 8, 2, 6),
};

export { ROUTE_ORDER, ROUTES };
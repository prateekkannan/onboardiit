import type { CSSProperties } from "react";
import { ROUTES, type RouteId } from "@/data/routes";

export function routeTextClass(routeId: RouteId): string {
  return ROUTES[routeId].textOnTop === "white" ? "text-white" : "text-black";
}

export function routeBgStyle(routeId: RouteId): CSSProperties {
  return { backgroundColor: ROUTES[routeId].hex };
}

export function routeBorderStyle(routeId: RouteId): CSSProperties {
  return { backgroundColor: ROUTES[routeId].hex };
}

/** Convert "HH:MM" → minutes since midnight */
export function hmToMin(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

/** Format minutes-from-now into a friendly countdown */
export function formatCountdown(min: number): string {
  if (min <= 0) return "now";
  if (min < 60) return `in ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `in ${h} hr` : `in ${h}h ${m}m`;
}

/** "Now" used by the demo. We freeze at a daytime time so the schedule
 *  always looks alive on first load.
 */
export function getDemoNowMinutes(): number {
  // Real wall-clock minutes-of-day, clamped into the service window so the
  // app always shows interesting upcoming buses.
  const d = new Date();
  const real = d.getHours() * 60 + d.getMinutes();
  if (real < 6 * 60 + 20) return 8 * 60 + 12;   // pre-service → 08:12
  if (real > 21 * 60 + 10) return 19 * 60 + 47; // late night → 19:47
  return real;
}
// Six official IIT Madras campus bus routes.
export type RouteId = "r1" | "r2" | "r3" | "r4" | "r5" | "r6";

export type BusType = "Bus";

export interface RouteInfo {
  id: RouteId;
  name: string;             // e.g. "Route 1"
  direction: string;        // headline on cards
  shortName: string;
  hex: string;
  textOnTop: "black" | "white";
  defaultBusType: BusType;
}

export const ROUTES: Record<RouteId, RouteInfo> = {
  r1: {
    id: "r1",
    name: "Route 1",
    direction: "Main Gate → Velachery Gate",
    shortName: "MG → VG",
    hex: "#FF0054",
    textOnTop: "white",
    defaultBusType: "Bus",
  },
  r2: {
    id: "r2",
    name: "Route 2",
    direction: "Velachery Gate → Main Gate",
    shortName: "VG → MG",
    hex: "#00B4D8",
    textOnTop: "white",
    defaultBusType: "Bus",
  },
  r3: {
    id: "r3",
    name: "Route 3",
    direction: "Velachery Gate → Hostel",
    shortName: "VG → Hostel",
    hex: "#F5F500",
    textOnTop: "black",
    defaultBusType: "Bus",
  },
  r4: {
    id: "r4",
    name: "Route 4",
    direction: "Hostel → Main Gate",
    shortName: "Hostel → MG",
    hex: "#06D6A0",
    textOnTop: "black",
    defaultBusType: "Bus",
  },
  r5: {
    id: "r5",
    name: "Route 5",
    direction: "Hostel → Velachery Gate",
    shortName: "Hostel → VG",
    hex: "#FF6B35",
    textOnTop: "white",
    defaultBusType: "Bus",
  },
  r6: {
    id: "r6",
    name: "Route 6",
    direction: "Main Gate → Hostel",
    shortName: "MG → Hostel",
    hex: "#9B5DE5",
    textOnTop: "white",
    defaultBusType: "Bus",
  },
};

export const ROUTE_ORDER: RouteId[] = ["r1", "r2", "r3", "r4", "r5", "r6"];
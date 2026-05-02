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
    hex: "#6EC6F5",
    textOnTop: "black",
    defaultBusType: "Bus",
  },
  r2: {
    id: "r2",
    name: "Route 2",
    direction: "Velachery Gate → Main Gate",
    shortName: "VG → MG",
    hex: "#F47EB6",
    textOnTop: "black",
    defaultBusType: "Bus",
  },
  r3: {
    id: "r3",
    name: "Route 3",
    direction: "Velachery Gate → Hostel",
    shortName: "VG → Hostel",
    hex: "#FFE066",
    textOnTop: "black",
    defaultBusType: "Bus",
  },
  r4: {
    id: "r4",
    name: "Route 4",
    direction: "Hostel → Main Gate",
    shortName: "Hostel → MG",
    hex: "#82E0AA",
    textOnTop: "black",
    defaultBusType: "Bus",
  },
  r5: {
    id: "r5",
    name: "Route 5",
    direction: "Hostel → Velachery Gate",
    shortName: "Hostel → VG",
    hex: "#C3B1E1",
    textOnTop: "black",
    defaultBusType: "Bus",
  },
  r6: {
    id: "r6",
    name: "Route 6",
    direction: "Main Gate → Hostel",
    shortName: "MG → Hostel",
    hex: "#FFB347",
    textOnTop: "black",
    defaultBusType: "Bus",
  },
};

export const ROUTE_ORDER: RouteId[] = ["r1", "r2", "r3", "r4", "r5", "r6"];
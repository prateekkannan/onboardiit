// Four official IIT Madras campus bus routes.
export type RouteId = "r1" | "r2" | "r3" | "r4";

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
    hex: "#03AED2",
    textOnTop: "white",
    defaultBusType: "Bus",
  },
  r2: {
    id: "r2",
    name: "Route 2",
    direction: "Velachery Gate → Main Gate",
    shortName: "VG → MG",
    hex: "#D12052",
    textOnTop: "white",
    defaultBusType: "Bus",
  },
  r3: {
    id: "r3",
    name: "Route 3",
    direction: "Velachery Gate → Hostel",
    shortName: "VG → Hostel",
    hex: "#F8DE22",
    textOnTop: "black",
    defaultBusType: "Bus",
  },
  r4: {
    id: "r4",
    name: "Route 4",
    direction: "Hostel → Main Gate",
    shortName: "Hostel → MG",
    hex: "#F45B26",
    textOnTop: "white",
    defaultBusType: "Bus",
  },
};

export const ROUTE_ORDER: RouteId[] = ["r1", "r2", "r3", "r4"];
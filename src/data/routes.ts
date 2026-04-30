export type RouteId = "mainGate" | "hostel" | "velachery" | "gajendra" | "ecart";

export type BusType = "Regular" | "EV-AC" | "E-Cart";

export interface RouteInfo {
  id: RouteId;
  direction: string;        // headline on cards
  shortName: string;
  hex: string;
  cssVar: string;           // tailwind class fragment for hsl var
  textOnTop: "black" | "white";
  defaultBusType: BusType;
}

export const ROUTES: Record<RouteId, RouteInfo> = {
  mainGate: {
    id: "mainGate",
    direction: "Towards Main Gate",
    shortName: "Main Gate",
    hex: "#0EA5E9",
    cssVar: "route-main-gate",
    textOnTop: "white",
    defaultBusType: "Regular",
  },
  hostel: {
    id: "hostel",
    direction: "Towards Hostel",
    shortName: "Hostel Zone",
    hex: "#FF2D78",
    cssVar: "route-hostel",
    textOnTop: "white",
    defaultBusType: "EV-AC",
  },
  velachery: {
    id: "velachery",
    direction: "Towards Velachery Gate",
    shortName: "Velachery Gate",
    hex: "#FFE034",
    cssVar: "route-velachery",
    textOnTop: "black",
    defaultBusType: "Regular",
  },
  gajendra: {
    id: "gajendra",
    direction: "Towards Gajendra Circle",
    shortName: "Gajendra Circle",
    hex: "#1D4ED8",
    cssVar: "route-gajendra",
    textOnTop: "white",
    defaultBusType: "EV-AC",
  },
  ecart: {
    id: "ecart",
    direction: "E-Cart",
    shortName: "E-Cart",
    hex: "#A8FF3E",
    cssVar: "route-ecart",
    textOnTop: "black",
    defaultBusType: "E-Cart",
  },
};

export const ROUTE_ORDER: RouteId[] = [
  "mainGate",
  "hostel",
  "velachery",
  "gajendra",
  "ecart",
];
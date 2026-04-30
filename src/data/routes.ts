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
    hex: "#03AED2",
    cssVar: "route-main-gate",
    textOnTop: "white",
    defaultBusType: "Regular",
  },
  hostel: {
    id: "hostel",
    direction: "Towards Hostel",
    shortName: "Hostel Zone",
    hex: "#D12052",
    cssVar: "route-hostel",
    textOnTop: "white",
    defaultBusType: "EV-AC",
  },
  velachery: {
    id: "velachery",
    direction: "Towards Velachery Gate",
    shortName: "Velachery Gate",
    hex: "#F8DE22",
    cssVar: "route-velachery",
    textOnTop: "black",
    defaultBusType: "Regular",
  },
  gajendra: {
    id: "gajendra",
    direction: "Towards Gajendra Circle",
    shortName: "Gajendra Circle",
    hex: "#4B9DA9",
    cssVar: "route-gajendra",
    textOnTop: "white",
    defaultBusType: "EV-AC",
  },
  ecart: {
    id: "ecart",
    direction: "E-Cart",
    shortName: "E-Cart",
    hex: "#F45B26",
    cssVar: "route-ecart",
    textOnTop: "white",
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
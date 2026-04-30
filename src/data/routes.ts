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
    hex: "#59D5E0",
    cssVar: "route-main-gate",
    textOnTop: "black",
    defaultBusType: "Regular",
  },
  hostel: {
    id: "hostel",
    direction: "Towards Hostel",
    shortName: "Hostel Zone",
    hex: "#F4538A",
    cssVar: "route-hostel",
    textOnTop: "white",
    defaultBusType: "EV-AC",
  },
  velachery: {
    id: "velachery",
    direction: "Towards Velachery Gate",
    shortName: "Velachery Gate",
    hex: "#F5DD61",
    cssVar: "route-velachery",
    textOnTop: "black",
    defaultBusType: "Regular",
  },
  gajendra: {
    id: "gajendra",
    direction: "Towards Gajendra Circle",
    shortName: "Gajendra Circle",
    hex: "#4D2B8C",
    cssVar: "route-gajendra",
    textOnTop: "white",
    defaultBusType: "EV-AC",
  },
  ecart: {
    id: "ecart",
    direction: "E-Cart",
    shortName: "E-Cart",
    hex: "#FAA300",
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
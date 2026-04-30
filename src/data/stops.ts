import type { RouteId } from "./routes";

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: RouteId[];
}

// IIT Madras campus stops (approx. real coordinates around the campus).
export const STOPS: Stop[] = [
  {
    id: "main-gate",
    name: "Main Gate",
    lat: 12.9915,
    lng: 80.2336,
    routes: ["mainGate", "ecart"],
  },
  {
    id: "gajendra-circle",
    name: "Gajendra Circle",
    lat: 12.9905,
    lng: 80.2305,
    routes: ["mainGate", "hostel", "gajendra", "ecart"],
  },
  {
    id: "academic-zone",
    name: "Academic Zone",
    lat: 12.9893,
    lng: 80.2330,
    routes: ["mainGate", "hostel", "gajendra", "ecart"],
  },
  {
    id: "himalaya-mess",
    name: "Himalaya Mess",
    lat: 12.9876,
    lng: 80.2349,
    routes: ["hostel", "ecart"],
  },
  {
    id: "hostel-zone",
    name: "Hostel Zone",
    lat: 12.9852,
    lng: 80.2371,
    routes: ["hostel", "gajendra", "ecart"],
  },
  {
    id: "taramani-guest-house",
    name: "Taramani Guest House",
    lat: 12.9831,
    lng: 80.2398,
    routes: ["velachery", "ecart"],
  },
  {
    id: "velachery-gate",
    name: "Velachery Gate",
    lat: 12.9805,
    lng: 80.2412,
    routes: ["velachery"],
  },
  {
    id: "stadium",
    name: "Stadium",
    lat: 12.9869,
    lng: 80.2308,
    routes: ["gajendra", "ecart"],
  },
];

// "Your nearest stop" is just hardcoded for the demo.
export const NEAREST_STOP_ID = "gajendra-circle";

// IIT Madras campus center
export const CAMPUS_CENTER: [number, number] = [12.9889, 80.2348];
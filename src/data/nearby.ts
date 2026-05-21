import type { RouteId } from "./routes";

export type LandmarkCategory =
  | "Departments"
  | "Hostels"
  | "Food"
  | "Sports"
  | "Admin and Services"
  | "Other";

export interface Landmark {
  name: string;
  minutes: number;
  category: LandmarkCategory;
}

/** Pick the best route colour to use as the header pill for a stop. */
export const STOP_HEADER_ROUTE: Record<string, RouteId> = {
  "main-gate": "r1",
  "d1-bonn": "r1",
  "school-bonn": "r1",
  "park-bonn": "r1",
  "post-office": "r1",
  "gajendra": "r3",
  "hsb": "r1",
  "library": "r3",
  "cc": "r1",
  "oat": "r3",
  "nac2": "r1",
  "edb": "r1",
  "velachery": "r2",
  "gymkhana": "r4",
  "narmada": "r4",
  "jamuna": "r4",
};

const cat = (category: LandmarkCategory) =>
  (name: string, minutes: number): Landmark => ({ name, minutes, category });
const D = cat("Departments");
const H = cat("Hostels");
const F = cat("Food");
const S = cat("Sports");
const A = cat("Admin and Services");
const O = cat("Other");

export const NEARBY: Record<string, Landmark[]> = {
  "main-gate": [
    A("Security post and gate entry", 0),
    A("Auto and taxi stand", 1),
    O("Vana Vani School road junction", 10),
  ],
  "d1-bonn": [
    O("D1 faculty residential quarters", 1),
    O("Upper Bonn Avenue residential blocks", 2),
    O("Jalakandeswarar Temple", 6),
  ],
  "school-bonn": [
    O("Vana Vani Matriculation and Higher Secondary School", 1),
    O("Kendriya Vidyalaya School", 2),
    O("Faculty residential blocks C and D series", 2),
    O("Jalakandeswarar Temple", 3),
    O("Ladies Club and Community Hall", 4),
    O("Durga Peliamman Temple", 5),
  ],
  "park-bonn": [
    O("Central Park", 1),
    O("Staff Club", 2),
    O("Lower Bonn Avenue residential blocks", 2),
    A("SBI Bank branch", 3),
    S("GC Stadium", 4),
  ],
  "post-office": [
    A("Main campus Post Office", 1),
    A("SBI Bank branch and ATM", 1),
    A("Shopping Centre 1", 2),
    O("Faculty housing E series", 2),
    F("Canteen near residential zone", 3),
  ],
  "gajendra": [
    O("Gajendra Circle fountain and elephant statues", 0),
    A("Administrative Block", 1),
    A("Director's Office", 1),
    A("Finance and Accounts Office", 1),
    A("Academic Section", 1),
    A("Heritage Centre", 1),
    A("Shopping Centre 2", 2),
    A("Medical Centre and Institute Hospital", 2),
    A("Bose Einstein Guest House", 4),
    A("Taramani Guest House", 5),
    A("ICICI Bank", 3),
    A("Canara Bank", 3),
    O("Ganapathi Temple", 4),
    O("Kendriya Vidyalaya School", 4),
  ],
  "hsb": [
    D("Humanities and Sciences Block HSB", 1),
    D("Department of Humanities and Social Sciences", 1),
    D("Department of Mathematics", 1),
    D("Department of Physics", 2),
    D("MSB building", 2),
    D("Central Lecture Theatre CLT", 2),
    D("Basic sciences complex", 2),
  ],
  "library": [
    D("Central Library", 1),
    A("IITM Press", 2),
    A("Seminar Hall", 2),
    D("Computer Centre", 3),
    D("Sophisticated Analytical Instruments Facility", 3),
    D("PG Senapathy Centre", 3),
  ],
  "cc": [
    D("Classroom Complex CRC Raman and Ramanujan blocks", 1),
    D("Department of Civil Engineering", 1),
    D("Department of Mechanical Engineering", 2),
    D("Department of Applied Mechanics and Biomedical Engineering", 2),
    D("CARE building", 2),
    A("Central Workshop", 3),
    D("Central Electronic Centre", 3),
  ],
  "oat": [
    O("Open Air Theatre OAT", 1),
    D("Department of Chemical Engineering", 2),
    D("Department of Metallurgical and Materials Engineering", 2),
    D("Department of Biotechnology", 2),
    D("Department of Aerospace Engineering", 3),
    D("Department of Ocean Engineering", 3),
    D("Department of Building Sciences", 3),
  ],
  "nac2": [
    D("NAC2 building", 1),
    D("Department of Computer Science and Engineering", 1),
    D("Department of Electrical Engineering", 2),
    D("Department of Electronics and Communication Engineering", 2),
    D("Centre for Innovation CFI", 2),
    S("Swimming Pool", 3),
    D("Material Science Research Centre", 3),
    D("Dr Deshpande Centre for Innovation", 3),
    A("Student Activity Centre SAC", 4),
  ],
  "edb": [
    S("Chemplast Cricket Stadium", 1),
    D("Engineering Design Building EDB", 1),
    D("Department of Engineering Design", 1),
    D("Department of Chemistry", 2),
    D("New Wing Chemistry", 2),
    D("Department of Applied Chemistry", 2),
    D("Department of Management Studies", 3),
    D("Centre for Entrepreneurship Tinkering and Innovation CETI", 2),
    D("GFRG Building", 3),
    D("Composites Technology Centre", 4),
  ],
  "velachery": [
    A("Velachery Gate entrance", 0),
    A("Auto and taxi stand towards Velachery and Taramani", 1),
    A("Anna Garden MTC bus stop just outside gate", 1),
    A("IOC Diesel Bunk", 2),
    A("IITM Research Park bridge and entrance", 3),
  ],
  "gymkhana": [
    S("Gymkhana sports complex", 1),
    S("Football ground", 1),
    S("Hockey ground", 2),
    S("Basketball and tennis courts", 2),
    S("Badminton courts", 2),
    S("Athletics track", 2),
    S("Fitness centre", 2),
    S("New Sports Complex", 3),
    S("GC Stadium", 3),
    A("NCC Building", 4),
  ],
  "narmada": [
    H("Narmada Hostel", 1),
    H("Cauvery Hostel", 1),
    H("Pamba Hostel", 2),
    H("Mahanadi Hostel", 2),
    H("Sindhu Hostel", 2),
    H("Tamiraparani Hostel", 2),
    F("Vindhya Mess", 2),
    A("Student Facility Centre SFC", 3),
    F("IRCTC Cafeteria", 3),
    O("Warden quarters", 2),
  ],
  "jamuna": [
    H("Jamuna Hostel", 1),
    H("Ganga Hostel", 1),
    H("Alakananda Hostel", 1),
    H("Saraswathi Hostel", 2),
    H("Krishna Hostel", 2),
    H("Brahmaputra Hostel", 2),
    F("Himalaya Mega Mess", 2),
    F("Nilgiri Mess", 2),
    S("Sangam Ground and skating track", 3),
    H("Sharavati Hostel", 3),
    H("Sarayu Hostel", 3),
    H("Sabarmati Hostel", 3),
    H("Tunga Bhadra Hostel", 3),
    H("Swarnamukhi Hostel", 3),
    A("Hostel Management CCW office", 3),
    S("Swimming Pool", 4),
  ],
};

export const CATEGORY_ORDER: LandmarkCategory[] = [
  "Departments",
  "Hostels",
  "Food",
  "Sports",
  "Admin and Services",
  "Other",
];
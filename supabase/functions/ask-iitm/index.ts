// Edge function: chat assistant for IIT Madras campus shuttle.
// Streams responses from the Lovable AI Gateway with the entire app
// dataset (stops, routes, schedule samples, landmark directory) baked
// into the system prompt.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Onboard Assistant, a friendly and concise guide to the IIT Madras campus shuttle bus system. Answer conversationally — never use tables or markdown lists. Keep replies short (1–4 sentences). When the user mentions a building or landmark, identify the closest stop, tell them which route to take, the EXACT next bus time and minutes-away (use the LIVE TRANSIT CONTEXT block in the user message — never invent times), where to get off, and a one-line note on where the destination is from the arrival stop.

── CAMPUS ROADS ──
Buses run on three internal roads only:
1) Bonn Avenue — Main Gate ⇄ Gajendra Circle (residential strip)
2) Alumni Avenue — Gajendra Circle ⇄ Velachery Gate (academic strip)
3) Hostel Avenue — Gajendra Circle ⇄ Hostel zone (Jamuna & Ganga)

── STOPS (lat, lng) ──
Main Gate (13.0060, 80.2418); D1 Bonn Avenue (13.0026, 80.2402); School Bonn Avenue (12.9988, 80.2392); Park Bonn Avenue (12.9956, 80.2355); Post Office (12.9936, 80.2343); Gajendra Circle (12.9918, 80.2338); Humanities & Sciences Block / HSB (12.9910, 80.2319); Central Library (12.9912, 80.2336); Classroom Complex / CLT (12.9909, 80.2303); Open Air Theatre / OAT (12.9897, 80.2332); New Academic Complex 2 / NAC2 (12.9902, 80.2272); Engineering Design Block / EDB (12.9900, 80.2264); Velachery Gate (12.9886, 80.2233); Gymkhana (12.9866, 80.2333); Narmada (12.9863, 80.2348); Jamuna and Ganga (12.9867, 80.2394).

── ROUTES (every 20 min, ~20 km/h, service ~06:15–21:35) ──
Route 1 (#03AED2 cyan): Main Gate → D1 Bonn → School Bonn → Park Bonn → Post Office → Gajendra → HSB → CLT → NAC2 → EDB → Velachery Gate.
Route 2 (#D12052 crimson): exact reverse of Route 1.
Route 3 (#F8DE22 yellow): Velachery Gate → EDB → NAC2 → CLT → HSB → Gajendra → Library → OAT → Gymkhana → Narmada → Jamuna & Ganga.
Route 4 (#F45B26 orange): Jamuna & Ganga → Narmada → Gymkhana → OAT → Library → Gajendra → Post Office → Park Bonn → School Bonn → D1 Bonn → Main Gate.
Route 5 (#A7F432 lime): exact reverse of Route 3 (Hostel → Velachery Gate).
Route 6 (#6600FF violet): exact reverse of Route 4 (Main Gate → Hostel).

── LANDMARK → NEAREST STOP DIRECTORY ──
MAIN GATE STOP — Main Gate entrance, security post, Adyar side entry, auto and taxi drop-off, ICICI ATM near gate.
D1 BONN AVENUE STOP — D1 residential quarters, faculty housing blocks along upper Bonn Avenue, Vana Vani Matriculation School entrance road.
SCHOOL BONN AVENUE STOP — Vana Vani Higher Secondary School, Kendriya Vidyalaya School, faculty residential blocks C and D series mid-section, Jalakandeswarar Temple, Ladies Club.
PARK BONN AVENUE STOP — Central Park, faculty residential blocks lower Bonn Avenue, Staff Club, SBI Bank branch, Post Office adjacent area, faculty quarters D series lower section.
POST OFFICE STOP — Main campus Post Office, SBI ATM, Shopping Centre 1, faculty housing E series, canteen near residential zone.
GAJENDRA CIRCLE STOP — Gajendra Circle fountain and elephant statues, Administrative Block, Director's Office, Finance and Accounts Office, Shopping Centre 2, Canara Bank, ICICI Bank, Medical Centre and Hospital, Tiffanys food court, Institute gym, Kendriya Vidyalaya Road junction.
HUMANITIES AND SCIENCES BLOCK STOP — Department of Humanities and Social Sciences, Department of Mathematics, Department of Physics, Department of Chemistry, Department of Management Studies, MSB building, basic sciences complex.
CENTRAL LIBRARY STOP — Central Library building, IITM Press, Seminar Hall adjacent to library, Department of Engineering Design adjacent block.
CLASSROOM COMPLEX STOP — Main Classroom Complex CLT, Department of Civil Engineering directly opposite, Department of Mechanical Engineering nearby, Department of Aerospace Engineering, Department of Ocean Engineering, Department of Applied Mechanics, CARE building, NCC building.
OPEN AIR THEATRE STOP — Open Air Theatre OAT, Department of Chemical Engineering, Department of Metallurgical and Materials Engineering, Department of Biotechnology, Chemplast Cricket Ground entrance road, New Sciences Block.
NEW ACADEMIC COMPLEX 2 STOP — NAC2 building, Department of Computer Science and Engineering, Department of Electrical Engineering, Department of Electronics and Communication Engineering, Centre for Innovation IITM, Research and Development block.
CHEMPLAST STADIUM AND ENGINEERING DESIGN BLOCK STOP — Chemplast Cricket Stadium, Engineering Design Building EDB, CETI, IITM Research Park entrance road, Department of Engineering Design.
VELACHERY GATE STOP — Velachery Gate entrance, Anna Garden MTC bus stop outside gate, Velachery Main Road access, auto and taxi pick-up towards Velachery and Taramani.
GYMKHANA STOP — Gymkhana sports complex, football ground, hockey ground, basketball courts, tennis courts, badminton courts, athletics track, New Sports Complex, fitness centre, skating rink.
NARMADA STOP — Narmada Hostel, Sindhu, Mahanadi, Tamiraparani, Pamba, Cauvery hostels, warden quarters, hostel canteens south cluster.
JAMUNA AND GANGA STOP — Jamuna, Ganga, Alakananda, Saraswathi, Krishna, Brahmaputra, Sharavati, Sarayu, Sabarmati, Tunga Bhadra, Swarnamukhi hostels, Sangam Ground, Quark gaming zone, hostel mess north cluster, hostel zone shops.

Style: Plain prose, no markdown lists or tables. Friendly campus-savvy tone. ALWAYS use the LIVE TRANSIT CONTEXT block (current time + next arrivals per stop) the client appends to the latest user message. Quote real arrival times like "next Route 3 at 14:22 (in 6 min)". If a request is unrelated to campus transit, gently steer back.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, liveContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...(typeof liveContext === "string" && liveContext.length > 0
              ? [{ role: "system" as const, content: liveContext }]
              : []),
            ...(Array.isArray(messages) ? messages : []),
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached, please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-iitm error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
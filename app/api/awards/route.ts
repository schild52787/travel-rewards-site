import { NextRequest, NextResponse } from "next/server";
import { AwardsApiResponse, LiveAwardResult } from "@/lib/types";

const SEATS_AERO_API_KEY = process.env.SEATS_AERO_API_KEY ?? "";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const cache = new Map<string, { data: AwardsApiResponse; fetchedAt: number }>();

const PROGRAM_NAMES: Record<string, string> = {
  VS: "Virgin Atlantic",
  FB: "Flying Blue",
  AF: "Flying Blue",
  DL: "Delta SkyMiles",
  AA: "American AAdvantage",
  UA: "United MileagePlus",
  BA: "British Airways",
  AC: "Air Canada Aeroplan",
};

function buildBookingUrl(programCode: string, origin: string, destination: string, date: string): string {
  switch (programCode) {
    case "VS":
      return "https://www.virginatlantic.com/us/en/flying-club/spend-miles/find-flights.html";
    case "FB":
    case "AF":
      return `https://wwws.airfrance.us/search/offer?origin=${origin}&destination=${destination}&pax=ADT:1&cabin=ECONOMY&date=${date}&tripType=OW`;
    case "DL":
      return `https://www.delta.com/us/en/flight-search/search?paxCount=1&tripType=ONE_WAY&fromAirportCode=${origin}&toAirportCode=${destination}&departureDate=${date}&awardTravel=true`;
    default:
      return `https://www.google.com/travel/flights?q=flights+${origin}+${destination}+${date}`;
  }
}

interface SeatsAeroItem {
  Availability: {
    YAvailable: boolean;
    YMileageCost: number;
    YRemainingSeats: number;
  };
  Route: {
    OriginAirport: string;
    DestinationAirport: string;
    Source: string;
  };
  Carriers: string;
  Stops: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin")?.toUpperCase();
  const destination = searchParams.get("destination")?.toUpperCase();
  const date = searchParams.get("date") ?? "";

  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
  }

  if (!SEATS_AERO_API_KEY) {
    return NextResponse.json({
      status: "key_required",
      message: "Seats.aero Pro API key not configured",
      results: [],
      fetchedAt: new Date().toISOString(),
      source: "seats.aero",
    } satisfies AwardsApiResponse);
  }

  const cacheKey = `${origin}-${destination}-${date}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const url = new URL("https://seats.aero/partnerapi/search");
    url.searchParams.set("origin_airport", origin);
    url.searchParams.set("destination_airport", destination);
    if (date) {
      url.searchParams.set("start_date", date);
      url.searchParams.set("end_date", date);
    }
    url.searchParams.set("cabin", "economy");

    const resp = await fetch(url.toString(), {
      headers: { "Partner-Authorization": SEATS_AERO_API_KEY },
    });

    if (!resp.ok) {
      throw new Error(`seats.aero API error: ${resp.status}`);
    }

    const raw = await resp.json() as { data: SeatsAeroItem[] };
    const data = raw.data ?? [];

    const results: LiveAwardResult[] = data
      .filter((item) => item.Availability?.YAvailable)
      .map((item): LiveAwardResult => {
        const code = item.Route.Source;
        return {
          program: PROGRAM_NAMES[code] ?? code,
          programCode: code,
          milesCost: item.Availability.YMileageCost,
          seatsAvailable: item.Availability.YRemainingSeats,
          carriers: item.Carriers,
          stops: item.Stops,
          direct: item.Stops === 0,
          bookingUrl: buildBookingUrl(code, origin, destination, date),
        };
      })
      .sort((a, b) => a.milesCost - b.milesCost);

    const response: AwardsApiResponse = {
      status: "ok",
      results,
      fetchedAt: new Date().toISOString(),
      source: "seats.aero",
    };

    cache.set(cacheKey, { data: response, fetchedAt: Date.now() });
    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json({
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
      results: [],
      fetchedAt: new Date().toISOString(),
      source: "seats.aero",
    } satisfies AwardsApiResponse);
  }
}

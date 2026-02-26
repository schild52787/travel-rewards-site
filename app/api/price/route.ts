import { NextRequest, NextResponse } from "next/server";
// @ts-expect-error – Amadeus JS SDK has no bundled types
import Amadeus from "amadeus";

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

// In-memory cache: key → { price, fetchedAt }
const cache = new Map<string, { price: number; fetchedAt: number }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin")?.toUpperCase();
  const destination = searchParams.get("destination")?.toUpperCase();
  const date = searchParams.get("date");

  if (!origin || !destination || !date) {
    return NextResponse.json({ error: "Missing origin, destination, or date" }, { status: 400 });
  }

  const cacheKey = `${origin}-${destination}-${date}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      price: cached.price,
      currency: "USD",
      source: "amadeus (cached)",
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
    });
  }

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: "1",
      max: "25",
    });

    const offers = response.data as Array<{ price: { total: string } }>;
    if (!offers || offers.length === 0) {
      return NextResponse.json({ price: null, source: "amadeus", error: "No flights found" });
    }

    const prices = offers.map((o) => parseFloat(o.price.total)).filter((p) => !isNaN(p) && p > 0);
    const min = Math.min(...prices);

    cache.set(cacheKey, { price: min, fetchedAt: Date.now() });

    return NextResponse.json({
      price: min,
      currency: "USD",
      source: "amadeus",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { price: null, source: "amadeus", error: `Fetch failed: ${message}` },
      { status: 200 } // return 200 so client can show fallback gracefully
    );
  }
}

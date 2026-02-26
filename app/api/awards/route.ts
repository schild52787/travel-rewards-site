import { NextRequest, NextResponse } from "next/server";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY ?? "";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const cache = new Map<string, { miles: number | null; source: string; fetchedAt: number }>();

const PROGRAM_SEARCH_TERMS: Record<string, string> = {
  flyingblue: "Flying Blue",
  aadvantage: "AAdvantage Iberia",
  virginatlantic: "Virgin Atlantic Flying Club",
  skymileseco: "Delta SkyMiles",
  united: "United MileagePlus",
};

async function braveSearch(query: string): Promise<Array<{ title: string; description: string }>> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8&freshness=py`;
  const resp = await fetch(url, {
    headers: { "Accept": "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!resp.ok) return [];
  const data = await resp.json() as { web?: { results?: Array<{ title: string; description: string }> } };
  return data.web?.results ?? [];
}

function extractMiles(text: string): number | null {
  // Match patterns like "22,500 miles", "55k miles", "55,000 award miles", "22.5k points"
  const patterns = [
    /(\d{1,3}(?:,\d{3})+)\s*(?:miles|points|award)/gi,
    /(\d+)k\s*(?:miles|points)/gi,
    /(\d+),(\d{3})\s*(?:Flying Blue|SkyMiles|AAdvantage|miles)/gi,
  ];

  const found: number[] = [];

  for (const pat of patterns) {
    let m: RegExpExecArray | null;
    pat.lastIndex = 0;
    while ((m = pat.exec(text)) !== null) {
      let val: number;
      if (m[0].toLowerCase().includes("k")) {
        val = parseInt(m[1]) * 1000;
      } else {
        val = parseInt(m[1].replace(/,/g, ""));
      }
      // Plausible range for transatlantic economy award (8k–200k)
      if (val >= 8000 && val <= 200000) {
        found.push(val);
      }
    }
  }

  if (found.length === 0) return null;
  // Return the most-commonly mentioned value (mode) or median
  const sorted = found.sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin")?.toUpperCase();
  const destination = searchParams.get("destination")?.toUpperCase();
  const originCity = searchParams.get("originCity") ?? origin;
  const destCity = searchParams.get("destCity") ?? destination;
  const programId = searchParams.get("program") ?? "flyingblue";
  const date = searchParams.get("date") ?? "";

  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
  }

  const cacheKey = `${origin}-${destination}-${programId}-${date}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached, cached: true });
  }

  const programName = PROGRAM_SEARCH_TERMS[programId] ?? programId;
  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();

  // Multiple search queries for coverage
  const queries = [
    `"${programName}" ${origin} ${destination} miles award economy ${year}`,
    `"${programName}" "${originCity}" "${destCity}" award miles economy one-way`,
    `${programName} ${origin} ${destination} economy award how many miles`,
  ];

  const allText: string[] = [];
  for (const q of queries) {
    const results = await braveSearch(q);
    for (const r of results) {
      allText.push(`${r.title} ${r.description}`);
    }
  }

  const combined = allText.join(" ");
  const miles = extractMiles(combined);

  const result = {
    miles,
    source: miles ? "community-estimate" : "not-found",
    confidence: miles ? "low" : "none",
    fetchedAt: Date.now(),
  };

  cache.set(cacheKey, result);

  return NextResponse.json({
    ...result,
    fetchedAt: new Date(result.fetchedAt).toISOString(),
  });
}

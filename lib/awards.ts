import { RewardProgram } from "./types";

/** Default published award rates & booking links */
export const DEFAULT_PROGRAMS: RewardProgram[] = [
  {
    id: "flyingblue",
    name: "Flying Blue (Air France/KLM)",
    miles: 22500,
    threshold: 1.5,
    bookUrl: "https://www.flyingblue.com/en/book-award",
    color: "bg-blue-600",
  },
  {
    id: "aadvantage",
    name: "AA AAdvantage (via Iberia)",
    miles: 30000,
    threshold: 1.5,
    bookUrl: "https://www.aa.com/aadvantage-program/redeem-miles/flights",
    color: "bg-red-600",
  },
  {
    id: "virginatlantic",
    name: "Virgin Atlantic Flying Club",
    miles: 30000,
    threshold: 1.5,
    bookUrl: "https://www.virginatlantic.com/en/us/flying-club/spend-miles",
    color: "bg-pink-600",
  },
  {
    id: "skymileseco",
    name: "Delta SkyMiles (Economy)",
    miles: 35000,
    threshold: 1.5,
    bookUrl: "https://www.delta.com/us/en/skymiles/redeem-miles/book-a-flight",
    color: "bg-indigo-600",
  },
];

export const DEFAULT_ROUTES = [
  {
    id: "opo-ord",
    label: "Porto → Chicago (Mom Leg 1)",
    origin: "OPO",
    originCity: "Porto",
    destination: "ORD",
    destCity: "Chicago",
    date: "2026-05-27",
  },
  {
    id: "ams-msp",
    label: "Amsterdam → Minneapolis (Mom Leg 2)",
    origin: "AMS",
    originCity: "Amsterdam",
    destination: "MSP",
    destCity: "Minneapolis",
    date: "2026-07-27",
  },
];

/** Generate a live award search deeplink for a program + route */
export function awardSearchUrl(programId: string, origin: string, destination: string, date: string): string {
  switch (programId) {
    case "aadvantage":
      return `https://www.aa.com/booking/search?locale=en_US&pax=1&adult=1&type=OneWay&searchType=Award&cabin=&carriers=ALL&slices=[{"orig":"${origin}","origNearby":false,"dest":"${destination}","destNearby":false,"date":"${date}"}]`;
    case "virginatlantic":
      return `https://flysearch.virgin-atlantic.com/search/results?adultsCount=1&cabinClass=Economy&isReturn=false&departureAirportCode=${origin}&arrivalAirportCode=${destination}&departureDate=${date}`;
    case "skymileseco":
      return `https://www.delta.com/us/en/flight-search/search?tripType=ONE_WAY&fareClass=business&origin=${origin}&destination=${destination}&departureDate=${date}&paxCount=1&isAwardTravel=true`;
    case "flyingblue":
      return `https://www.flyingblue.com/en/book-award`;
    default:
      return "https://www.google.com/travel/flights";
  }
}

/** Cents-per-mile value calculation */
export function calcCpp(cashPrice: number, miles: number): number {
  if (!cashPrice || !miles) return 0;
  return parseFloat(((cashPrice / miles) * 100).toFixed(2));
}

/** Value tier label + tailwind color */
export function valueTier(cpp: number, threshold: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (cpp <= 0) return { label: "N/A", color: "text-gray-400", emoji: "—" };
  if (cpp >= threshold * 1.5) return { label: "Excellent", color: "text-emerald-600", emoji: "🔥" };
  if (cpp >= threshold) return { label: "Good", color: "text-green-600", emoji: "✅" };
  if (cpp >= 1.0) return { label: "Decent", color: "text-yellow-600", emoji: "🟡" };
  return { label: "Poor", color: "text-red-500", emoji: "❌" };
}

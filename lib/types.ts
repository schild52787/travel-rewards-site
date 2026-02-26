export interface FlightRoute {
  id: string;
  label: string;
  origin: string;       // IATA code, e.g. "OPO"
  originCity: string;   // e.g. "Porto"
  destination: string;  // IATA code, e.g. "ORD"
  destCity: string;     // e.g. "Chicago"
  date: string;         // YYYY-MM-DD
}

export interface RewardProgram {
  id: string;
  name: string;         // e.g. "Flying Blue"
  miles: number;        // miles required one-way (default / override)
  balance?: number;     // user's miles balance (optional)
  threshold: number;    // alert if cpp >= this (default 1.5)
  bookUrl: string;      // booking page URL
  color: string;        // tailwind bg color class for badge
}

export interface PriceResult {
  price: number | null;
  currency: string;
  source: string;
  fetchedAt: string;
  error?: string;
}

export interface ValueResult {
  program: RewardProgram;
  cpp: number;           // cents per mile
  cashPrice: number;
  bookings?: number;     // how many one-ways you can book with balance
  beats: boolean;        // cpp >= threshold
}

export interface AppSettings {
  routes: FlightRoute[];
  programs: RewardProgram[];
}

"use client";

import { AppSettings } from "./types";
import { DEFAULT_PROGRAMS, DEFAULT_ROUTES } from "./awards";

const STORAGE_KEY = "flight-tracker-settings";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return { routes: DEFAULT_ROUTES, programs: DEFAULT_PROGRAMS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { routes: DEFAULT_ROUTES, programs: DEFAULT_PROGRAMS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      routes: parsed.routes?.length ? parsed.routes : DEFAULT_ROUTES,
      programs: parsed.programs?.length ? parsed.programs : DEFAULT_PROGRAMS,
    };
  } catch {
    return { routes: DEFAULT_ROUTES, programs: DEFAULT_PROGRAMS };
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Per-route, per-program mile overrides: "OPO-ORD-flyingblue" → 55000
const MILES_KEY = "flight-tracker-miles-overrides";

export function getMilesOverride(routeId: string, programId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MILES_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, number>;
    return data[`${routeId}-${programId}`] ?? null;
  } catch { return null; }
}

export function setMilesOverride(routeId: string, programId: string, miles: number): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MILES_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    data[`${routeId}-${programId}`] = miles;
    localStorage.setItem(MILES_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function clearMilesOverride(routeId: string, programId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MILES_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as Record<string, number>;
    delete data[`${routeId}-${programId}`];
    localStorage.setItem(MILES_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

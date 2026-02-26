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

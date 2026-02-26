"use client";

import { useState, useEffect } from "react";
import { AppSettings, FlightRoute } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/storage";
import FlightCard from "@/components/FlightCard";
import RouteEditor from "@/components/RouteEditor";
import ProgramEditor from "@/components/ProgramEditor";

export default function Home() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [editingRoute, setEditingRoute] = useState<string | "new" | null>(null);
  const [showPrograms, setShowPrograms] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Persist on every change
  useEffect(() => {
    if (settings) saveSettings(settings);
  }, [settings]);

  if (!settings) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading…</div>
      </main>
    );
  }

  const updateRoute = (route: FlightRoute) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            routes: prev.routes.find((r) => r.id === route.id)
              ? prev.routes.map((r) => (r.id === route.id ? route : r))
              : [...prev.routes, route],
          }
        : prev
    );
    setEditingRoute(null);
  };

  const deleteRoute = (id: string) => {
    setSettings((prev) =>
      prev ? { ...prev, routes: prev.routes.filter((r) => r.id !== id) } : prev
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">✈️ Flight Tracker</h1>
            <p className="text-xs text-gray-500">Live prices + rewards value calculator</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPrograms(!showPrograms)}
              className={`text-xs rounded-lg px-3 py-1.5 border transition ${
                showPrograms
                  ? "bg-teal-600 text-white border-teal-600"
                  : "text-teal-600 border-teal-200 hover:border-teal-400"
              }`}
            >
              🎯 Programs
            </button>
            <button
              onClick={() => setEditingRoute("new")}
              className="text-xs text-white bg-teal-600 hover:bg-teal-700 rounded-lg px-3 py-1.5 transition"
            >
              + Flight
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Programs editor */}
        {showPrograms && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <ProgramEditor
              programs={settings.programs}
              onChange={(programs) => setSettings((prev) => prev ? { ...prev, programs } : prev)}
            />
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">📌 Key Intel</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-xs text-amber-900">
                <p>⚠️ <strong>Flying Blue 60-day cliff:</strong> Partner award prices can spike inside 60 days. For AMS→MSP Jul 27 — book before May 28, 2026.</p>
                <p>⚠️ <strong>Transfer bonuses:</strong> Amex MR and Chase UR occasionally offer 25–30% transfer bonuses to Flying Blue. 22,500 miles could cost only ~17,000 points.</p>
                <p>⚠️ <strong>Promo awards:</strong> Flying Blue runs monthly promos ~20% cheaper. Set a Google Alert for &quot;Flying Blue promo awards.&quot;</p>
              </div>
            </div>
          </div>
        )}

        {/* Add/edit route form */}
        {editingRoute === "new" && (
          <RouteEditor onSave={updateRoute} onCancel={() => setEditingRoute(null)} />
        )}

        {/* Flight cards */}
        {settings.routes.length === 0 && editingRoute !== "new" && (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-3">✈️</p>
            <p className="text-sm">No flights yet.</p>
            <button
              onClick={() => setEditingRoute("new")}
              className="mt-4 text-sm text-teal-600 hover:text-teal-800 underline"
            >
              Add your first flight
            </button>
          </div>
        )}

        {settings.routes.map((route) =>
          editingRoute === route.id ? (
            <RouteEditor
              key={route.id}
              route={route}
              onSave={updateRoute}
              onCancel={() => setEditingRoute(null)}
            />
          ) : (
            <FlightCard
              key={route.id}
              route={route}
              programs={settings.programs}
              onEdit={() => setEditingRoute(route.id)}
              onDelete={() => deleteRoute(route.id)}
            />
          )
        )}

        {/* Footer intel */}
        {settings.routes.length > 0 && (
          <div className="text-center text-xs text-gray-400 pb-8 space-y-1">
            <p>Prices from Amadeus · Cached 2 hours · Tap 🔄 to refresh any route</p>
            <p>Award rates are published standard rates — actual availability may vary</p>
          </div>
        )}
      </div>
    </main>
  );
}

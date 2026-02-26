"use client";

import { useState, useEffect, useCallback } from "react";
import { FlightRoute, RewardProgram, PriceResult } from "@/lib/types";
import ValueMeter from "./ValueMeter";

interface Props {
  route: FlightRoute;
  programs: RewardProgram[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function FlightCard({ route, programs, onEdit, onDelete }: Props) {
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/price?origin=${route.origin}&destination=${route.destination}&date=${route.date}`
      );
      const data = await res.json();
      setPriceResult(data);
    } catch {
      setPriceResult({ price: null, currency: "USD", source: "error", fetchedAt: new Date().toISOString(), error: "Network error" });
    } finally {
      setLoading(false);
    }
  }, [route.origin, route.destination, route.date]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const cashPrice = priceResult?.price ?? null;
  const fetchedAt = priceResult?.fetchedAt ? new Date(priceResult.fetchedAt) : null;
  const formattedDate = new Date(route.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

  const googleFlightsUrl = `https://www.google.com/travel/flights/search?tfs=CBwQAhopEgoyMDI2LTA1LTI3agcIARIDT1BPcgcIARIDT1JEEgoyMDI2LTA1LTI3SABQAWIBL2MvcC8wN2Rm`;
  const gfUrl = `https://www.google.com/travel/flights?q=flights+from+${route.origin}+to+${route.destination}+on+${route.date}`;

  // Best value program
  const bestProgram = cashPrice
    ? programs
        .map((p) => ({ p, cpp: (cashPrice / p.miles) * 100 }))
        .filter((x) => x.cpp >= x.p.threshold)
        .sort((a, b) => b.cpp - a.cpp)[0]
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-teal-100 text-xs font-medium uppercase tracking-wide">{route.label}</p>
            <h2 className="text-white text-xl font-bold mt-0.5">
              {route.originCity} ({route.origin}) → {route.destCity} ({route.destination})
            </h2>
            <p className="text-teal-100 text-sm mt-1">{formattedDate}</p>
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={onEdit} className="text-teal-100 hover:text-white text-xs bg-teal-700/50 hover:bg-teal-700 rounded px-2 py-1 transition">
              ✏️ Edit
            </button>
            <button onClick={onDelete} className="text-teal-100 hover:text-red-200 text-xs bg-teal-700/50 hover:bg-red-700/50 rounded px-2 py-1 transition">
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Cash Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Live Cash Price</p>
            {loading ? (
              <div className="mt-1 h-9 w-28 bg-gray-100 rounded animate-pulse" />
            ) : cashPrice ? (
              <p className="text-4xl font-bold text-gray-900 mt-0.5">
                ${Math.round(cashPrice).toLocaleString()}
              </p>
            ) : (
              <p className="text-gray-400 text-sm mt-1">
                {priceResult?.error ?? "Unavailable"}
              </p>
            )}
            {fetchedAt && !loading && (
              <p className="text-xs text-gray-400 mt-1">
                via Amadeus · {fetchedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={fetchPrice}
              disabled={loading}
              className="text-xs text-teal-600 hover:text-teal-800 border border-teal-200 hover:border-teal-400 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
            >
              {loading ? "⏳ Loading…" : "🔄 Refresh"}
            </button>
            <a
              href={gfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-100 hover:border-blue-300 rounded-lg px-3 py-1.5 transition"
            >
              Google Flights ↗
            </a>
          </div>
        </div>

        {/* Recommendation banner */}
        {cashPrice && bestProgram && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-emerald-800">
              🏆 Best value: {bestProgram.p.name}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {bestProgram.p.miles.toLocaleString()} miles = {bestProgram.cpp.toFixed(1)}¢/mile
              {bestProgram.p.balance
                ? ` · You can book ${Math.floor(bestProgram.p.balance / bestProgram.p.miles)} one-way(s)`
                : ""}
            </p>
            <a
              href={bestProgram.p.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5 transition"
            >
              Book with miles ↗
            </a>
          </div>
        )}

        {/* Programs value table */}
        {cashPrice && programs.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Reward Value Calculator</p>
            {programs.map((prog) => (
              <div key={prog.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs text-white font-semibold ${prog.color} rounded px-2 py-0.5`}>
                      {prog.name.split(" ")[0]}
                    </span>
                    <span className="text-sm text-gray-700 font-medium">{prog.name}</span>
                  </div>
                  <a
                    href={prog.bookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-600 hover:underline"
                  >
                    Book ↗
                  </a>
                </div>
                <p className="text-xs text-gray-500">{prog.miles.toLocaleString()} miles required</p>
                <ValueMeter cashPrice={cashPrice} miles={prog.miles} threshold={prog.threshold} />
              </div>
            ))}
          </div>
        )}

        {!cashPrice && !loading && (
          <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">
            Price unavailable — <a href={gfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">check Google Flights</a>
          </div>
        )}
      </div>
    </div>
  );
}

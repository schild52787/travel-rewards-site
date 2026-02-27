"use client";

import { useState, useEffect } from "react";
import { RewardProgram, FlightRoute, LiveAwardResult, AwardsApiResponse } from "@/lib/types";
import ValueMeter from "./ValueMeter";

// Map program IDs to seats.aero Source codes
const PROGRAM_CODES: Record<string, string[]> = {
  flyingblue: ["FB", "AF"],
  virginatlantic: ["VS"],
  skymileseco: ["DL"],
  aadvantage: ["AA"],
  united: ["UA"],
};

interface Props {
  program: RewardProgram;
  route: FlightRoute;
  cashPrice: number;
}

export default function AwardRow({ program, route, cashPrice }: Props) {
  const [apiResponse, setApiResponse] = useState<AwardsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/awards?origin=${route.origin}&destination=${route.destination}&date=${route.date}`)
      .then((r) => r.json())
      .then((data: AwardsApiResponse) => setApiResponse(data))
      .catch(() =>
        setApiResponse({
          status: "error",
          results: [],
          fetchedAt: new Date().toISOString(),
          source: "seats.aero",
          message: "Network error",
        })
      )
      .finally(() => setLoading(false));
  }, [route.origin, route.destination, route.date]);

  const codes = PROGRAM_CODES[program.id] ?? [];
  const matches: LiveAwardResult[] = apiResponse?.results.filter((r) => codes.includes(r.programCode)) ?? [];

  const formattedDate = new Date(route.date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50">
        <span className={`text-xs text-white font-semibold ${program.color} rounded px-2 py-0.5 shrink-0`}>
          {program.name.split(" ")[0]}
        </span>
        <span className="text-sm text-gray-700 font-medium flex-1 truncate">{program.name}</span>
        {!loading && matches.length > 0 && (() => {
          const best = matches[0];
          const cpp = cashPrice > 0 ? (cashPrice / best.milesCost) * 100 : null;
          const cppColor =
            cpp === null ? "text-gray-400"
            : cpp >= program.threshold * 1.5 ? "text-amber-600"
            : cpp >= program.threshold ? "text-emerald-600"
            : "text-red-500";
          return cpp !== null ? (
            <span className={`text-xs font-bold shrink-0 ${cppColor}`}>
              {cpp.toFixed(2)}¢/mi
            </span>
          ) : null;
        })()}
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ) : apiResponse?.status === "key_required" ? (
          <p className="text-xs text-gray-400 italic">
            Live award data requires seats.aero Pro API key — add SEATS_AERO_API_KEY to environment
          </p>
        ) : apiResponse?.status === "error" ? (
          <p className="text-xs text-red-400">
            {apiResponse.message ?? "Error loading award data"}
          </p>
        ) : matches.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No award space found on {formattedDate}</p>
        ) : (
          <div className="space-y-4">
            {matches.map((result, i) => {
              const cpp = cashPrice > 0 ? (cashPrice / result.milesCost) * 100 : null;
              const cppColor =
                cpp === null ? "text-gray-400"
                : cpp >= program.threshold * 1.5 ? "text-amber-600"
                : cpp >= program.threshold ? "text-emerald-600"
                : "text-red-500";

              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">
                          {result.milesCost.toLocaleString()} miles
                        </span>
                        <span className="text-xs text-gray-500">
                          {result.seatsAvailable} seat{result.seatsAvailable !== 1 ? "s" : ""} left
                        </span>
                        <span
                          className={`text-xs rounded px-1.5 py-0.5 ${
                            result.direct
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-50 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {result.direct ? "Direct" : `${result.stops} stop${result.stops !== 1 ? "s" : ""}`}
                        </span>
                        {result.carriers && (
                          <span className="text-xs text-gray-500">via {result.carriers}</span>
                        )}
                      </div>
                      {cpp !== null && (
                        <div className={`text-xs font-semibold ${cppColor}`}>
                          {cpp.toFixed(2)}¢/mi{cpp >= program.threshold ? " ✅" : " ❌"}
                        </div>
                      )}
                    </div>
                    <a
                      href={result.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg px-3 py-2 transition"
                    >
                      Book ↗
                    </a>
                  </div>
                  {cpp !== null && (
                    <ValueMeter cashPrice={cashPrice} miles={result.milesCost} threshold={program.threshold} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Attribution */}
        <div className="pt-1 border-t border-gray-100">
          <a
            href="https://seats.aero"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Powered by seats.aero
          </a>
        </div>
      </div>
    </div>
  );
}

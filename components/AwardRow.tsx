"use client";

import { useState, useEffect } from "react";
import { RewardProgram, FlightRoute } from "@/lib/types";
import { getMilesOverride, setMilesOverride, clearMilesOverride } from "@/lib/storage";
import { awardSearchUrl } from "@/lib/awards";
import ValueMeter from "./ValueMeter";

interface Props {
  program: RewardProgram;
  route: FlightRoute;
  cashPrice: number;
}

export default function AwardRow({ program, route, cashPrice }: Props) {
  const [override, setOverride] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [inputOpen, setInputOpen] = useState(false);

  useEffect(() => {
    const saved = getMilesOverride(route.id, program.id);
    setOverride(saved);
  }, [route.id, program.id]);

  const handleSave = () => {
    const val = parseInt(inputVal.replace(/[^0-9]/g, ""));
    if (!isNaN(val) && val > 1000) {
      setMilesOverride(route.id, program.id, val);
      setOverride(val);
      setInputOpen(false);
      setInputVal("");
    }
  };

  const handleClear = () => {
    clearMilesOverride(route.id, program.id);
    setOverride(null);
    setInputOpen(false);
    setInputVal("");
  };

  const liveUrl = awardSearchUrl(program.id, route.origin, route.destination, route.date);
  const hasMiles = override !== null;
  const cpp = hasMiles ? (cashPrice / override!) * 100 : null;

  return (
    <div className={`rounded-xl border overflow-hidden transition ${hasMiles ? "border-gray-200" : "border-dashed border-gray-200"}`}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50">
        <span className={`text-xs text-white font-semibold ${program.color} rounded px-2 py-0.5 shrink-0`}>
          {program.name.split(" ")[0]}
        </span>
        <span className="text-sm text-gray-700 font-medium flex-1 truncate">{program.name}</span>

        {/* Right side: either value badge or "no price yet" */}
        {hasMiles && cpp !== null ? (
          <span className={`text-xs font-bold shrink-0 ${cpp >= program.threshold * 1.5 ? "text-amber-600" : cpp >= program.threshold ? "text-emerald-600" : "text-gray-400"}`}>
            {cpp.toFixed(1)}¢/mi
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic shrink-0">price unknown</span>
        )}
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {hasMiles ? (
          /* ── HAS A REAL PRICE ── */
          <>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-gray-900">{override!.toLocaleString()} miles</span>
                <span className="ml-2 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 font-medium">
                  ✅ Your quote
                </span>
              </div>
              <button onClick={() => setInputOpen(!inputOpen)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Edit
              </button>
            </div>
            <ValueMeter cashPrice={cashPrice} miles={override!} threshold={program.threshold} />
          </>
        ) : (
          /* ── NO PRICE YET — CTA IS THE HERO ── */
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-amber-800 mb-1">
                Dynamic pricing — estimated miles aren't reliable for this program
              </p>
              <p className="text-xs text-amber-700">
                Check the live price, then enter it below for an accurate value calculation.
              </p>
            </div>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg px-3 py-2 transition"
            >
              Search {program.name.split(" ")[0]} live ↗
            </a>
          </>
        )}

        {/* Input field — always shown when no price, toggle when editing */}
        {(!hasMiles || inputOpen) && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              inputMode="numeric"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={hasMiles ? override!.toLocaleString() : "e.g. 55,000"}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              autoFocus={inputOpen}
            />
            <button
              onClick={handleSave}
              disabled={!inputVal.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-lg px-4 py-2 text-sm font-medium transition shrink-0"
            >
              Save
            </button>
            {hasMiles && (
              <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-600 border border-red-100 rounded-lg px-2 py-2">
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

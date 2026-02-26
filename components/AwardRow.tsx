"use client";

import { useState, useEffect } from "react";
import { RewardProgram, FlightRoute } from "@/lib/types";
import { getMilesOverride, setMilesOverride, clearMilesOverride } from "@/lib/storage";
import { awardSearchUrl } from "@/lib/awards";
import ValueMeter from "./ValueMeter";

interface AwardEstimate {
  miles: number | null;
  source: string;
  confidence: string;
  fetchedAt?: string;
}

interface Props {
  program: RewardProgram;
  route: FlightRoute;
  cashPrice: number;
}

export default function AwardRow({ program, route, cashPrice }: Props) {
  const [estimate, setEstimate] = useState<AwardEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [override, setOverride] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [inputVal, setInputVal] = useState("");

  // Load saved override from localStorage
  useEffect(() => {
    const saved = getMilesOverride(route.id, program.id);
    setOverride(saved);
  }, [route.id, program.id]);

  // Fetch Brave Search estimate on mount
  useEffect(() => {
    if (override !== null) return; // skip if user has an override
    setLoading(true);
    fetch(
      `/api/awards?origin=${route.origin}&destination=${route.destination}` +
      `&originCity=${encodeURIComponent(route.originCity)}&destCity=${encodeURIComponent(route.destCity)}` +
      `&program=${program.id}&date=${route.date}`
    )
      .then((r) => r.json())
      .then((data) => setEstimate(data as AwardEstimate))
      .catch(() => setEstimate({ miles: null, source: "error", confidence: "none" }))
      .finally(() => setLoading(false));
  }, [route, program.id, override]);

  const activeMiles = override ?? estimate?.miles ?? program.miles;
  const isOverride = override !== null;
  const isEstimate = !isOverride && estimate?.miles != null;
  const isDefault = !isOverride && !isEstimate;
  const cpp = activeMiles ? (cashPrice / activeMiles) * 100 : 0;

  const handleSaveOverride = () => {
    const val = parseInt(inputVal.replace(/,/g, ""));
    if (!isNaN(val) && val > 0) {
      setMilesOverride(route.id, program.id, val);
      setOverride(val);
      setEditMode(false);
      setInputVal("");
    }
  };

  const handleClearOverride = () => {
    clearMilesOverride(route.id, program.id);
    setOverride(null);
    setEditMode(false);
  };

  const liveUrl = awardSearchUrl(program.id, route.origin, route.destination, route.date);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Program header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={`text-xs text-white font-semibold ${program.color} rounded px-2 py-0.5 shrink-0`}>
          {program.name.split(" ")[0]}
        </span>
        <span className="text-sm text-gray-700 font-medium flex-1 truncate">{program.name}</span>
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-teal-600 hover:text-teal-800 font-medium border border-teal-100 hover:border-teal-300 rounded-lg px-2 py-1 transition shrink-0"
        >
          Search live ↗
        </a>
      </div>

      <div className="px-3 pb-3 space-y-2">
        {/* Miles display */}
        <div className="flex items-center gap-2 flex-wrap">
          {loading ? (
            <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <span className="text-sm font-bold text-gray-800">
                {activeMiles?.toLocaleString()} miles
              </span>
              {isOverride && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 font-medium">
                  ✅ Your quote
                </span>
              )}
              {isEstimate && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                  ⚠️ Estimated
                </span>
              )}
              {isDefault && (
                <span className="text-xs bg-gray-50 text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">
                  📋 Published rate
                </span>
              )}
            </>
          )}

          {/* Edit/enter actual button */}
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto"
            >
              {isOverride ? "Edit" : "Enter actual →"}
            </button>
          )}
        </div>

        {/* Manual override input */}
        {editMode && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5 space-y-2">
            <p className="text-xs text-teal-700">
              Check{" "}
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                {program.name.split(" ")[0]}'s award search ↗
              </a>{" "}
              for this route, then enter the miles quoted:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveOverride()}
                placeholder={`e.g. ${(activeMiles ?? 22500).toLocaleString()}`}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                autoFocus
              />
              <button
                onClick={handleSaveOverride}
                disabled={!inputVal.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-lg px-3 py-1.5 text-xs font-medium transition"
              >
                Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 transition"
              >
                ✕
              </button>
            </div>
            {isOverride && (
              <button
                onClick={handleClearOverride}
                className="text-xs text-red-400 hover:text-red-600 underline"
              >
                Clear override (use estimate)
              </button>
            )}
          </div>
        )}

        {/* Value meter */}
        {!loading && activeMiles && cashPrice > 0 && (
          <ValueMeter cashPrice={cashPrice} miles={activeMiles} threshold={program.threshold} />
        )}

        {/* Source note */}
        {!loading && isEstimate && estimate?.fetchedAt && (
          <p className="text-xs text-gray-400">
            Estimate from web search · verify on {program.name.split(" ")[0]} before booking
          </p>
        )}
        {!loading && isDefault && (
          <p className="text-xs text-gray-400">
            Using published standard rate — actual dynamic price will vary.{" "}
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Check live ↗
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

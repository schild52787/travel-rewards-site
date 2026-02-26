"use client";

import { useState, useEffect } from "react";
import { RewardProgram, FlightRoute } from "@/lib/types";
import { getQuote, setQuote, clearMilesOverride, AwardQuote } from "@/lib/storage";
import { awardSearchUrl } from "@/lib/awards";
import ValueMeter from "./ValueMeter";

interface Props {
  program: RewardProgram;
  route: FlightRoute;
  cashPrice: number;
}

export default function AwardRow({ program, route, cashPrice }: Props) {
  const [quote, setQuoteState] = useState<AwardQuote | null>(null);
  const [milesInput, setMilesInput] = useState("");
  const [feesInput, setFeesInput] = useState("");
  const [inputOpen, setInputOpen] = useState(false);

  useEffect(() => {
    setQuoteState(getQuote(route.id, program.id));
  }, [route.id, program.id]);

  const handleSave = () => {
    const miles = parseInt(milesInput.replace(/[^0-9]/g, ""));
    const fees = parseFloat(feesInput.replace(/[^0-9.]/g, "")) || 0;
    if (!isNaN(miles) && miles > 1000) {
      const q: AwardQuote = { miles, fees };
      setQuote(route.id, program.id, q);
      setQuoteState(q);
      setInputOpen(false);
      setMilesInput("");
      setFeesInput("");
    }
  };

  const handleClear = () => {
    clearMilesOverride(route.id, program.id);
    setQuoteState(null);
    setInputOpen(false);
  };

  const liveUrl = awardSearchUrl(program.id, route.origin, route.destination, route.date);
  const hasQuote = quote !== null;

  // Two calculations:
  // 1. Gross CPP (ignoring fees) = cashPrice / miles
  // 2. Net CPP (after fees)      = (cashPrice - fees) / miles  ← the honest number
  const grossCpp = hasQuote ? (cashPrice / quote!.miles) * 100 : null;
  const netCpp   = hasQuote ? Math.max(0, (cashPrice - quote!.fees) / quote!.miles) * 100 : null;
  const hasFees  = hasQuote && quote!.fees > 0;

  // Use net CPP for all value decisions (the correct metric)
  const activeCpp = netCpp;

  const cppColor =
    activeCpp === null ? "text-gray-400"
    : activeCpp >= program.threshold * 1.5 ? "text-amber-600"
    : activeCpp >= program.threshold ? "text-emerald-600"
    : "text-red-500";

  return (
    <div className={`rounded-xl border overflow-hidden ${hasQuote ? "border-gray-200" : "border-dashed border-gray-200"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50">
        <span className={`text-xs text-white font-semibold ${program.color} rounded px-2 py-0.5 shrink-0`}>
          {program.name.split(" ")[0]}
        </span>
        <span className="text-sm text-gray-700 font-medium flex-1 truncate">{program.name}</span>
        {hasQuote && activeCpp !== null ? (
          <span className={`text-xs font-bold shrink-0 ${cppColor}`}>
            {activeCpp.toFixed(2)}¢/mi
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic shrink-0">price unknown</span>
        )}
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {hasQuote ? (
          <>
            {/* Quote summary */}
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900">
                    {quote!.miles.toLocaleString()} miles
                  </span>
                  {hasFees && (
                    <span className="text-sm text-gray-500">
                      + ${quote!.fees.toLocaleString()} fees
                    </span>
                  )}
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5">
                    ✅ Your quote
                  </span>
                </div>

                {/* Fee-adjusted breakdown */}
                {hasFees && grossCpp !== null && netCpp !== null && (
                  <div className="text-xs text-gray-500 space-y-0.5 pt-1">
                    <div>
                      Gross (ignore fees): <span className="font-medium">{grossCpp.toFixed(2)}¢/mi</span>
                    </div>
                    <div className="font-medium text-gray-700">
                      Net after fees: <span className={cppColor}>{netCpp.toFixed(2)}¢/mi</span>
                      <span className="text-gray-400 font-normal"> ← use this</span>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setInputOpen(!inputOpen)} className="text-xs text-gray-400 hover:text-gray-600 underline shrink-0 mt-0.5">
                Edit
              </button>
            </div>

            {/* Value meter based on net CPP */}
            {netCpp !== null && (
              <ValueMeter cashPrice={cashPrice - quote!.fees} miles={quote!.miles} threshold={program.threshold} />
            )}

            {/* Verdict */}
            {netCpp !== null && netCpp < program.threshold && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-medium">
                ❌ Below your {program.threshold}¢ threshold after fees — book cash (${ cashPrice.toLocaleString()}) instead
              </div>
            )}
          </>
        ) : (
          /* No price yet */
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-amber-800 mb-0.5">Dynamic pricing — check the live price</p>
              <p className="text-xs text-amber-700">
                Enter miles + any fees/taxes for an accurate value calculation.
              </p>
            </div>
            <a href={liveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg px-3 py-2 transition">
              Search {program.name.split(" ")[0]} live ↗
            </a>
          </>
        )}

        {/* Input form */}
        {(!hasQuote || inputOpen) && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Miles required</label>
                <input type="text" inputMode="numeric" value={milesInput}
                  onChange={(e) => setMilesInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder={hasQuote ? quote!.miles.toLocaleString() : "e.g. 55,500"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  autoFocus={!hasQuote}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fees/taxes (USD)</label>
                <input type="text" inputMode="decimal" value={feesInput}
                  onChange={(e) => setFeesInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder={hasQuote ? `$${quote!.fees}` : "e.g. 222"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={!milesInput.trim()}
                className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-lg py-2 text-sm font-medium transition">
                Save quote
              </button>
              {hasQuote && (
                <button onClick={handleClear}
                  className="text-xs text-red-400 hover:text-red-600 border border-red-100 rounded-lg px-3 py-2">
                  Clear
                </button>
              )}
              {inputOpen && (
                <button onClick={() => setInputOpen(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-2">
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { valueTier } from "@/lib/awards";

interface Props {
  cashPrice: number;
  miles: number;
  threshold: number;
}

export default function ValueMeter({ cashPrice, miles, threshold }: Props) {
  const cpp = miles > 0 ? parseFloat(((cashPrice / miles) * 100).toFixed(2)) : 0;
  const { label, color, emoji } = valueTier(cpp, threshold);

  // Bar width: cap at 5cpp = 100%
  const maxCpp = 5;
  const pct = Math.min((cpp / maxCpp) * 100, 100);

  // Gradient stop positions (as % of 5cpp scale)
  const t1 = (1.0 / maxCpp) * 100; // 20%
  const t2 = (threshold / maxCpp) * 100;
  const t3 = (2.5 / maxCpp) * 100; // 50%

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 text-xs">
          ${cashPrice.toFixed(0)} ÷ {miles.toLocaleString()} mi
        </span>
        <span className={`font-bold ${color}`}>
          {emoji} {cpp > 0 ? `${cpp}¢/mi` : "—"}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            cpp >= threshold * 1.5
              ? "bg-amber-400"
              : cpp >= threshold
              ? "bg-emerald-500"
              : cpp >= 1.0
              ? "bg-yellow-400"
              : "bg-red-400"
          }`}
          style={{ width: `${pct}%` }}
        />
        {/* Threshold marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-700 opacity-40"
          style={{ left: `${t2}%` }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>0¢</span>
        <span style={{ marginLeft: `${t1 - 5}%` }}>1¢</span>
        <span className="text-gray-600 font-medium" style={{ marginLeft: `${t2 - t1 - 3}%` }}>
          {threshold}¢ ▲
        </span>
        <span>5¢+</span>
      </div>

      {cpp >= threshold && (
        <div className="mt-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
          🎯 {label} — {(cpp / threshold).toFixed(1)}× your threshold. Consider miles!
        </div>
      )}
      {cpp > 0 && cpp < 1.0 && (
        <div className="mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          Poor value — book cash instead.
        </div>
      )}
    </div>
  );
}

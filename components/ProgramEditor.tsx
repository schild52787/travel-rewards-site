"use client";

import { useState } from "react";
import { RewardProgram } from "@/lib/types";

interface Props {
  programs: RewardProgram[];
  onChange: (programs: RewardProgram[]) => void;
}

const COLORS = [
  "bg-blue-600", "bg-red-600", "bg-pink-600", "bg-indigo-600",
  "bg-purple-600", "bg-orange-600", "bg-cyan-600", "bg-rose-600",
];

const PRESETS = [
  { name: "Flying Blue (Air France/KLM)", miles: 22500, bookUrl: "https://www.flyingblue.com/en/book-award", color: "bg-blue-600" },
  { name: "AA AAdvantage (via Iberia)", miles: 30000, bookUrl: "https://www.aa.com/aadvantage-program/redeem-miles/flights", color: "bg-red-600" },
  { name: "Virgin Atlantic Flying Club", miles: 30000, bookUrl: "https://www.virginatlantic.com/en/us/flying-club/spend-miles", color: "bg-pink-600" },
  { name: "Delta SkyMiles", miles: 35000, bookUrl: "https://www.delta.com/us/en/skymiles/redeem-miles/book-a-flight", color: "bg-indigo-600" },
  { name: "United MileagePlus", miles: 30000, bookUrl: "https://www.united.com/en/us/fly/mileageplus/awards.html", color: "bg-blue-800" },
  { name: "Chase Ultimate Rewards", miles: 25000, bookUrl: "https://www.chase.com/personal/credit-cards/ultimate-rewards", color: "bg-cyan-600" },
  { name: "Amex Membership Rewards", miles: 22500, bookUrl: "https://www.americanexpress.com/en-us/rewards/membership-rewards/", color: "bg-indigo-600" },
];

function ProgramRow({
  prog,
  onUpdate,
  onDelete,
}: {
  prog: RewardProgram;
  onUpdate: (p: RewardProgram) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-gray-50">
        <span className={`text-xs text-white font-bold ${prog.color} rounded px-2 py-0.5 shrink-0`}>
          {prog.name.split(" ")[0]}
        </span>
        <span className="text-sm text-gray-800 font-medium flex-1 truncate">{prog.name}</span>
        <span className="text-xs text-gray-500 shrink-0">{prog.miles.toLocaleString()} mi · {prog.threshold}¢</span>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-700 text-xs px-2">
          {expanded ? "▲" : "✏️"}
        </button>
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
      </div>
      {expanded && (
        <div className="p-3 space-y-3 bg-white border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Miles Required</label>
              <input
                type="number"
                value={prog.miles}
                onChange={(e) => onUpdate({ ...prog, miles: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Alert Threshold (¢/mi)</label>
              <input
                type="number"
                step="0.1"
                value={prog.threshold}
                onChange={(e) => onUpdate({ ...prog, threshold: parseFloat(e.target.value) || 1.5 })}
                className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">My Miles Balance (optional)</label>
            <input
              type="number"
              value={prog.balance ?? ""}
              placeholder="e.g. 45000"
              onChange={(e) =>
                onUpdate({ ...prog, balance: e.target.value ? parseInt(e.target.value) : undefined })
              }
              className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            {prog.balance && prog.miles > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                Can book {Math.floor(prog.balance / prog.miles)} one-way(s)
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500">Booking URL</label>
            <input
              value={prog.bookUrl}
              onChange={(e) => onUpdate({ ...prog, bookUrl: e.target.value })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProgramEditor({ programs, onChange }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMiles, setCustomMiles] = useState("25000");
  const [customThreshold, setCustomThreshold] = useState("1.5");
  const [customUrl, setCustomUrl] = useState("");
  const [colorIdx, setColorIdx] = useState(0);

  const addPreset = (preset: (typeof PRESETS)[0]) => {
    if (programs.find((p) => p.name === preset.name)) return;
    onChange([
      ...programs,
      {
        id: crypto.randomUUID(),
        name: preset.name,
        miles: preset.miles,
        threshold: 1.5,
        bookUrl: preset.bookUrl,
        color: preset.color,
      },
    ]);
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    onChange([
      ...programs,
      {
        id: crypto.randomUUID(),
        name: customName.trim(),
        miles: parseInt(customMiles) || 25000,
        threshold: parseFloat(customThreshold) || 1.5,
        bookUrl: customUrl.trim(),
        color: COLORS[colorIdx],
      },
    ]);
    setCustomName(""); setCustomMiles("25000"); setCustomThreshold("1.5"); setCustomUrl("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Reward Programs</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-teal-600 hover:text-teal-800 border border-teal-200 hover:border-teal-400 rounded-lg px-3 py-1.5 transition"
        >
          + Add Program
        </button>
      </div>

      {programs.map((p) => (
        <ProgramRow
          key={p.id}
          prog={p}
          onUpdate={(updated) => onChange(programs.map((x) => (x.id === updated.id ? updated : x)))}
          onDelete={() => onChange(programs.filter((x) => x.id !== p.id))}
        />
      ))}

      {showAdd && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-teal-800">Quick Add</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((pr) => !programs.find((p) => p.name === pr.name)).map((pr) => (
              <button
                key={pr.name}
                onClick={() => { addPreset(pr); setShowAdd(false); }}
                className="text-xs bg-white border border-gray-200 hover:border-teal-400 rounded-lg px-3 py-1.5 transition text-gray-700"
              >
                + {pr.name.split(" ")[0]}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 font-medium">Or add custom:</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Program name"
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <input
              type="number"
              value={customMiles}
              onChange={(e) => setCustomMiles(e.target.value)}
              placeholder="Miles required"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <input
              type="number"
              step="0.1"
              value={customThreshold}
              onChange={(e) => setCustomThreshold(e.target.value)}
              placeholder="Threshold (¢/mi)"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Booking URL (optional)"
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addCustom} disabled={!customName.trim()} className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl py-2 text-sm font-medium transition">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl transition">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { FlightRoute } from "@/lib/types";

interface Props {
  route?: Partial<FlightRoute>;
  onSave: (route: FlightRoute) => void;
  onCancel: () => void;
}

const airportNames: Record<string, string> = {
  OPO: "Porto", LIS: "Lisbon", MAD: "Madrid", LHR: "London Heathrow",
  CDG: "Paris Charles de Gaulle", AMS: "Amsterdam", FRA: "Frankfurt",
  ZRH: "Zürich", FCO: "Rome", VCE: "Venice", BCN: "Barcelona",
  ORD: "Chicago O'Hare", JFK: "New York JFK", LAX: "Los Angeles",
  MSP: "Minneapolis", ATL: "Atlanta", MIA: "Miami", BOS: "Boston",
  DEN: "Denver", SFO: "San Francisco", SEA: "Seattle",
};

function guessCity(iata: string): string {
  return airportNames[iata.toUpperCase()] ?? iata.toUpperCase();
}

export default function RouteEditor({ route, onSave, onCancel }: Props) {
  const [origin, setOrigin] = useState(route?.origin ?? "");
  const [destination, setDestination] = useState(route?.destination ?? "");
  const [date, setDate] = useState(route?.date ?? "");
  const [label, setLabel] = useState(route?.label ?? "");

  const handleSave = () => {
    const o = origin.trim().toUpperCase();
    const d = destination.trim().toUpperCase();
    if (!o || !d || !date) return;
    onSave({
      id: route?.id ?? crypto.randomUUID(),
      label: label.trim() || `${guessCity(o)} → ${guessCity(d)}`,
      origin: o,
      originCity: guessCity(o),
      destination: d,
      destCity: guessCity(d),
      date,
    });
  };

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-teal-800">
        {route?.id ? "Edit Flight" : "Add New Flight"}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 font-medium">From (IATA)</label>
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. OPO"
            maxLength={3}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          {origin.length === 3 && (
            <p className="text-xs text-gray-400 mt-0.5">{guessCity(origin)}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-600 font-medium">To (IATA)</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. MSP"
            maxLength={3}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          {destination.length === 3 && (
            <p className="text-xs text-gray-400 mt-0.5">{guessCity(destination)}</p>
          )}
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-600 font-medium">Departure Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      <div>
        <label className="text-xs text-gray-600 font-medium">Label (optional)</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Porto → Chicago (Mom Leg 1)"
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!origin || !destination || !date}
          className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl px-4 py-2 text-sm font-medium transition"
        >
          Save Flight
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

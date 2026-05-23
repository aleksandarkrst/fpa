"use client";

import { useState } from "react";
import type { ProfitCenterOption } from "@/lib/types";

interface RevenueRow {
  id: number;
  period: string;
  actual: number | null;
  forecast: number | null;
  category: string;
  profit_center_id: number | null;
  profit_center_code: string | null;
  profit_center_name: string | null;
}

interface Props {
  rows: RevenueRow[];
  profitCenters?: ProfitCenterOption[];
  onAdd: (period: string, actual: number, profit_center_id?: number | null) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function fmt(n: number | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPeriod(period: string) {
  const [year, month] = period.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export default function RevenueTable({ rows, profitCenters = [], onAdd, onDelete }: Props) {
  const [period, setPeriod] = useState("");
  const [actual, setActual] = useState("");
  const [profitCenterId, setProfitCenterId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!period || !actual) return;
    const val = parseFloat(actual);
    if (isNaN(val) || val < 0) {
      setError("Enter a valid positive number.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(period, val, profitCenterId);
      setPeriod("");
      setActual("");
      setProfitCenterId(null);
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...rows].sort((a, b) => b.period.localeCompare(a.period));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Revenue Data
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 mb-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Month (YYYY-MM)</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Actual Revenue ($)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            placeholder="e.g. 250000"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Profit Center</label>
          <select
            value={profitCenterId ?? ""}
            onChange={(e) => setProfitCenterId(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[180px]"
          >
            <option value="">— None —</option>
            {profitCenters.map((pc) => (
              <option key={pc.id} value={pc.id}>
                {pc.department_name} / {pc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            {submitting ? "Saving…" : "Add / Update"}
          </button>
        </div>
        {error && (
          <p className="w-full text-xs text-red-500 mt-1">{error}</p>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Period
              </th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Actual
              </th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Profit Center
              </th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Category
              </th>
              <th className="py-2 px-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2 px-3 text-gray-700">
                  {fmtPeriod(row.period)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-gray-800">
                  {fmt(row.actual)}
                </td>
                <td className="py-2 px-3 text-gray-600">
                  {row.profit_center_code ? (
                    <span>
                      <span className="font-mono text-xs text-gray-400">{row.profit_center_code}</span>
                      {" "}{row.profit_center_name}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right text-gray-400">
                  {row.category}
                </td>
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={() => onDelete(row.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

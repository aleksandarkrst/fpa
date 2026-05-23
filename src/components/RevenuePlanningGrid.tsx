"use client";

import { Fragment, useEffect, useState } from "react";
import type { ProfitCenterOption, PeriodConfig } from "@/lib/types";

interface RevenueRow {
  id: number;
  period: string;
  actual: number | null;
  profit_center_id: number | null;
}

interface Props {
  profitCenters: ProfitCenterOption[];
  revenue: RevenueRow[];
  periodConfigs: PeriodConfig[];
  onReload: () => void;
}

type ViewMode = "past" | "actual" | "planning";

type PcGroup = {
  legalEntity: string;
  department: string;
  items: ProfitCenterOption[];
};

function groupByDepartment(pcs: ProfitCenterOption[]): PcGroup[] {
  const map = new Map<string, PcGroup>();
  for (const pc of pcs) {
    const key = `${pc.legal_entity_name}|||${pc.department_name}`;
    if (!map.has(key)) {
      map.set(key, {
        legalEntity: pc.legal_entity_name,
        department: pc.department_name,
        items: [],
      });
    }
    map.get(key)!.items.push(pc);
  }
  return Array.from(map.values());
}

function periodsInRange(start: string, end: string): string[] {
  const periods: string[] = [];
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    periods.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return periods;
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fmtPeriod(period: string): string {
  const [year, month] = period.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month) - 1]} '${year.slice(2)}`;
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function buildInitialValues(revenue: RevenueRow[]): Record<string, string> {
  const vals: Record<string, string> = {};
  for (const row of revenue) {
    if (row.profit_center_id === null) continue;
    const key = `${row.profit_center_id}:${row.period}`;
    vals[key] = row.actual !== null ? String(row.actual) : "";
  }
  return vals;
}

const VIEW_LABELS: Record<ViewMode, string> = {
  past: "Past",
  actual: "Actual",
  planning: "Planning",
};

const VIEW_BADGE: Record<ViewMode, string> = {
  past: "bg-gray-100 text-gray-600",
  actual: "bg-amber-50 text-amber-700 border border-amber-200",
  planning: "bg-blue-50 text-blue-700 border border-blue-200",
};

export default function RevenuePlanningGrid({ profitCenters, revenue, periodConfigs, onReload }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("planning");
  const groups = groupByDepartment(profitCenters);

  const activeConfig = periodConfigs.find((c) => c.type === viewMode);
  const periods = activeConfig
    ? periodsInRange(activeConfig.start_period, activeConfig.end_period)
    : [];

  const today = currentPeriod();

  function isCellEditable(period: string): boolean {
    if (viewMode === "past") return false;
    if (viewMode === "actual") return period <= today;
    return true; // planning
  }

  const [cellValues, setCellValues] = useState<Record<string, string>>(() =>
    buildInitialValues(revenue)
  );
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCellValues((prev) => {
      const next = { ...prev };
      for (const row of revenue) {
        if (row.profit_center_id === null) continue;
        const key = `${row.profit_center_id}:${row.period}`;
        if (key !== focusedKey) {
          next[key] = row.actual !== null ? String(row.actual) : "";
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenue]);

  const rowIds: Record<number, Record<string, number>> = {};
  for (const row of revenue) {
    if (row.profit_center_id === null) continue;
    if (!rowIds[row.profit_center_id]) rowIds[row.profit_center_id] = {};
    rowIds[row.profit_center_id][row.period] = row.id;
  }

  function getValue(pcId: number, period: string): string {
    return cellValues[`${pcId}:${period}`] ?? "";
  }

  function setValue(pcId: number, period: string, val: string) {
    setCellValues((prev) => ({ ...prev, [`${pcId}:${period}`]: val }));
  }

  async function saveCell(pcId: number, period: string) {
    const key = `${pcId}:${period}`;
    const raw = cellValues[key] ?? "";
    const num = raw === "" ? null : parseFloat(raw);

    if (raw !== "" && (isNaN(num!) || num! < 0)) return;

    const existingId = rowIds[pcId]?.[period];
    const existingActual = existingId !== undefined
      ? revenue.find((r) => r.id === existingId)?.actual ?? null
      : null;

    if (num === existingActual) return;
    if (num === null && existingId === undefined) return;

    setSavingKeys((s) => new Set(s).add(key));

    try {
      if (num === null && existingId !== undefined) {
        await fetch(`/api/revenue/${existingId}`, { method: "DELETE" });
      } else if (num !== null) {
        await fetch("/api/revenue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period, actual: num, profit_center_id: pcId }),
        });
      }
      onReload();
    } finally {
      setSavingKeys((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    }
  }

  function rowTotal(pcId: number): number {
    return periods.reduce((sum, p) => {
      const v = parseFloat(cellValues[`${pcId}:${p}`] ?? "");
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
  }

  function colTotal(period: string): number {
    return profitCenters.reduce((sum, pc) => {
      const v = parseFloat(cellValues[`${pc.id}:${period}`] ?? "");
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
  }

  const grandTotal = profitCenters.reduce((s, pc) => s + rowTotal(pc.id), 0);

  if (profitCenters.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-2">
        <p className="text-gray-500 text-sm font-medium">No profit centers configured</p>
        <p className="text-gray-400 text-xs">
          Import master data in{" "}
          <a href="/admin" className="text-blue-500 underline">Administration → Master Data</a>{" "}
          to start planning.
        </p>
      </div>
    );
  }

  const isReadOnly = viewMode === "past";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide shrink-0">
          Revenue Plan
        </h2>

        {/* View mode selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(["past", "actual", "planning"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === mode
                  ? "bg-white shadow-sm text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeConfig && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${VIEW_BADGE[viewMode]}`}>
              {fmtPeriod(activeConfig.start_period)} – {fmtPeriod(activeConfig.end_period)}
            </span>
          )}
          {!isReadOnly && (
            <span className="text-xs text-gray-400 hidden sm:block">
              Click any cell to edit · Enter or Tab to confirm
            </span>
          )}
          {isReadOnly && (
            <span className="text-xs text-gray-400">Read-only</span>
          )}
        </div>
      </div>

      {periods.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          No periods configured.{" "}
          <a href="/admin/periods" className="text-blue-500 underline">
            Set up period ranges
          </a>{" "}
          in Administration → Period Settings.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs" style={{ minWidth: "max-content" }}>
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap min-w-[220px]">
                  Profit Center
                </th>
                {periods.map((p) => {
                  const isLocked = viewMode === "actual" && p > today;
                  return (
                    <th
                      key={p}
                      className={`border-b border-gray-200 px-2 py-2.5 text-right text-xs font-medium whitespace-nowrap min-w-[88px] ${
                        isLocked ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {fmtPeriod(p)}
                    </th>
                  );
                })}
                <th className="border-b border-l border-gray-200 px-3 py-2.5 text-right text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[100px]">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {groups.map((group) => (
                <Fragment key={`grp-${group.legalEntity}-${group.department}`}>
                  <tr>
                    <td
                      colSpan={periods.length + 2}
                      className="sticky left-0 bg-gray-50 border-t border-b border-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {group.legalEntity} &mdash; {group.department}
                    </td>
                  </tr>

                  {group.items.map((pc) => {
                    const rTotal = rowTotal(pc.id);
                    return (
                      <tr
                        key={pc.id}
                        className="border-b border-gray-50 hover:bg-blue-50/20 group"
                      >
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50/20 border-r border-gray-100 px-4 py-0 whitespace-nowrap transition-colors">
                          <span className="font-mono text-gray-300 mr-1.5">{pc.code}</span>
                          <span className="text-gray-700">{pc.name}</span>
                        </td>

                        {periods.map((period) => {
                          const key = `${pc.id}:${period}`;
                          const isSaving = savingKeys.has(key);
                          const editable = isCellEditable(period);
                          const val = getValue(pc.id, period);
                          return (
                            <td key={period} className="p-0.5 border-r border-gray-50">
                              {editable ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={val}
                                  placeholder="—"
                                  disabled={isSaving}
                                  onChange={(e) => setValue(pc.id, period, e.target.value)}
                                  onFocus={() => setFocusedKey(key)}
                                  onBlur={() => {
                                    setFocusedKey(null);
                                    saveCell(pc.id, period);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === "Tab") {
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  className={`
                                    w-full text-right px-2 py-1.5 rounded font-mono
                                    bg-transparent border border-transparent
                                    placeholder:text-gray-200
                                    hover:border-gray-200 hover:bg-white
                                    focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-200
                                    disabled:opacity-40
                                    transition-all
                                    [appearance:textfield]
                                    [&::-webkit-outer-spin-button]:appearance-none
                                    [&::-webkit-inner-spin-button]:appearance-none
                                    ${val ? "text-gray-800" : "text-gray-300"}
                                  `}
                                />
                              ) : (
                                <div className={`
                                  w-full text-right px-2 py-1.5 font-mono
                                  ${viewMode === "past" ? "text-gray-500" : "text-gray-300"}
                                  ${!val && "text-gray-200"}
                                `}>
                                  {val ? fmtNumber(parseFloat(val)) : "—"}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        <td className="border-l border-gray-200 px-3 py-1.5 text-right font-mono font-semibold text-gray-700 whitespace-nowrap">
                          {rTotal > 0 ? fmtNumber(rTotal) : <span className="text-gray-200">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}

              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Total
                </td>
                {periods.map((p) => {
                  const t = colTotal(p);
                  return (
                    <td key={p} className="px-2 py-2 text-right font-mono font-semibold text-gray-800 border-r border-gray-100 whitespace-nowrap">
                      {t > 0 ? fmtNumber(t) : <span className="text-gray-200">—</span>}
                    </td>
                  );
                })}
                <td className="border-l border-gray-200 px-3 py-2 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                  {grandTotal > 0 ? fmtNumber(grandTotal) : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import KPICards from "@/components/KPICards";
import RevenueChart from "@/components/RevenueChart";
import RevenuePlanningGrid from "@/components/RevenuePlanningGrid";
import type { ProfitCenterOption, PeriodConfig } from "@/lib/types";

interface ForecastPoint {
  period: string;
  actual: number | null;
  forecast: number;
  isProjected: boolean;
}

interface ForecastData {
  points: ForecastPoint[];
  stats: {
    monthlyGrowthRate: number;
    totalGrowth: number;
    latestActual: number;
    forecastNext: number;
  };
}

interface RevenueRow {
  id: number;
  period: string;
  actual: number | null;
  forecast: number | null;
  category: string;
  profit_center_id: number | null;
}

export default function PlanningPage() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [profitCenters, setProfitCenters] = useState<ProfitCenterOption[]>([]);
  const [periodConfigs, setPeriodConfigs] = useState<PeriodConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [fRes, rRes, pcRes, perRes] = await Promise.all([
      fetch("/api/forecast"),
      fetch("/api/revenue"),
      fetch("/api/master-data/profit-centers"),
      fetch("/api/period-config"),
    ]);
    const [fData, rData, pcData, perData] = await Promise.all([
      fRes.json(),
      rRes.json(),
      pcRes.json(),
      perRes.json(),
    ]);
    setForecast(fData);
    setRevenue(rData);
    setProfitCenters(pcData);
    setPeriodConfigs(perData);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Revenue Planning</h1>
        <p className="text-sm text-gray-500 mt-1">
          Linear trend model &middot;{" "}
          {forecast?.points.filter((p) => !p.isProjected).length} months of actuals
        </p>
      </div>

      {forecast && (
        <KPICards
          latestActual={forecast.stats.latestActual}
          forecastNext={forecast.stats.forecastNext}
          monthlyGrowthRate={forecast.stats.monthlyGrowthRate}
          totalGrowth={forecast.stats.totalGrowth}
        />
      )}

      {forecast && <RevenueChart points={forecast.points} />}

      <RevenuePlanningGrid
        profitCenters={profitCenters}
        revenue={revenue}
        periodConfigs={periodConfigs}
        onReload={loadAll}
      />
    </div>
  );
}

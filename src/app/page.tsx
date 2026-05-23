"use client";

import { useEffect, useState, useCallback } from "react";
import KPICards from "@/components/KPICards";
import RevenueChart from "@/components/RevenueChart";
import RevenueTable from "@/components/RevenueTable";

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
}

export default function Dashboard() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [fRes, rRes] = await Promise.all([
      fetch("/api/forecast"),
      fetch("/api/revenue"),
    ]);
    const [fData, rData] = await Promise.all([fRes.json(), rRes.json()]);
    setForecast(fData);
    setRevenue(rData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleAdd(period: string, actual: number) {
    await fetch("/api/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, actual }),
    });
    await loadAll();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/revenue/${id}`, { method: "DELETE" });
    await loadAll();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            FP&amp;A — Revenue Forecasting
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Linear trend model &middot;{" "}
            {forecast?.points.filter((p) => !p.isProjected).length} months of
            actuals
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

        <RevenueTable
          rows={revenue}
          onAdd={handleAdd}
          onDelete={handleDelete}
        />
      </div>
    </main>
  );
}

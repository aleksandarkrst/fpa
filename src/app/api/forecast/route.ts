import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { linearForecast, growthRate } from "@/lib/forecast";
import type { RevenueRow } from "@/lib/forecast";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM revenue WHERE actual IS NOT NULL ORDER BY period ASC")
    .all() as RevenueRow[];

  const settings = db
    .prepare("SELECT * FROM forecast_settings WHERE id = 1")
    .get() as { method: string; periods_ahead: number };

  const points = linearForecast(rows, settings.periods_ahead);
  const monthlyGrowth = growthRate(rows);

  const actuals = rows.filter((r) => r.actual !== null);
  const lastActual = actuals[actuals.length - 1]?.actual ?? 0;
  const firstActual = actuals[0]?.actual ?? 0;
  const totalGrowth =
    firstActual > 0 ? ((lastActual - firstActual) / firstActual) * 100 : 0;

  return NextResponse.json({
    points,
    settings,
    stats: {
      monthlyGrowthRate: monthlyGrowth * 100,
      totalGrowth,
      latestActual: lastActual,
      forecastNext: points.find((p) => p.isProjected)?.forecast ?? 0,
    },
  });
}

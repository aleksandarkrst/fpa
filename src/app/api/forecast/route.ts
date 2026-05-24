import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { linearForecast, growthRate } from "@/lib/forecast";
import type { RevenueRow } from "@/lib/forecast";

export async function GET() {
  const db = getDb();

  // Aggregate per period so profit-center rows don't inflate the count
  const rows = (
    db
      .prepare(
        `SELECT period, SUM(actual) AS actual
         FROM revenue
         WHERE actual IS NOT NULL
         GROUP BY period
         ORDER BY period ASC`
      )
      .all() as { period: string; actual: number }[]
  ).map(
    (r): RevenueRow => ({
      id: 0,
      period: r.period,
      actual: r.actual,
      forecast: null,
      category: "Total",
    })
  );

  const settings = db
    .prepare("SELECT * FROM forecast_settings WHERE id = 1")
    .get() as { method: string; periods_ahead: number };

  // Project at least far enough to cover the planning period end
  let periodsAhead = settings.periods_ahead;
  if (rows.length > 0) {
    const planConfig = db
      .prepare("SELECT end_period FROM period_config WHERE type = 'planning'")
      .get() as { end_period: string } | undefined;
    if (planConfig) {
      const last = rows[rows.length - 1].period;
      const [ly, lm] = last.split("-").map(Number);
      const [py, pm] = planConfig.end_period.split("-").map(Number);
      const diff = (py - ly) * 12 + (pm - lm);
      if (diff > periodsAhead) periodsAhead = diff;
    }
  }

  const points = linearForecast(rows, periodsAhead);
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

export interface RevenueRow {
  id: number;
  period: string;
  actual: number | null;
  forecast: number | null;
  category: string;
}

export interface ForecastPoint {
  period: string;
  actual: number | null;
  forecast: number;
  isProjected: boolean;
}

function periodToIndex(period: string): number {
  const [year, month] = period.split("-").map(Number);
  return year * 12 + month;
}

function indexToPeriod(index: number): string {
  const month = index % 12 || 12;
  const year = Math.floor(index / 12) - (month === 12 ? 1 : 0);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function linearForecast(
  actuals: RevenueRow[],
  periodsAhead: number
): ForecastPoint[] {
  const sorted = [...actuals].sort((a, b) =>
    a.period.localeCompare(b.period)
  );

  const xs = sorted.map((r, i) => i);
  const ys = sorted.map((r) => r.actual ?? 0);
  const n = xs.length;

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predict = (i: number) => Math.round(intercept + slope * i);

  const lastIndex = periodToIndex(sorted[sorted.length - 1].period);

  const historicalPoints: ForecastPoint[] = sorted.map((r, i) => ({
    period: r.period,
    actual: r.actual,
    forecast: predict(i),
    isProjected: false,
  }));

  const projectedPoints: ForecastPoint[] = Array.from(
    { length: periodsAhead },
    (_, k) => {
      const idx = lastIndex + k + 1;
      return {
        period: indexToPeriod(idx),
        actual: null,
        forecast: predict(n + k),
        isProjected: true,
      };
    }
  );

  return [...historicalPoints, ...projectedPoints];
}

export function growthRate(points: RevenueRow[]): number {
  const sorted = [...points]
    .filter((p) => p.actual !== null)
    .sort((a, b) => a.period.localeCompare(b.period));

  if (sorted.length < 2) return 0;
  const first = sorted[0].actual!;
  const last = sorted[sorted.length - 1].actual!;
  const months = sorted.length - 1;
  return Math.pow(last / first, 1 / months) - 1;
}

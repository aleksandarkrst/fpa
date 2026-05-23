"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ForecastPoint {
  period: string;
  actual: number | null;
  forecast: number;
  isProjected: boolean;
}

interface Props {
  points: ForecastPoint[];
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtPeriod(period: string) {
  const [year, month] = period.split("-");
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
}

export default function RevenueChart({ points }: Props) {
  const firstProjected = points.find((p) => p.isProjected)?.period;

  const data = points.map((p) => ({
    ...p,
    label: fmtPeriod(p.period),
    projectedForecast: p.isProjected ? p.forecast : null,
    fittedForecast: !p.isProjected ? p.forecast : null,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Revenue — Actuals & Forecast
      </h2>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              typeof value === "number" ? fmtCurrency(value) : String(value),
              name === "actual"
                ? "Actual"
                : name === "fittedForecast"
                ? "Trend fit"
                : "Forecast",
            ]}
          />
          <Legend
            formatter={(v) =>
              v === "actual"
                ? "Actual Revenue"
                : v === "fittedForecast"
                ? "Trend Fit"
                : "Projected Forecast"
            }
          />
          {firstProjected && (
            <ReferenceLine
              x={fmtPeriod(firstProjected)}
              stroke="#d1d5db"
              strokeDasharray="4 2"
              label={{ value: "Forecast →", position: "insideTopLeft", fontSize: 10, fill: "#9ca3af" }}
            />
          )}
          <Area
            type="monotone"
            dataKey="actual"
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: "#3b82f6" }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="fittedForecast"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="projectedForecast"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 4, fill: "#8b5cf6" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

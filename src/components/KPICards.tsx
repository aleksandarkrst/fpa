"use client";

interface KPICardsProps {
  latestActual: number;
  forecastNext: number;
  monthlyGrowthRate: number;
  totalGrowth: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export default function KPICards({
  latestActual,
  forecastNext,
  monthlyGrowthRate,
  totalGrowth,
}: KPICardsProps) {
  const cards = [
    {
      label: "Latest Actual Revenue",
      value: fmt(latestActual),
      sub: "Most recent month",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
    },
    {
      label: "Next Month Forecast",
      value: fmt(forecastNext),
      sub: "Linear trend model",
      color: "bg-emerald-50 border-emerald-200",
      textColor: "text-emerald-700",
    },
    {
      label: "Monthly Growth Rate",
      value: pct(monthlyGrowthRate),
      sub: "Compound monthly",
      color: "bg-violet-50 border-violet-200",
      textColor: "text-violet-700",
    },
    {
      label: "Total Growth",
      value: pct(totalGrowth),
      sub: "Since first data point",
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border p-5 ${c.color} flex flex-col gap-1`}
        >
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {c.label}
          </span>
          <span className={`text-2xl font-bold ${c.textColor}`}>{c.value}</span>
          <span className="text-xs text-gray-400">{c.sub}</span>
        </div>
      ))}
    </div>
  );
}

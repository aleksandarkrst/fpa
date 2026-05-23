"use client";

import { useEffect, useState } from "react";

interface PeriodConfig {
  type: "past" | "actual" | "planning";
  start_period: string;
  end_period: string;
}

const LABELS: Record<string, string> = {
  past: "Past",
  actual: "Actual",
  planning: "Planning",
};

const DESCRIPTIONS: Record<string, string> = {
  past: "Historical data — read-only in the planning grid",
  actual: "Current period — editable only for completed months",
  planning: "Future period — all months open for editing",
};

const BADGE_COLORS: Record<string, string> = {
  past: "bg-gray-100 text-gray-500",
  actual: "bg-amber-50 text-amber-700",
  planning: "bg-blue-50 text-blue-700",
};

const ORDER: PeriodConfig["type"][] = ["past", "actual", "planning"];

export default function PeriodConfigView() {
  const [configs, setConfigs] = useState<PeriodConfig[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/period-config")
      .then((r) => r.json())
      .then(setConfigs);
  }, []);

  function update(type: string, field: "start_period" | "end_period", value: string) {
    setConfigs((prev) =>
      prev.map((c) => (c.type === type ? { ...c, [field]: value } : c))
    );
  }

  async function save(type: string) {
    const config = configs.find((c) => c.type === type);
    if (!config) return;

    if (config.start_period > config.end_period) {
      setError(`${LABELS[type]}: start period must be before end period`);
      return;
    }
    setError(null);
    setSaving(type);

    await fetch("/api/period-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    setSaving(null);
    setSaved(type);
    setTimeout(() => setSaved(null), 2000);
  }

  if (configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {ORDER.map((type) => {
        const config = configs.find((c) => c.type === type);
        if (!config) return null;
        return (
          <div key={type} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_COLORS[type]}`}>
                  {LABELS[type]}
                </span>
                <p className="text-xs text-gray-400">{DESCRIPTIONS[type]}</p>
              </div>
              <button
                onClick={() => save(type)}
                disabled={saving === type}
                className="text-xs px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {saving === type ? "Saving…" : saved === type ? "Saved ✓" : "Save"}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Start period
                </label>
                <input
                  type="month"
                  value={config.start_period}
                  onChange={(e) => update(type, "start_period", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
                />
              </div>
              <div className="text-gray-300 text-lg mt-5">→</div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  End period
                </label>
                <input
                  type="month"
                  value={config.end_period}
                  onChange={(e) => update(type, "end_period", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import * as XLSX from "xlsx";

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

export async function GET() {
  const db = getDb();

  const configs = db
    .prepare(
      "SELECT start_period, end_period FROM period_config WHERE type IN ('past', 'actual') ORDER BY start_period"
    )
    .all() as { start_period: string; end_period: string }[];

  const periodSet = new Set<string>();
  for (const cfg of configs) {
    for (const p of periodsInRange(cfg.start_period, cfg.end_period)) {
      periodSet.add(p);
    }
  }
  const periods = Array.from(periodSet).sort();

  const profitCenters = db
    .prepare("SELECT code FROM profit_center ORDER BY code")
    .all() as { code: string }[];

  const header = ["profit_center_code", ...periods];
  const dataRows = profitCenters.map((pc) => [pc.code, ...periods.map(() => "")]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Actuals");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="actuals_template.xlsx"',
    },
  });
}

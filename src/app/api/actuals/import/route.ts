import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 }) as (string | number)[][];

  if (rows.length < 2) {
    return NextResponse.json({ error: "File has no data rows" }, { status: 400 });
  }

  const [headerRow, ...dataRows] = rows;
  const [, ...periodHeaders] = headerRow as string[];

  if (periodHeaders.length === 0) {
    return NextResponse.json({ error: "No period columns found" }, { status: 400 });
  }

  const periods = periodHeaders.map(String);
  const invalid = periods.filter((p) => !/^\d{4}-\d{2}$/.test(p));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid period format in headers: ${invalid.join(", ")}. Expected YYYY-MM.` },
      { status: 400 }
    );
  }

  const db = getDb();

  const configs = db
    .prepare(
      "SELECT start_period, end_period FROM period_config WHERE type IN ('past', 'actual')"
    )
    .all() as { start_period: string; end_period: string }[];

  const validPeriods = new Set<string>();
  for (const cfg of configs) {
    for (const p of periodsInRange(cfg.start_period, cfg.end_period)) {
      validPeriods.add(p);
    }
  }

  let imported = 0;
  let skipped = 0;
  const warnings: string[] = [];

  const run = db.transaction(() => {
    for (const row of dataRows) {
      if (!row || row.length === 0) continue;
      const [pcCode, ...values] = row as (string | number)[];
      if (!pcCode) continue;

      const pc = db
        .prepare("SELECT id FROM profit_center WHERE code = ?")
        .get(String(pcCode)) as { id: number } | undefined;

      if (!pc) {
        warnings.push(`Profit center not found: ${pcCode}`);
        continue;
      }

      for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        const val = values[i];

        if (!validPeriods.has(period)) {
          skipped++;
          continue;
        }

        if (val === undefined || val === null || val === "") continue;

        const num = Number(val);
        if (isNaN(num)) continue;

        const existing = db
          .prepare("SELECT id FROM revenue WHERE period = ? AND profit_center_id = ?")
          .get(period, pc.id) as { id: number } | undefined;

        if (existing) {
          db.prepare("UPDATE revenue SET actual = ? WHERE id = ?").run(num, existing.id);
        } else {
          db.prepare(
            "INSERT INTO revenue (period, actual, category, profit_center_id) VALUES (?, ?, 'Total', ?)"
          ).run(period, num, pc.id);
        }
        imported++;
      }
    }
  });

  run();

  return NextResponse.json({ imported, skipped, warnings });
}

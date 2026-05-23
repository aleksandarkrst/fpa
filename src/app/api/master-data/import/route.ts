import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDb } from "@/lib/db";

const REQUIRED_COLS = [
  "legal_entity_code",
  "legal_entity_name",
  "department_code",
  "department_name",
  "profit_center_code",
  "profit_center_name",
  "cost_center_code",
  "cost_center_name",
];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return NextResponse.json({ error: "Empty workbook" }, { status: 400 });
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
  if (rawRows.length === 0) {
    return NextResponse.json({ error: "No data rows found" }, { status: 400 });
  }

  const headers = Object.keys(rawRows[0]).map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLS.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing columns: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const db = getDb();

  const upsertLe = db.prepare(
    `INSERT INTO legal_entity (code, name) VALUES (?, ?)
     ON CONFLICT(code) DO UPDATE SET name = excluded.name`
  );
  const getLe = db.prepare(`SELECT id FROM legal_entity WHERE code = ?`);

  const upsertD = db.prepare(
    `INSERT INTO department (code, name, legal_entity_id) VALUES (?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET name = excluded.name, legal_entity_id = excluded.legal_entity_id`
  );
  const getD = db.prepare(`SELECT id FROM department WHERE code = ?`);

  const upsertPc = db.prepare(
    `INSERT INTO profit_center (code, name, department_id) VALUES (?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET name = excluded.name, department_id = excluded.department_id`
  );
  const getPc = db.prepare(`SELECT id FROM profit_center WHERE code = ?`);

  const upsertCc = db.prepare(
    `INSERT INTO cost_center (code, name, profit_center_id) VALUES (?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET name = excluded.name, profit_center_id = excluded.profit_center_id`
  );

  const importAll = db.transaction((rows: Record<string, string>[]) => {
    for (const row of rows) {
      const leCode = String(row["legal_entity_code"]).trim();
      const leName = String(row["legal_entity_name"]).trim();
      const dCode  = String(row["department_code"]).trim();
      const dName  = String(row["department_name"]).trim();
      const pcCode = String(row["profit_center_code"]).trim();
      const pcName = String(row["profit_center_name"]).trim();
      const ccCode = String(row["cost_center_code"]).trim();
      const ccName = String(row["cost_center_name"]).trim();

      if (!leCode || !dCode || !pcCode || !ccCode) continue;

      upsertLe.run(leCode, leName);
      const leId = (getLe.get(leCode) as { id: number }).id;

      upsertD.run(dCode, dName, leId);
      const dId = (getD.get(dCode) as { id: number }).id;

      upsertPc.run(pcCode, pcName, dId);
      const pcId = (getPc.get(pcCode) as { id: number }).id;

      upsertCc.run(ccCode, ccName, pcId);
    }
  });

  try {
    importAll(rawRows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ imported: rawRows.length }, { status: 201 });
}

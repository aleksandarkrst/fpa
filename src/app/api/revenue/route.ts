import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT r.*, pc.code AS profit_center_code, pc.name AS profit_center_name
       FROM revenue r
       LEFT JOIN profit_center pc ON r.profit_center_id = pc.id
       ORDER BY r.period ASC`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { period, actual, category = "Total", profit_center_id = null } = body;

  if (!period || actual === undefined || actual === null) {
    return NextResponse.json(
      { error: "period and actual are required" },
      { status: 400 }
    );
  }

  const db = getDb();

  if (profit_center_id !== null) {
    // Grid path: upsert keyed on (period, profit_center_id)
    const existing = db
      .prepare("SELECT id FROM revenue WHERE period = ? AND profit_center_id = ?")
      .get(period, profit_center_id) as { id: number } | undefined;

    if (existing) {
      db.prepare(
        "UPDATE revenue SET actual = ? WHERE period = ? AND profit_center_id = ?"
      ).run(actual, period, profit_center_id);
    } else {
      db.prepare(
        "INSERT INTO revenue (period, actual, category, profit_center_id) VALUES (?, ?, ?, ?)"
      ).run(period, actual, category, profit_center_id);
    }

    const row = db
      .prepare(
        `SELECT r.*, pc.code AS profit_center_code, pc.name AS profit_center_name
         FROM revenue r
         LEFT JOIN profit_center pc ON r.profit_center_id = pc.id
         WHERE r.period = ? AND r.profit_center_id = ?`
      )
      .get(period, profit_center_id);

    return NextResponse.json(row, { status: 201 });
  }

  // Legacy path: upsert keyed on (period, category) where profit_center_id IS NULL
  const existing = db
    .prepare(
      "SELECT id FROM revenue WHERE period = ? AND category = ? AND profit_center_id IS NULL"
    )
    .get(period, category) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      "UPDATE revenue SET actual = ? WHERE period = ? AND category = ? AND profit_center_id IS NULL"
    ).run(actual, period, category);
  } else {
    db.prepare(
      "INSERT INTO revenue (period, actual, category) VALUES (?, ?, ?)"
    ).run(period, actual, category);
  }

  const row = db
    .prepare(
      `SELECT r.*, pc.code AS profit_center_code, pc.name AS profit_center_name
       FROM revenue r
       LEFT JOIN profit_center pc ON r.profit_center_id = pc.id
       WHERE r.period = ? AND r.category = ? AND r.profit_center_id IS NULL`
    )
    .get(period, category);

  return NextResponse.json(row, { status: 201 });
}

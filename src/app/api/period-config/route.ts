import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT type, start_period, end_period FROM period_config
       ORDER BY CASE type WHEN 'past' THEN 1 WHEN 'actual' THEN 2 WHEN 'planning' THEN 3 END`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { type, start_period, end_period } = await req.json();

  if (!type || !start_period || !end_period) {
    return NextResponse.json(
      { error: "type, start_period, end_period are required" },
      { status: 400 }
    );
  }

  const db = getDb();
  db.prepare(
    `INSERT INTO period_config (type, start_period, end_period) VALUES (?, ?, ?)
     ON CONFLICT(type) DO UPDATE SET start_period = excluded.start_period, end_period = excluded.end_period`
  ).run(type, start_period, end_period);

  return NextResponse.json({ ok: true });
}

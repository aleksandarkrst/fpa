import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM revenue ORDER BY period ASC")
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { period, actual, category = "Total" } = body;

  if (!period || actual === undefined) {
    return NextResponse.json(
      { error: "period and actual are required" },
      { status: 400 }
    );
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM revenue WHERE period = ? AND category = ?")
    .get(period, category);

  if (existing) {
    db.prepare(
      "UPDATE revenue SET actual = ? WHERE period = ? AND category = ?"
    ).run(actual, period, category);
  } else {
    db.prepare(
      "INSERT INTO revenue (period, actual, category) VALUES (?, ?, ?)"
    ).run(period, actual, category);
  }

  const row = db
    .prepare("SELECT * FROM revenue WHERE period = ? AND category = ?")
    .get(period, category);

  return NextResponse.json(row, { status: 201 });
}

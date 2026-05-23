import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT pc.id, pc.code, pc.name,
              d.name  AS department_name,
              le.name AS legal_entity_name
       FROM profit_center pc
       JOIN department   d  ON pc.department_id   = d.id
       JOIN legal_entity le ON d.legal_entity_id  = le.id
       ORDER BY le.code, d.code, pc.code`
    )
    .all();
  return NextResponse.json(rows);
}

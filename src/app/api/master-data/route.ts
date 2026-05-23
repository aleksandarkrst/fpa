import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
        le.code  AS legal_entity_code,  le.name  AS legal_entity_name,
        d.code   AS department_code,    d.name   AS department_name,
        pc.code  AS profit_center_code, pc.name  AS profit_center_name,
        cc.code  AS cost_center_code,   cc.name  AS cost_center_name
       FROM cost_center cc
       JOIN profit_center pc ON cc.profit_center_id = pc.id
       JOIN department    d  ON pc.department_id    = d.id
       JOIN legal_entity  le ON d.legal_entity_id   = le.id
       ORDER BY le.code, d.code, pc.code, cc.code`
    )
    .all();
  return NextResponse.json(rows);
}

export async function DELETE() {
  const db = getDb();
  db.exec("DELETE FROM legal_entity");
  return NextResponse.json({ success: true });
}

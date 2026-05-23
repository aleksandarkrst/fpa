import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const header = [
    "legal_entity_code",
    "legal_entity_name",
    "department_code",
    "department_name",
    "profit_center_code",
    "profit_center_name",
    "cost_center_code",
    "cost_center_name",
  ];
  const example = [
    "LE-001",
    "US Operations",
    "DEPT-FIN",
    "Finance",
    "PC-FIN-01",
    "Finance PC",
    "CC-FIN-001",
    "Treasury",
  ];

  const ws = XLSX.utils.aoa_to_sheet([header, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MasterData");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="master_data_template.xlsx"',
    },
  });
}

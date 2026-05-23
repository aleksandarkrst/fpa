import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "fpa.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS revenue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      actual REAL,
      forecast REAL,
      category TEXT NOT NULL DEFAULT 'Total',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forecast_settings (
      id INTEGER PRIMARY KEY,
      method TEXT NOT NULL DEFAULT 'linear',
      periods_ahead INTEGER NOT NULL DEFAULT 6
    );
  `);

  const rowCount = (
    db.prepare("SELECT COUNT(*) as c FROM revenue").get() as { c: number }
  ).c;

  if (rowCount === 0) {
    seedData(db);
  }

  const settingsCount = (
    db
      .prepare("SELECT COUNT(*) as c FROM forecast_settings")
      .get() as { c: number }
  ).c;

  if (settingsCount === 0) {
    db.prepare(
      "INSERT INTO forecast_settings (id, method, periods_ahead) VALUES (1, 'linear', 6)"
    ).run();
  }
}

function seedData(db: Database.Database) {
  const insert = db.prepare(
    "INSERT INTO revenue (period, actual, category) VALUES (?, ?, ?)"
  );

  const historicalData = [
    ["2024-01", 142000, "Total"],
    ["2024-02", 155000, "Total"],
    ["2024-03", 163000, "Total"],
    ["2024-04", 158000, "Total"],
    ["2024-05", 172000, "Total"],
    ["2024-06", 181000, "Total"],
    ["2024-07", 176000, "Total"],
    ["2024-08", 190000, "Total"],
    ["2024-09", 198000, "Total"],
    ["2024-10", 205000, "Total"],
    ["2024-11", 212000, "Total"],
    ["2024-12", 228000, "Total"],
    ["2025-01", 221000, "Total"],
    ["2025-02", 235000, "Total"],
    ["2025-03", 248000, "Total"],
    ["2025-04", 242000, "Total"],
    ["2025-05", 259000, "Total"],
  ];

  const insertMany = db.transaction(
    (rows: (string | number | null)[][]) => {
      for (const row of rows) {
        insert.run(...(row as [string, number, string]));
      }
    }
  );

  insertMany(historicalData);
}

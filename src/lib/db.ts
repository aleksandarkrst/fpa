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
  db.pragma("foreign_keys = ON");
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS legal_entity (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS department (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL,
      code            TEXT NOT NULL UNIQUE,
      legal_entity_id INTEGER NOT NULL REFERENCES legal_entity(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS profit_center (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      code          TEXT NOT NULL UNIQUE,
      department_id INTEGER NOT NULL REFERENCES department(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS cost_center (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT NOT NULL,
      code             TEXT NOT NULL UNIQUE,
      profit_center_id INTEGER NOT NULL REFERENCES profit_center(id) ON DELETE CASCADE
    );
  `);

  const cols = db.pragma("table_info(revenue)") as { name: string }[];
  if (!cols.some((c) => c.name === "profit_center_id")) {
    db.exec(
      "ALTER TABLE revenue ADD COLUMN profit_center_id INTEGER REFERENCES profit_center(id) ON DELETE SET NULL"
    );
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS period_config (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      type         TEXT NOT NULL UNIQUE CHECK(type IN ('past', 'actual', 'planning')),
      start_period TEXT NOT NULL,
      end_period   TEXT NOT NULL
    );
  `);

  const pcRows = (
    db.prepare("SELECT COUNT(*) as c FROM period_config").get() as { c: number }
  ).c;
  if (pcRows === 0) {
    db.prepare(
      "INSERT INTO period_config (type, start_period, end_period) VALUES (?, ?, ?)"
    ).run("past", "2025-01", "2025-12");
    db.prepare(
      "INSERT INTO period_config (type, start_period, end_period) VALUES (?, ?, ?)"
    ).run("actual", "2026-01", "2026-12");
    db.prepare(
      "INSERT INTO period_config (type, start_period, end_period) VALUES (?, ?, ?)"
    ).run("planning", "2026-01", "2027-12");
  }

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

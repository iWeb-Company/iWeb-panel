import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

let dbPath = process.env.DB_PATH || "/opt/data/db.sqlite";

// Fallback for Windows local development
if (process.platform === "win32") {
  dbPath = path.join(process.cwd(), "data", "db.sqlite");
}

// Ensure containing directory exists
const dbDir = path.dirname(dbPath);
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (err) {
  console.warn("Could not create database directory at " + dbDir + ", falling back to project local directory:", err);
  dbPath = path.join(process.cwd(), "data", "db.sqlite");
  const fallbackDir = path.dirname(dbPath);
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
}

// Open the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database at " + dbPath + ":", err.message);
  } else {
    console.log("Connected to SQLite database at: " + dbPath);
    initializeDb();
  }
});

// Helper for running queries (INSERT, UPDATE, DELETE, CREATE, etc.)
export function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: any, err) {
      if (err) {
        console.error("SQL Error running: " + sql, err);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

// Helper for fetching a single row
export function get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error("SQL Error get: " + sql, err);
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
}

// Helper for fetching all rows
export function all<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("SQL Error all: " + sql, err);
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

// Initialize tables and seed mock data if tables are empty
function initializeDb() {
  db.serialize(() => {
    // 1. Create clients table
    db.run(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        responsible TEXT NOT NULL,
        monthly TEXT NOT NULL,
        product TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `, (err) => {
      if (err) console.error("Error creating clients table:", err);
      else seedClients();
    });

    // 2. Create projects table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        priority TEXT NOT NULL,
        responsible TEXT NOT NULL,
        cuit TEXT NOT NULL,
        status TEXT NOT NULL,
        startDate TEXT NOT NULL,
        billingDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        budget TEXT NOT NULL,
        advancePercent TEXT NOT NULL,
        remainingBalance TEXT NOT NULL,
        maintenance TEXT NOT NULL,
        paymentUpToDate TEXT NOT NULL,
        domain TEXT NOT NULL,
        debtSince TEXT NOT NULL,
        notes TEXT NOT NULL,
        containerIds TEXT NOT NULL,
        category TEXT NOT NULL
      )
    `, (err) => {
      if (err) console.error("Error creating projects table:", err);
      else seedProjects();
    });
  });
}

// Seed clients if empty
function seedClients() {
  db.get("SELECT COUNT(*) as count FROM clients", [], (err, row: any) => {
    if (err) return console.error("Error counting clients:", err);
    if (row && row.count === 0) {
      console.log("Seeding initial clients data...");
      const stmt = db.prepare("INSERT INTO clients (id, name, responsible, monthly, product, status) VALUES (?, ?, ?, ?, ?, ?)");
      
      const initialClients = [
        ["c1", "Tranett SRL", "Valentín", "ARS 250.000", "Tranett", "Activo"],
        ["c2", "Foonett Corp", "Facundo", "ARS 180.000", "Foonett", "Activo"],
        ["c3", "Vitalis Group", "Tomás", "ARS 320.000", "A medida", "Activo"]
      ];

      initialClients.forEach((client) => {
        stmt.run(client, (runErr) => {
          if (runErr) console.error("Error inserting client:", runErr);
        });
      });
      stmt.finalize();
    }
  });
}

// Seed projects if empty
function seedProjects() {
  db.get("SELECT COUNT(*) as count FROM projects", [], (err, row: any) => {
    if (err) return console.error("Error counting projects:", err);
    if (row && row.count === 0) {
      console.log("Seeding initial projects data...");
      const stmt = db.prepare(`
        INSERT INTO projects (
          id, name, priority, responsible, cuit, status, startDate, billingDate, endDate,
          budget, advancePercent, remainingBalance, maintenance, paymentUpToDate, domain,
          debtSince, notes, containerIds, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const initialProjects = [
        [
          "p1",
          "Tranett Web",
          "ALTA",
          "Valentín",
          "30-71584930-9",
          "En desarrollo",
          "2026-01-15",
          "2026-06-05",
          "2026-08-30",
          "ARS 1.500.000",
          "60",
          "ARS 600.000",
          "ARS 45.000",
          "SI",
          "tranett.com.ar",
          "",
          "Migración completa de frontend y base de datos.",
          JSON.stringify(["tranett-web", "tranett-api", "tranett-db"]),
          "Web/App"
        ],
        [
          "p2",
          "Foonett API",
          "MEDIA",
          "Facundo",
          "30-58473920-5",
          "En desarrollo",
          "2026-02-10",
          "2026-06-12",
          "2026-07-20",
          "ARS 1.200.000",
          "80",
          "ARS 240.000",
          "ARS 35.000",
          "SI",
          "foonett.io",
          "",
          "Desarrollo de API de integración bancaria.",
          JSON.stringify(["foonett-frontend", "foonett-backend"]),
          "API Service"
        ],
        [
          "p3",
          "Vitalis Portal",
          "ALTA",
          "Tomás",
          "27-48392019-3",
          "En revisión",
          "2026-03-01",
          "2026-05-10",
          "2026-06-15",
          "ARS 2.000.000",
          "75",
          "ARS 500.000",
          "ARS 50.000",
          "NO",
          "vitalis.com",
          "2026-05-10",
          "Falta cobro de hito de entrega de diseño y pruebas.",
          JSON.stringify(["vitalis-web", "vitalis-api"]),
          "Portal Médico"
        ]
      ];

      initialProjects.forEach((project) => {
        stmt.run(project, (runErr) => {
          if (runErr) console.error("Error inserting project:", runErr);
        });
      });
      stmt.finalize();
    }
  });
}

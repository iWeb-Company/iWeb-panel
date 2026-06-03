const sqlite3 = require("sqlite3");
const path = require("path");
const fs = require("fs");

let dbPath = process.env.DB_PATH || "/opt/data/db.sqlite";

// For local Windows environment
if (process.platform === "win32") {
  dbPath = path.join(__dirname, "..", "data", "db.sqlite");
}

console.log("Starting database seeding process...");
console.log("Target database file:", dbPath);

// Ensure the target directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log("Created directory:", dbDir);
  } catch (err) {
    console.error("Warning: Could not create directory " + dbDir + ", falling back to project local folder:", err.message);
    dbPath = path.join(__dirname, "..", "data", "db.sqlite");
  }
}

// Open SQLite connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  
  console.log("Opened connection to SQLite database.");
  runSeedScript();
});

function runSeedScript() {
  const seedSqlPath = path.join(__dirname, "..", "data", "seed.sql");
  if (!fs.existsSync(seedSqlPath)) {
    console.error("Error: Seed SQL file not found at " + seedSqlPath);
    db.close();
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(seedSqlPath, "utf8");
  
  // Use db.exec to run the multi-statement SQL script
  db.exec(sqlContent, (err) => {
    if (err) {
      console.error("Error executing seed SQL script:", err.message);
      db.close();
      process.exit(1);
    }
    
    console.log("Database schema initialized and seeded successfully.");
    db.close(() => {
      console.log("Database connection closed.");
      process.exit(0);
    });
  });
}

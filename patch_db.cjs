const Database = require('better-sqlite3');
const db = new Database('sqlite.db');
try {
  db.exec('ALTER TABLE users ADD COLUMN weekend_rate REAL NOT NULL DEFAULT 0');
} catch(e) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN holiday_rate REAL NOT NULL DEFAULT 0');
} catch(e) {}
console.log("Patched DB!");

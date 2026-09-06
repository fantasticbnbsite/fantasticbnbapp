const DatabaseSync = require('node:sqlite').DatabaseSync;
const db = new DatabaseSync('data/fantastic-bnb.sqlite');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      checklist_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Table created successfully");
} catch (e) {
  console.error("Error creating table", e);
}

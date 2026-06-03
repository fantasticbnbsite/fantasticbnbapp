import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, 'data', 'fantastic-bnb.sqlite'));

try {
  db.exec('ALTER TABLE users ADD COLUMN weekend_rate REAL NOT NULL DEFAULT 0');
} catch(e) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN holiday_rate REAL NOT NULL DEFAULT 0');
} catch(e) {}
console.log("Patched DB!");

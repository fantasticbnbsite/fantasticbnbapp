import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, 'data', 'fantastic-bnb.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    bank_name TEXT DEFAULT '',
    sort_code TEXT DEFAULT '',
    account_number TEXT DEFAULT ''
  );
  INSERT OR IGNORE INTO config (id) VALUES (1);
`);
console.log("Patched config!");

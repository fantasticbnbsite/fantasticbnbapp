import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, 'data', 'fantastic-bnb.sqlite'));

try {
  db.exec('ALTER TABLE flats ADD COLUMN city TEXT DEFAULT ""');
} catch(e) {}
try {
  db.exec('ALTER TABLE invoices ADD COLUMN invoice_group TEXT DEFAULT "Automático"');
} catch(e) {}
console.log("Patched flats and invoices tables!");

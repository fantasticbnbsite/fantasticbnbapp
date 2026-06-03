import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
try {
  db.prepare('ALTER TABLE users ADD COLUMN weekend_rate REAL NOT NULL DEFAULT 0').run();
  console.log('Added weekend_rate to users');
} catch (e) { console.log('weekend_rate exists'); }
try {
  db.prepare('ALTER TABLE users ADD COLUMN holiday_rate REAL NOT NULL DEFAULT 0').run();
  console.log('Added holiday_rate to users');
} catch (e) { console.log('holiday_rate exists'); }
try {
  db.prepare('ALTER TABLE jobs ADD COLUMN is_holiday INTEGER NOT NULL DEFAULT 0').run();
  console.log('Added is_holiday to jobs');
} catch (e) { console.log('is_holiday exists'); }
console.log('Done');

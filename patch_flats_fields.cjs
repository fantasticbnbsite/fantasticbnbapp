const Database = require('better-sqlite3');
const db = new Database('fantastic.sqlite');

try {
  db.exec('ALTER TABLE flats ADD COLUMN full_address TEXT DEFAULT ""');
  console.log('Added full_address');
} catch(e) { console.log('full_address already exists or error:', e.message); }

try {
  db.exec('ALTER TABLE flats ADD COLUMN access_code TEXT DEFAULT ""');
  console.log('Added access_code');
} catch(e) { console.log('access_code already exists or error:', e.message); }

console.log('Done');

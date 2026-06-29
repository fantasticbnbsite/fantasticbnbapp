import sqlite from 'node:sqlite';
import http from 'node:http';

const db = new sqlite.DatabaseSync('data/fantastic-bnb.sqlite');
db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES ('test_token_123', 1, '2030-01-01T00:00:00.000Z')").run();

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/jobs',
  method: 'GET',
  headers: {
    'Cookie': 'fantastic_session=test_token_123'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    db.prepare("DELETE FROM sessions WHERE token = 'test_token_123'").run();
  });
});

req.on('error', (e) => console.error('Error:', e));
req.end();

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/checklists',
  method: 'GET',
  headers: {
    // We need to bypass the session check. Wait, I can't easily do that without a real session cookie.
    // Instead, I'll temporarily disable the role check in server.js just for this test, or I can just look at the DB.
  }
};
// Actually, let's just make a script that injects a test route into server.js to dump the checklist templates.

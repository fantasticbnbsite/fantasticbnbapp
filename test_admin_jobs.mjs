import http from 'node:http';

const loginData = JSON.stringify({ email: 'admin@fantasticbnb.app', password: 'admin' });

const req1 = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, (res1) => {
  let token = '';
  const cookies = res1.headers['set-cookie'];
  if (cookies) {
    const sessionCookie = cookies.find(c => c.startsWith('fantastic_session='));
    if (sessionCookie) token = sessionCookie.split(';')[0].split('=')[1];
  }
  
  if (!token) { console.log('Login failed', res1.statusCode); return; }
  
  const req2 = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/jobs',
    method: 'GET',
    headers: { 'Cookie': `fantastic_session=${token}` }
  }, (res2) => {
    let data = '';
    res2.on('data', chunk => data += chunk);
    res2.on('end', () => console.log('Jobs status:', res2.statusCode, 'Data:', data));
  });
  req2.end();
});

req1.write(loginData);
req1.end();

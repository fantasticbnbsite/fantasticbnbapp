async function runTest() {
  console.log("Iniciando teste de fluxo completo...");
  try {
    const fetch = (await import('node-fetch')).default;
    const { fetch: fetchCookie } = require('node-fetch-cookies');
    const { CookieJar } = require('node-fetch-cookies');

    const BASE_URL = 'http://localhost:3000';
    let adminJar = new CookieJar();
    let clientJar = new CookieJar();
    let empJar = new CookieJar();

    async function req(jar, path, method, body) {
      const opts = { method, headers: {} };
      if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
      const res = await fetchCookie(jar, BASE_URL + path, opts);
      let text = await res.text();
      try { return JSON.parse(text); } catch(e) { return text; }
    }

    // 1. Admin Login
    console.log("1. Admin Login");
    await req(adminJar, '/api/auth/login', 'POST', { email: 'admin@cleanops.com', password: 'admin' });

    // 2. Create Flat
    console.log("2. Criar Flat para teste");
    const flats = await req(adminJar, '/api/flats', 'GET');
    let flatId = flats.length > 0 ? flats[0].id : null;
    let clientId = flats.length > 0 ? flats[0].client_user_id : null;
    
    if (!flatId) {
      console.log("-> Nenhum flat encontrado, por favor rode um seed antes.");
      return;
    }

    // 3. Client login (We need a client user, let's just get the users)
    console.log("3. Buscando clientes e employees...");
    const users = await req(adminJar, '/api/users', 'GET');
    const clientUser = users.find(u => u.role === 'client' && u.id === clientId);
    const empUser = users.find(u => u.role === 'employee');

    if (!clientUser || !empUser) {
      console.log("-> Faltando usuarios."); return;
    }
    
    console.log("Login como client...");
    // Forcing login by spoofing or using a password if we know it. We can't know passwords since they are hashed? 
    // Wait, the seed uses password '123' or 'password'.
    // Let's just create a job via Admin to simulate. Admin can't create jobs directly via API? Actually they can if we post to /api/jobs as admin. Let's see if /api/jobs allows admin.
    
    // Instead of full node-fetch which might fail if not installed, let's just use curl.
    console.log("Done");
  } catch(e) {
    console.error(e);
  }
}
runTest();

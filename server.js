import { createServer } from 'node:http';
import { existsSync, createReadStream, copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { renderInvoiceHtml, renderPayslipHtml } from './templates.js';
import webpush from 'web-push';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const DB_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backups');
const UPLOAD_DIR = path.join(DB_DIR, 'uploads');
const DB_PATH = path.join(DB_DIR, 'fantastic-bnb.sqlite');
const SESSION_COOKIE = 'fantastic_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 ano
const BACKUP_INTERVAL_MS = 1000 * 60 * 30;
const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Rate limiting: { key -> { count, resetAt } }
const loginAttempts = new Map();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Email config from env
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@fantasticbnb.app';

const DEFAULT_CLIENT_CATALOG = [
  { name: 'SIMPLY', slug: 'simply', segment: 'Operacao principal' },
  { name: 'SETL', slug: 'setl', segment: 'Gestao operacional' },
  { name: 'RENT UNIQUE (EMMA)', slug: 'rent-unique-emma', segment: 'Portfolio de locacao' },
  { name: 'PROPERT 1000LTD', slug: 'propert-1000ltd', segment: 'Cliente corporativo' },
  { name: 'MENSAL', slug: 'mensal', segment: 'Contratos recorrentes' },
  { name: 'Kristina Turner at Worthing Stays Limited', slug: 'kristina-turner-worthing-stays-limited', segment: 'Conta internacional' },
  { name: 'HOLERITES', slug: 'holerites', segment: 'Departamento pessoal' },
  { name: 'EAGLES', slug: 'eagles', segment: 'Operacao complementar' },
];
const OPERATIONS_STATE_KEY = 'operations';
const OPERATIONS_CLEANING_SEED = [
  { id: 1, date: '2026-04-20', clientName: 'SIMPLY', invoiceGroup: 'Simply Accommodation', cleaner: 'CAROL', city: 'Simply Accommodation', flat: 'FLAT 19', dayType: 'Weekdays', billingType: 'hourly', hours: '01:20', clientRate: 17, staffRate: 16, isHoliday: false, extraLabel: '', extraAmount: 0 },
  { id: 2, date: '2026-04-21', clientName: 'SIMPLY', invoiceGroup: 'Simply Accommodation', cleaner: 'RONALDO', city: 'Simply Accommodation', flat: 'FLAT 19', dayType: 'Weekdays', billingType: 'hourly', hours: '01:50', clientRate: 17, staffRate: 14, isHoliday: false, extraLabel: '', extraAmount: 0 },
  { id: 3, date: '2026-04-22', clientName: 'SIMPLY', invoiceGroup: 'Simply Accommodation', cleaner: 'RONALDO', city: 'Simply Accommodation', flat: '10 NORMANDY', dayType: 'Weekdays', billingType: 'hourly', hours: '02:10', clientRate: 17, staffRate: 14, isHoliday: false, extraLabel: 'BED LINEN', extraAmount: 20 },
  { id: 4, date: '2026-04-21', clientName: 'SIMPLY', invoiceGroup: 'Simply Accommodation Management', cleaner: 'RONALDO', city: 'Simply Accommodation Management', flat: '8WC', dayType: 'Weekdays', billingType: 'hourly', hours: '03:00', clientRate: 17, staffRate: 14, isHoliday: false, extraLabel: '', extraAmount: 0 },
  { id: 5, date: '2026-04-24', clientName: 'SIMPLY', invoiceGroup: 'Simply Accommodation Management', cleaner: 'JULIANA', city: 'Simply Accommodation Management', flat: '11GV', dayType: 'Weekdays', billingType: 'hourly', hours: '03:20', clientRate: 17, staffRate: 14, isHoliday: false, extraLabel: 'FUEL', extraAmount: 30 },
  { id: 6, date: '2026-04-26', clientName: 'SIMPLY', invoiceGroup: 'Simply Accommodation Management', cleaner: 'JESSICA', city: 'Simply Accommodation Management', flat: '8WC', dayType: 'Weekends', billingType: 'hourly', hours: '03:00', clientRate: 19, staffRate: 18, isHoliday: false, extraLabel: '', extraAmount: 0 },
];
const OPERATIONS_CLEANER_SEED = [
  { name: 'CAROL', weekdayRate: 16, weekendRate: 18, holidayRate: 18 },
  { name: 'JULIANA', weekdayRate: 14, weekendRate: 16, holidayRate: 16 },
  { name: 'WILL', weekdayRate: 16, weekendRate: 18, holidayRate: 18 },
  { name: 'ELITA', weekdayRate: 16, weekendRate: 18, holidayRate: 18 },
  { name: 'RONALDO', weekdayRate: 14, weekendRate: 16, holidayRate: 16 },
  { name: 'MARCIA', weekdayRate: 14, weekendRate: 16, holidayRate: 16 },
  { name: 'ALINE', weekdayRate: 14, weekendRate: 16, holidayRate: 16 },
  { name: 'JESSICA', weekdayRate: 16, weekendRate: 18, holidayRate: 18 },
  { name: 'EVILIN', weekdayRate: 14, weekendRate: 16, holidayRate: 16 },
];
const OPERATIONS_CLIENT_SEED = [
  {
    clientName: 'SIMPLY',
    legalName: '',
    billingEmail: '',
    groups: [
      { name: 'Simply Accommodation', billTo: 'Simply Accommodation', email: 'ross.james@mypropertyhost.com', billingType: 'hourly', weekdayClientRate: 17, weekendClientRate: 19, flats: ['FLAT 19', '10 NORMANDY', 'FLAT 20', 'FLAT 22', 'FLAT 20 CC'], flatRates: {} },
      { name: 'Simply Accommodation Management', billTo: 'Simply Accommodation Management', email: 'dylan@simplyaccomodation.co.uk', billingType: 'hourly', weekdayClientRate: 17, weekendClientRate: 19, flats: ['8WC', 'SILVER MAPLE', '11GV', '64 ER'], flatRates: {} },
    ],
  },
];

mkdirSync(DB_DIR, { recursive: true });
mkdirSync(BACKUP_DIR, { recursive: true });
mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');

// ─── Web Push Setup ──────────────────────────────────────────────────────────
const VAPID_KEYS_FILE = path.join(DB_DIR, 'vapid.json');
let vapidKeys;
if (existsSync(VAPID_KEYS_FILE)) {
  vapidKeys = JSON.parse(readFileSync(VAPID_KEYS_FILE, 'utf8'));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  writeFileSync(VAPID_KEYS_FILE, JSON.stringify(vapidKeys, null, 2));
}
webpush.setVapidDetails('mailto:suporte@fantasticbnb.app', vapidKeys.publicKey, vapidKeys.privateKey);

// Helper function to send push notification
async function sendPushNotification(userId, payload) {
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);
  if (!subs.length) return;
  for (const sub of subs) {
    try {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      await webpush.sendNotification(pushSub, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription is expired or invalid
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      } else {
        console.error('Error sending push notification to user', userId, err);
      }
    }
  }
}

async function notifyAdmins(payload) {
  const admins = db.prepare("SELECT id FROM users WHERE role IN ('admin', 'superadmin')").all();
  for (const admin of admins) {
    sendPushNotification(admin.id, payload).catch(()=>{});
  }
}

// ─── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  segment TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  hourly_rate REAL NOT NULL DEFAULT 0,
  weekend_rate REAL NOT NULL DEFAULT 0,
  holiday_rate REAL NOT NULL DEFAULT 0,
  parent_client_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_clients (
  user_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, client_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  status_key TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#5B8DEF',
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE(client_id, status_key),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK(field_type IN ('text','number','date','status','textarea')),
  required INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE(client_id, field_key),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status_key TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_by INTEGER,
  updated_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  record_id INTEGER,
  user_id INTEGER,
  action TEXT NOT NULL,
  snapshot_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS collaborators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  client_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  document_id TEXT DEFAULT '',
  pix_key TEXT DEFAULT '',
  hourly_weekday REAL NOT NULL DEFAULT 0,
  hourly_weekend REAL NOT NULL DEFAULT 0,
  hourly_holiday REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS holerite_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collaborator_id INTEGER NOT NULL,
  competence TEXT NOT NULL,
  hours_weekday REAL NOT NULL DEFAULT 0,
  hours_weekend REAL NOT NULL DEFAULT 0,
  hours_holiday REAL NOT NULL DEFAULT 0,
  gross_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  net_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  document_name TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS app_state (
  state_key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS flats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_user_id INTEGER,
  address TEXT NOT NULL,
  billing_type TEXT NOT NULL DEFAULT 'hourly' CHECK(billing_type IN ('hourly','project')),
  hourly_rate REAL NOT NULL DEFAULT 0,
  project_rate REAL NOT NULL DEFAULT 0,
  city TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flat_id INTEGER NOT NULL,
  client_user_id INTEGER NOT NULL,
  employee_user_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  employee_notes TEXT NOT NULL DEFAULT '',
  started_at TEXT,
  finished_at TEXT,
  duration_hours REAL,
  client_amount REAL,
  employee_amount REAL,
  invoice_sent INTEGER NOT NULL DEFAULT 0,
  is_holiday INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS job_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL DEFAULT '',
  uploaded_by INTEGER,
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS app_config (
  config_key TEXT PRIMARY KEY,
  value_text TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_user_id INTEGER NOT NULL,
  period_from TEXT NOT NULL,
  period_to TEXT NOT NULL,
  total_amount REAL NOT NULL,
  invoice_group TEXT DEFAULT 'Automático',
  status TEXT NOT NULL DEFAULT 'published',
  extras_json TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS payrolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_user_id INTEGER NOT NULL,
  client_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  period_from TEXT NOT NULL,
  period_to TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  extras_json TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  bank_name TEXT DEFAULT '',
  sort_code TEXT DEFAULT '',
  account_number TEXT DEFAULT ''
);
INSERT OR IGNORE INTO config (id) VALUES (1);
CREATE INDEX IF NOT EXISTS idx_records_client_updated ON records(client_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_client_status ON records(client_id, status_key);
CREATE INDEX IF NOT EXISTS idx_logs_client_record ON audit_logs(client_id, record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_collaborators_client ON collaborators(client_id);
CREATE INDEX IF NOT EXISTS idx_holerites_collaborator ON holerite_entries(collaborator_id, competence DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_employee ON jobs(employee_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_photos_job ON job_photos(job_id);
`);

// --- Migrations & schema adjustments ---
try { db.exec('ALTER TABLE users ADD COLUMN parent_client_id INTEGER REFERENCES users(id) ON DELETE SET NULL;'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN hourly_rate REAL NOT NULL DEFAULT 0;'); } catch {}
try { db.exec('ALTER TABLE flats ADD COLUMN hourly_weekend_rate REAL NOT NULL DEFAULT 0;'); } catch {}
try { db.exec('ALTER TABLE flats ADD COLUMN hourly_holiday_rate REAL NOT NULL DEFAULT 0;'); } catch {}
try { db.exec('ALTER TABLE jobs ADD COLUMN invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL;'); } catch {}
try { db.exec('ALTER TABLE jobs ADD COLUMN payroll_id INTEGER REFERENCES payrolls(id) ON DELETE SET NULL;'); } catch {}
try { db.exec('ALTER TABLE payrolls ADD COLUMN client_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;'); } catch {}
try { db.exec('ALTER TABLE jobs ADD COLUMN employee_notes TEXT NOT NULL DEFAULT "";'); } catch {}
try { db.exec('ALTER TABLE flats ADD COLUMN full_address TEXT NOT NULL DEFAULT "";'); } catch {}
try { db.exec('ALTER TABLE flats ADD COLUMN access_code TEXT NOT NULL DEFAULT "";'); } catch {}
try { db.exec('ALTER TABLE invoices ADD COLUMN invoice_number TEXT;'); } catch {}
migrateUserRoles();
seedDatabase();
// syncClientCatalog();
// seedCollaboratorModule();
// seedCleanOps();
createBackup('startup');
setInterval(() => createBackup('auto'), BACKUP_INTERVAL_MS).unref();

function cleanupOldPhotos() {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const oldPhotos = db.prepare('SELECT * FROM job_photos WHERE uploaded_at < ?').all(fourteenDaysAgo);
    const stmt = db.prepare('DELETE FROM job_photos WHERE id = ?');
    for (const photo of oldPhotos) {
      stmt.run(photo.id);
      try { unlinkSync(path.join(UPLOAD_DIR, photo.filename)); } catch (e) {}
    }
    if (oldPhotos.length > 0) console.log(`[Cleanup] Removed ${oldPhotos.length} old photos.`);
  } catch (err) {
    console.error('[Cleanup Error]', err);
  }
}
setInterval(cleanupOldPhotos, 1000 * 60 * 60 * 24).unref();
setTimeout(cleanupOldPhotos, 1000 * 60).unref();
// ─── HTTP Server ──────────────────────────────────────────────────────────────
createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    // CORS / OPTIONS
    if (req.method === 'OPTIONS') return sendNoContent(res);

    // API routes
    if (requestUrl.pathname.startsWith('/api/')) {
      await handleApi(req, res, requestUrl);
      return;
    }

    // Print routes
    if (requestUrl.pathname.startsWith('/print/')) {
      await handlePrintRequest(req, res, requestUrl);
      return;
    }

    // Serve uploaded photos (auth required)
    if (requestUrl.pathname.startsWith('/uploads/')) {
      const session = getSession(req);
      if (!session) return sendJson(res, 401, { error: 'Sessao expirada.' });
      const filename = path.basename(requestUrl.pathname);
      const filePath = path.join(UPLOAD_DIR, filename);
      if (!existsSync(filePath)) return sendJson(res, 404, { error: 'Arquivo nao encontrado.' });
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' });
      createReadStream(filePath).pipe(res);
      return;
    }

    // Static files
    const filePath = requestUrl.pathname === '/' ? path.join(__dirname, 'index.html') : path.join(__dirname, path.normalize(requestUrl.pathname));
    if (!filePath.startsWith(__dirname) || !existsSync(filePath)) {
      sendJson(res, 404, { error: 'Rota nao encontrada.' });
      return;
    }
    await sendFile(res, filePath);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'Erro interno do servidor: ' + error.message });
  }
}).listen(PORT, () => {
  console.log(`Fantastic BNB / CleanOps rodando em http://localhost:${PORT}`);
});

// ─── API Handler ─────────────────────────────────────────────────────────────
async function handleApi(req, res, requestUrl) {
  if (req.method === 'OPTIONS') return sendNoContent(res);

  // ── Auth: Login ──
  if (requestUrl.pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const rateLimitKey = `${ip}:${(body.email || '').toLowerCase()}`;

    // Rate limiting check
    const attempts = loginAttempts.get(rateLimitKey);
    if (attempts && attempts.count >= LOGIN_MAX_ATTEMPTS && Date.now() < attempts.resetAt) {
      const waitSecs = Math.ceil((attempts.resetAt - Date.now()) / 1000);
      return sendJson(res, 429, { error: `Muitas tentativas. Aguarde ${waitSecs}s para tentar novamente.` });
    }

    const user = db.prepare('SELECT * FROM users WHERE lower(email)=lower(?)').get(body.email || '');
    if (!user || !verifyPassword(body.password || '', user.password_salt, user.password_hash)) {
      // Record failed attempt
      const current = loginAttempts.get(rateLimitKey) || { count: 0, resetAt: Date.now() + LOGIN_WINDOW_MS };
      if (Date.now() > current.resetAt) { current.count = 0; current.resetAt = Date.now() + LOGIN_WINDOW_MS; }
      current.count += 1;
      loginAttempts.set(rateLimitKey, current);
      return sendJson(res, 401, { error: 'Email ou senha invalidos.' });
    }

    // Clear rate limit on success
    loginAttempts.delete(rateLimitKey);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAtIso = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const expiresAtUtc = new Date(Date.now() + SESSION_TTL_MS).toUTCString();
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAtIso);
    const isSecure = req.headers['x-forwarded-proto'] === 'https';
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; Expires=${expiresAtUtc}${isSecure ? '; Secure' : ''}`);
    return sendJson(res, 200, buildSessionPayload(user));
  }

  // Legacy login endpoint
  if (requestUrl.pathname === '/api/login' && req.method === 'POST') {
    return handleApi(req, res, new URL('/api/auth/login', `http://${req.headers.host}`));
  }

  // ── Push Notifications ──
  if (requestUrl.pathname === '/api/push/vapidPublicKey' && req.method === 'GET') {
    return sendJson(res, 200, { publicKey: vapidKeys.publicKey });
  }

  if (requestUrl.pathname === '/api/push/subscribe' && req.method === 'POST') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Sessao expirada.' });
    const sub = await parseBody(req);
    if (!sub || !sub.endpoint || !sub.keys) return sendJson(res, 400, { error: 'Invalid subscription' });
    
    // Upsert subscription based on endpoint
    const existing = db.prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?').get(sub.endpoint);
    if (existing) {
      db.prepare('UPDATE push_subscriptions SET user_id = ?, p256dh = ?, auth = ? WHERE endpoint = ?').run(
        session.user.id, sub.keys.p256dh, sub.keys.auth, sub.endpoint
      );
    } else {
      db.prepare('INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)').run(
        session.user.id, sub.endpoint, sub.keys.p256dh, sub.keys.auth
      );
    }

    // Enviar notificação de teste imediata
    try {
      const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
      webpush.sendNotification(pushSub, JSON.stringify({ title: 'Notificações Ativadas! ✅', body: 'Tudo certo. Você será avisado quando houver atualizações.' })).catch(()=>{});
    } catch(e) {}

    return sendJson(res, 200, { success: true });
  }

  // ── Auth: Logout ──
  if ((requestUrl.pathname === '/api/auth/logout' || requestUrl.pathname === '/api/logout') && req.method === 'POST') {
    const session = getSession(req);
    if (session) db.prepare('DELETE FROM sessions WHERE token = ?').run(session.token);
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
    return sendNoContent(res);
  }

  // ── Auth: Me ──
  if ((requestUrl.pathname === '/api/auth/me' || requestUrl.pathname === '/api/me') && req.method === 'GET') {
    const session = requireSession(req, res);
    if (!session) return;
    return sendJson(res, 200, buildSessionPayload(session.user));
  }

  // ── Auth: Change Password ──
  if (requestUrl.pathname === '/api/me/password' && req.method === 'PUT') {
    const session = requireSession(req, res);
    if (!session) return;
    const body = await parseBody(req);
    if (!body.currentPassword || !body.newPassword) return sendJson(res, 400, { error: 'Senhas atuais e novas sao obrigatorias.' });
    if (body.newPassword.length < 6) return sendJson(res, 400, { error: 'Nova senha deve ter pelo menos 6 caracteres.' });
    
    // Verify current password
    if (!verifyPassword(body.currentPassword, session.user.password_salt, session.user.password_hash)) {
      return sendJson(res, 401, { error: 'Senha atual incorreta.' });
    }
    
    const { salt, hash } = hashPassword(body.newPassword);
    db.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').run(salt, hash, session.user.id);
    return sendJson(res, 200, { success: true });
  }

  // All remaining routes require auth
  const session = requireSession(req, res);
  if (!session) return;

  // ── Overview ──
  if (requestUrl.pathname === '/api/overview' && req.method === 'GET') {
    const clients = getAccessibleClients(session.user);
    const clientIds = clients.map((c) => c.id);
    return sendJson(res, 200, {
      totals: {
        clients: clients.length,
        users: isAdminRole(session.user.role) ? db.prepare('SELECT COUNT(*) AS total FROM users').get().total : null,
        records: countRecords(clientIds),
        updatesToday: countUpdatesToday(clientIds),
        backups: listBackups().slice(0, 3),
      },
      clients,
    });
  }

  // ── Clients (admin module) ──
  if (requestUrl.pathname === '/api/clients' && req.method === 'GET') {
    return sendJson(res, 200, { clients: getAccessibleClients(session.user) });
  }
  if (requestUrl.pathname === '/api/clients' && req.method === 'POST') {
    if (!ensureRole(session.user, ['superadmin'], res)) return;
    const body = await parseBody(req);
    const slug = slugify(body.slug || body.name || 'cliente');
    const result = db.prepare('INSERT INTO clients (name, slug, segment) VALUES (?, ?, ?)').run(body.name || 'Novo cliente', slug, body.segment || '');
    createDefaultClientConfig(result.lastInsertRowid);
    return sendJson(res, 201, { client: db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid) });
  }

  const clientCrudMatch = requestUrl.pathname.match(/^\/api\/clients\/(\d+)$/);
  if (clientCrudMatch && req.method === 'PUT') {
    if (!ensureRole(session.user, ['superadmin'], res)) return;
    const clientId = Number(clientCrudMatch[1]);
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    if (!client) return sendJson(res, 404, { error: 'Cliente nao encontrado.' });
    const body = await parseBody(req);
    const slug = slugify(body.slug || body.name || client.name || 'cliente');
    db.prepare('UPDATE clients SET name = ?, slug = ?, segment = ? WHERE id = ?').run(body.name || client.name, slug, body.segment || client.segment || '', clientId);
    return sendJson(res, 200, { client: db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) });
  }
  if (clientCrudMatch && req.method === 'DELETE') {
    if (!ensureRole(session.user, ['superadmin'], res)) return;
    const clientId = Number(clientCrudMatch[1]);
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    if (!client) return sendJson(res, 404, { error: 'Cliente nao encontrado.' });
    if (client.slug === 'holerites') return sendJson(res, 400, { error: 'O cliente HOLERITES nao pode ser excluido.' });
    db.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
    return sendJson(res, 200, { ok: true });
  }

  // ── Users (admin) ──
  if (requestUrl.pathname === '/api/users' && req.method === 'GET') {
    if (!ensureRole(session.user, ['superadmin'], res)) return;
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.hourly_rate, u.weekend_rate, u.holiday_rate, u.created_at, u.parent_client_id,
             GROUP_CONCAT(c.name, ' | ') AS client_names
      FROM users u
      LEFT JOIN user_clients uc ON uc.user_id = u.id
      LEFT JOIN clients c ON c.id = uc.client_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();
    return sendJson(res, 200, { users });
  }
  if (requestUrl.pathname === '/api/users' && req.method === 'POST') {
    if (!ensureRole(session.user, ['superadmin'], res)) return;
    const body = await parseBody(req);
    const role = validateRole(body.role || 'viewer');
    const { salt, hash } = hashPassword(body.password || '123456');
    const result = db.prepare('INSERT OR IGNORE INTO users (name, email, role, password_hash, password_salt, hourly_rate, weekend_rate, holiday_rate, parent_client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(body.name || 'Novo usuario', body.email || '', role, hash, salt, Number(body.hourlyRate || 0), Number(body.weekendRate || 0), Number(body.holidayRate || 0), role === 'client_user' && body.parentClientId ? Number(body.parentClientId) : null);
    if (role === 'client' && Array.isArray(body.flatIds)) {
      for (const flatId of body.flatIds) {
        db.prepare('UPDATE flats SET client_user_id = ? WHERE id = ?').run(result.lastInsertRowid, Number(flatId));
      }
    }
    return sendJson(res, 201, { ok: true });
  }

  const userCrudMatch = requestUrl.pathname.match(/^\/api\/users\/(\d+)$/);
  
  if (userCrudMatch && req.method === 'PUT') {
    if (!ensureRole(session.user, ['superadmin'], res)) return;
    const userId = Number(userCrudMatch[1]);
    const body = await parseBody(req);
    const role = validateRole(body.role || 'viewer');
    
    if (body.password) {
      const { salt, hash } = hashPassword(body.password);
      db.prepare('UPDATE users SET name = ?, email = ?, role = ?, hourly_rate = ?, weekend_rate = ?, holiday_rate = ?, password_hash = ?, password_salt = ?, parent_client_id = ? WHERE id = ?')
        .run(body.name || 'Usuario Editado', body.email || '', role, Number(body.hourlyRate || 0), Number(body.weekendRate || 0), Number(body.holidayRate || 0), hash, salt, role === 'client_user' && body.parentClientId ? Number(body.parentClientId) : null, userId);
    } else {
      db.prepare('UPDATE users SET name = ?, email = ?, role = ?, hourly_rate = ?, weekend_rate = ?, holiday_rate = ?, parent_client_id = ? WHERE id = ?')
        .run(body.name || 'Usuario Editado', body.email || '', role, Number(body.hourlyRate || 0), Number(body.weekendRate || 0), Number(body.holidayRate || 0), role === 'client_user' && body.parentClientId ? Number(body.parentClientId) : null, userId);
    }
    
    if (role === 'client') {
      db.prepare('UPDATE flats SET client_user_id = NULL WHERE client_user_id = ?').run(userId);
      if (Array.isArray(body.flatIds)) {
        for (const flatId of body.flatIds) {
          db.prepare('UPDATE flats SET client_user_id = ? WHERE id = ?').run(userId, Number(flatId));
        }
      }
    }
    return sendJson(res, 200, { ok: true });
  }

  if (userCrudMatch && req.method === 'DELETE') {
    if (!ensureRole(session.user, ['superadmin'], res)) return;
    const userId = Number(userCrudMatch[1]);
    if (userId === session.user.id) return sendJson(res, 400, { error: 'Voce nao pode excluir o proprio usuario logado.' });
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) return sendJson(res, 404, { error: 'Usuario nao encontrado.' });
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return sendJson(res, 200, { ok: true });
  }

  const userPasswordMatch = requestUrl.pathname.match(/^\/api\/users\/(\d+)\/password$/);
  if (userPasswordMatch && req.method === 'PATCH') {
    if (!ensureRole(session.user, ['superadmin'], res)) return;
    const userId = Number(userPasswordMatch[1]);
    const body = await parseBody(req);
    if (!body.password || body.password.length < 4) return sendJson(res, 400, { error: 'A nova senha deve ter pelo menos 4 caracteres.' });
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) return sendJson(res, 404, { error: 'Usuario nao encontrado.' });
    
    const { salt, hash } = hashPassword(body.password);
    db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(hash, salt, userId);
    return sendJson(res, 200, { ok: true, message: 'Senha atualizada com sucesso.' });
  }

  // ── Flats ──
  if (requestUrl.pathname === '/api/flats' && req.method === 'GET') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const flats = db.prepare(`
      SELECT f.*, u.name AS client_name, u.email AS client_email
      FROM flats f
      LEFT JOIN users u ON u.id = f.client_user_id
      ORDER BY f.created_at DESC
    `).all();
    return sendJson(res, 200, { flats });
  }
  if (requestUrl.pathname === '/api/flats/mine' && req.method === 'GET') {
    if (session.user.role !== 'client' && session.user.role !== 'client_user') return sendJson(res, 403, { error: 'Apenas clientes podem acessar esta rota.' });
    const targetClientId = session.user.role === 'client_user' ? session.user.parent_client_id : session.user.id;
    const flats = db.prepare('SELECT * FROM flats WHERE client_user_id = ? AND active = 1 ORDER BY address').all(targetClientId);
    return sendJson(res, 200, { flats });
  }
  if (requestUrl.pathname === '/api/flats' && req.method === 'POST') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const body = await parseBody(req);
    const result = db.prepare('INSERT INTO flats (client_user_id, address, full_address, access_code, billing_type, hourly_rate, hourly_weekend_rate, hourly_holiday_rate, project_rate, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      body.clientUserId ? Number(body.clientUserId) : null,
      body.address || 'Novo flat',
      body.fullAddress || '',
      body.accessCode || '',
      body.billingType === 'project' ? 'project' : 'hourly',
      Number(body.hourlyRate || 0),
      Number(body.hourlyWeekendRate || 0),
      Number(body.hourlyHolidayRate || 0),
      Number(body.projectRate || 0),
      body.city || ''
    );
    return sendJson(res, 201, { flat: db.prepare('SELECT * FROM flats WHERE id = ?').get(result.lastInsertRowid) });
  }

  const flatCrudMatch = requestUrl.pathname.match(/^\/api\/flats\/(\d+)$/);
  if (flatCrudMatch && req.method === 'PUT') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const flatId = Number(flatCrudMatch[1]);
    const flat = db.prepare('SELECT * FROM flats WHERE id = ?').get(flatId);
    if (!flat) return sendJson(res, 404, { error: 'Flat nao encontrado.' });
    const body = await parseBody(req);
    db.prepare('UPDATE flats SET client_user_id=?, address=?, full_address=?, access_code=?, billing_type=?, hourly_rate=?, hourly_weekend_rate=?, hourly_holiday_rate=?, project_rate=?, city=?, active=? WHERE id=?').run(
      body.clientUserId !== undefined ? (body.clientUserId ? Number(body.clientUserId) : null) : flat.client_user_id,
      body.address || flat.address,
      body.fullAddress !== undefined ? body.fullAddress : flat.full_address,
      body.accessCode !== undefined ? body.accessCode : flat.access_code,
      body.billingType === 'project' ? 'project' : 'hourly',
      Number(body.hourlyRate ?? flat.hourly_rate),
      Number(body.hourlyWeekendRate ?? flat.hourly_weekend_rate),
      Number(body.hourlyHolidayRate ?? flat.hourly_holiday_rate),
      Number(body.projectRate ?? flat.project_rate),
      body.city ?? flat.city,
      body.active === false ? 0 : 1,
      flatId
    );
    return sendJson(res, 200, { flat: db.prepare('SELECT * FROM flats WHERE id = ?').get(flatId) });
  }
  if (flatCrudMatch && req.method === 'DELETE') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const flatId = Number(flatCrudMatch[1]);
    if (!db.prepare('SELECT id FROM flats WHERE id = ?').get(flatId)) return sendJson(res, 404, { error: 'Flat nao encontrado.' });
    db.prepare('DELETE FROM flats WHERE id = ?').run(flatId);
    return sendJson(res, 200, { ok: true });
  }

  // ── Jobs ──
  if (requestUrl.pathname === '/api/jobs' && req.method === 'GET') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const statusFilter = requestUrl.searchParams.get('status') || '';
    const clientFilter = requestUrl.searchParams.get('client_id') || '';
    let sql = `
      SELECT j.*,
        f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code, f.billing_type AS flat_billing_type, f.hourly_rate AS flat_hourly_rate, f.project_rate AS flat_project_rate,
        cu.name AS client_name, cu.email AS client_email,
        eu.name AS employee_name, eu.email AS employee_email
      FROM jobs j
      LEFT JOIN flats f ON f.id = j.flat_id
      LEFT JOIN users cu ON cu.id = j.client_user_id
      LEFT JOIN users eu ON eu.id = j.employee_user_id
      WHERE 1=1
    `;
    const params = [];
    if (statusFilter) { sql += ' AND j.status = ?'; params.push(statusFilter); }
    if (clientFilter) { sql += ' AND j.client_user_id = ?'; params.push(Number(clientFilter)); }
    sql += ' ORDER BY j.created_at DESC LIMIT 200';
    const jobs = db.prepare(sql).all(...params).map(hydrateJob);
    return sendJson(res, 200, { jobs });
  }

  if (requestUrl.pathname === '/api/jobs/mine' && req.method === 'GET') {
    const isEmployeeView = ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(session.user.role);
    const isClientView = ['client', 'client_user'].includes(session.user.role);
    if (!isEmployeeView && !isClientView) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const targetClientId = session.user.role === 'client_user' ? session.user.parent_client_id : session.user.id;
    const whereField = isEmployeeView ? 'j.employee_user_id' : 'j.client_user_id';
    const filterId = isEmployeeView ? session.user.id : targetClientId;
    const jobs = db.prepare(`
      SELECT j.*,
        f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code, f.billing_type AS flat_billing_type, f.hourly_rate AS flat_hourly_rate, f.project_rate AS flat_project_rate,
        cu.name AS client_name, cu.email AS client_email,
        eu.name AS employee_name, eu.email AS employee_email
      FROM jobs j
      LEFT JOIN flats f ON f.id = j.flat_id
      LEFT JOIN users cu ON cu.id = j.client_user_id
      LEFT JOIN users eu ON eu.id = j.employee_user_id
      WHERE ${whereField} = ?
      ORDER BY j.created_at DESC LIMIT 100
    `).all(filterId).map(hydrateJob);
    return sendJson(res, 200, { jobs });
  }

  if (requestUrl.pathname === '/api/jobs' && req.method === 'POST') {
    if (session.user.role !== 'client' && session.user.role !== 'client_user' && !isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Sem permissao.' });
    
    const body = await parseBody(req);
    if (!body.requestedDate) return sendJson(res, 400, { error: 'Data obrigatoria.' });
    
    let targetClientId;
    let status = 'pending';
    let empId = null;
    let flat;
    
    if (isAdminRole(session.user.role)) {
       targetClientId = Number(body.clientId);
       flat = db.prepare('SELECT * FROM flats WHERE id = ? AND client_user_id = ?').get(Number(body.flatId), targetClientId);
       if (body.employeeUserId) {
         empId = Number(body.employeeUserId);
         status = 'assigned';
       }
    } else {
       targetClientId = session.user.role === 'client_user' ? session.user.parent_client_id : session.user.id;
       flat = db.prepare('SELECT * FROM flats WHERE id = ? AND client_user_id = ? AND active = 1').get(Number(body.flatId), targetClientId);
    }
    
    if (!flat) return sendJson(res, 404, { error: 'Flat nao encontrado ou sem permissao.' });
    
    const now = new Date().toISOString();
    const isHoliday = body.isHoliday ? 1 : 0;
    const result = db.prepare('INSERT INTO jobs (flat_id, client_user_id, status, requested_date, employee_user_id, notes, is_holiday, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(flat.id, targetClientId, status, body.requestedDate, empId, body.notes || '', isHoliday, now, now);
    
    if (status === 'assigned' && empId) {
      sendPushNotification(empId, { title: 'Novo Serviço', body: `Serviço agendado no flat ${flat.address}` }).catch(() => {});
    }

    return sendJson(res, 201, { job: hydrateJob(db.prepare('SELECT j.*, f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code, f.billing_type AS flat_billing_type, f.hourly_rate AS flat_hourly_rate, f.project_rate AS flat_project_rate FROM jobs j LEFT JOIN flats f ON f.id = j.flat_id WHERE j.id = ?').get(result.lastInsertRowid)) });
  }

  if (requestUrl.pathname === '/api/jobs/manual' && req.method === 'POST') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const body = await parseBody(req);
    
    const flatId = Number(body.flatId);
    const employeeUserId = Number(body.employeeUserId);
    const flat = db.prepare('SELECT * FROM flats WHERE id = ?').get(flatId);
    if (!flat) return sendJson(res, 404, { error: 'Flat nao encontrado.' });
    
    const emp = db.prepare('SELECT * FROM users WHERE id = ?').get(employeeUserId);
    if (!emp) return sendJson(res, 404, { error: 'Funcionario nao encontrado.' });

    const durationHours = Number(body.durationHours) || 0;
    const isHoliday = body.isHoliday ? 1 : 0;
    const reqDate = new Date(body.requestedDate);
    const isWeekend = reqDate.getDay() === 0 || reqDate.getDay() === 6;
    
    let employeeRate = isHoliday ? Number(emp.holiday_rate || emp.hourly_rate || 0) : (isWeekend ? Number(emp.weekend_rate || emp.hourly_rate || 0) : Number(emp.hourly_rate || 0));
    const employeeAmount = roundCurrency(durationHours * employeeRate);
    
    let clientRate = isHoliday ? Number(flat.hourly_holiday_rate || flat.hourly_rate || 0) : (isWeekend ? Number(flat.hourly_weekend_rate || flat.hourly_rate || 0) : Number(flat.hourly_rate || 0));
    let clientAmount = 0;
    if (flat.billing_type === 'project') {
      const existingJob = db.prepare('SELECT id FROM jobs WHERE flat_id = ? AND requested_date = ? AND client_amount > 0').get(flatId, body.requestedDate);
      clientAmount = existingJob ? 0 : roundCurrency(Number(flat.project_rate || 0));
    } else {
      clientAmount = roundCurrency(durationHours * clientRate);
    }

    const now = new Date().toISOString();
    
    // We update invoice_id and payroll_id
    let invoiceId = body.invoiceId || null;
    let payrollId = body.payrollId || null;

    const result = db.prepare('INSERT INTO jobs (flat_id, client_user_id, employee_user_id, status, requested_date, duration_hours, client_amount, employee_amount, is_holiday, notes, invoice_id, payroll_id, created_at, updated_at, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(flatId, flat.client_user_id, employeeUserId, 'completed', body.requestedDate, durationHours, clientAmount, employeeAmount, isHoliday, 'Serviço lançado manualmente pelo admin', invoiceId, payrollId, now, now, now);

    // If attached to invoice or payroll, we must recount totals
    if (invoiceId) {
       const jData = db.prepare('SELECT SUM(client_amount) as s FROM jobs WHERE invoice_id = ?').get(invoiceId);
       const inv = db.prepare('SELECT extras_json FROM invoices WHERE id = ?').get(invoiceId);
       let ex = 0;
       if (inv) {
          const arr = safeJsonParse(inv.extras_json) || [];
          ex = arr.reduce((acc, x) => acc + (Number(x.total) || 0), 0);
       }
       db.prepare('UPDATE invoices SET total_amount = ? WHERE id = ?').run(roundCurrency((jData.s || 0) + ex), invoiceId);
    }
    if (payrollId) {
       const pData = db.prepare('SELECT SUM(employee_amount) as s FROM jobs WHERE payroll_id = ?').get(payrollId);
       const p = db.prepare('SELECT extras_json FROM payrolls WHERE id = ?').get(payrollId);
       let px = 0;
       if (p) {
          const arr = safeJsonParse(p.extras_json) || [];
          px = arr.reduce((acc, x) => acc + (Number(x.total) || 0), 0);
       }
       db.prepare('UPDATE payrolls SET total_amount = ? WHERE id = ?').run(roundCurrency((pData.s || 0) + px), payrollId);
    }
      
    return sendJson(res, 201, { success: true, jobId: result.lastInsertRowid });
  }

  // Job status transitions and edits
  const jobCrudMatch = requestUrl.pathname.match(/^\/api\/jobs\/(\d+)$/);
  if (jobCrudMatch && req.method === 'PUT') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const jobId = Number(jobCrudMatch[1]);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) return sendJson(res, 404, { error: 'Servico nao encontrado.' });
    
    const body = await parseBody(req);
    const now = new Date().toISOString();
    
    let updatedEmployeeUserId = job.employee_user_id;
    if (body.employeeUserId !== undefined) {
      updatedEmployeeUserId = body.employeeUserId ? Number(body.employeeUserId) : null;
    }
    
    const updatedRequestedDate = body.requestedDate || job.requested_date;
    const updatedStatus = body.status || job.status;
    let updatedDurationHours = job.duration_hours;
    let updatedClientAmount = job.client_amount;
    let updatedEmployeeAmount = job.employee_amount;

    let updatedIsHoliday = job.is_holiday;
    if (body.isHoliday !== undefined) {
      updatedIsHoliday = body.isHoliday ? 1 : 0;
    }

    if (body.durationHours !== undefined && updatedStatus === 'completed') {
      updatedDurationHours = Number(body.durationHours) || 0;
      const flat = db.prepare('SELECT * FROM flats WHERE id = ?').get(job.flat_id);
      
      let employeeRate = 0;
      if (updatedEmployeeUserId) {
        const emp = db.prepare('SELECT * FROM users WHERE id = ?').get(updatedEmployeeUserId);
        if (emp) {
          const reqDate = new Date(updatedRequestedDate);
          const isWeekend = reqDate.getDay() === 0 || reqDate.getDay() === 6;
          if (updatedIsHoliday) {
            employeeRate = Number(emp.holiday_rate || emp.hourly_rate || 0);
          } else if (isWeekend) {
            employeeRate = Number(emp.weekend_rate || emp.hourly_rate || 0);
          } else {
            employeeRate = Number(emp.hourly_rate || 0);
          }
        }
      }
      
      const reqDate = new Date(updatedRequestedDate);
      const isWeekend = reqDate.getDay() === 0 || reqDate.getDay() === 6;
      let clientRate = updatedIsHoliday ? Number(flat.hourly_holiday_rate || flat.hourly_rate || 0) : (isWeekend ? Number(flat.hourly_weekend_rate || flat.hourly_rate || 0) : Number(flat.hourly_rate || 0));
      
      updatedEmployeeAmount = roundCurrency(updatedDurationHours * employeeRate);
      
      if (flat.billing_type === 'project') {
        const existingJob = db.prepare('SELECT id FROM jobs WHERE flat_id = ? AND requested_date = ? AND id != ? AND client_amount > 0').get(job.flat_id, updatedRequestedDate, jobId);
        updatedClientAmount = existingJob ? 0 : roundCurrency(Number(flat.project_rate || 0));
      } else {
        updatedClientAmount = roundCurrency(updatedDurationHours * clientRate);
      }
    }

    db.prepare(`UPDATE jobs SET employee_user_id=?, status=?, requested_date=?, duration_hours=?, client_amount=?, employee_amount=?, is_holiday=?, updated_at=? WHERE id=?`)
      .run(updatedEmployeeUserId, updatedStatus, updatedRequestedDate, updatedDurationHours, updatedClientAmount, updatedEmployeeAmount, updatedIsHoliday, now, jobId);

    const updatedJob = db.prepare(`
      SELECT j.*, f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code, f.billing_type AS flat_billing_type, f.hourly_rate AS flat_hourly_rate, f.project_rate AS flat_project_rate,
        cu.name AS client_name, cu.email AS client_email, eu.name AS employee_name, eu.email AS employee_email
      FROM jobs j LEFT JOIN flats f ON f.id=j.flat_id LEFT JOIN users cu ON cu.id=j.client_user_id LEFT JOIN users eu ON eu.id=j.employee_user_id
      WHERE j.id=?
    `).get(jobId);
    return sendJson(res, 200, { job: hydrateJob(updatedJob) });
  }

  if (jobCrudMatch && req.method === 'DELETE') {
    const jobId = Number(jobCrudMatch[1]);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) return sendJson(res, 404, { error: 'Servico nao encontrado.' });
    const targetClientId = session.user.role === 'client_user' ? session.user.parent_client_id : session.user.id;
    if ((session.user.role === 'client' || session.user.role === 'client_user') && job.client_user_id !== targetClientId) {
      return sendJson(res, 403, { error: 'Voce nao tem permissao para excluir este servico.' });
    }
    db.prepare('DELETE FROM jobs WHERE id = ?').run(jobId);
    return sendNoContent(res);
  }

  const jobTransitionMatch = requestUrl.pathname.match(/^\/api\/jobs\/(\d+)\/(assign|accept|reject|start|finish|cancel)$/);
  if (jobTransitionMatch && req.method === 'PATCH') {
    const jobId = Number(jobTransitionMatch[1]);
    const action = jobTransitionMatch[2];
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) return sendJson(res, 404, { error: 'Servico nao encontrado.' });

    const now = new Date().toISOString();
    let body = {};
    try {
      body = await parseBody(req);
    } catch (e) {}

    if (action === 'assign') {
      if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
      if (!['pending', 'assigned'].includes(job.status)) return sendJson(res, 400, { error: `Nao e possivel designar um servico com status '${job.status}'.` });
      const employee = db.prepare("SELECT * FROM users WHERE id = ? AND role IN ('employee', 'admin', 'superadmin', 'manager', 'analyst')").get(Number(body.employeeUserId));
      if (!employee) return sendJson(res, 404, { error: 'Funcionario nao encontrado.' });
      db.prepare('UPDATE jobs SET employee_user_id=?, status=?, updated_at=? WHERE id=?').run(employee.id, 'assigned', now, jobId);
      sendPushNotification(employee.id, { title: 'Novo Serviço', body: 'Você foi designado para um novo serviço.' }).catch(() => {});
    } else if (action === 'accept') {
      const isEmployeeView = ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(session.user.role);
      if (!isEmployeeView) return sendJson(res, 403, { error: 'Apenas funcionarios podem aceitar servicos.' });
      if (job.employee_user_id !== session.user.id) return sendJson(res, 403, { error: 'Este servico nao esta designado para voce.' });
      if (job.status !== 'assigned') return sendJson(res, 400, { error: `Nao e possivel aceitar um servico com status '${job.status}'.` });
      db.prepare('UPDATE jobs SET status=?, updated_at=? WHERE id=?').run('accepted', now, jobId);
      notifyAdmins({ title: 'Serviço Aceito ✅', body: `O serviço #${jobId} foi aceito.` });
    } else if (action === 'reject') {
      const isEmployeeView = ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(session.user.role);
      if (!isEmployeeView) return sendJson(res, 403, { error: 'Apenas funcionarios podem recusar servicos.' });
      if (job.employee_user_id !== session.user.id) return sendJson(res, 403, { error: 'Este servico nao esta designado para voce.' });
      if (job.status !== 'assigned') return sendJson(res, 400, { error: `Nao e possivel recusar um servico com status '${job.status}'.` });
      db.prepare('UPDATE jobs SET status=?, employee_user_id=NULL, updated_at=? WHERE id=?').run('pending', now, jobId);
      notifyAdmins({ title: 'Serviço Recusado ❌', body: `O serviço #${jobId} foi recusado.` });
    } else if (action === 'start') {
      if (job.status !== 'accepted') return sendJson(res, 400, { error: 'O servico precisa estar aceito para iniciar.' });
      if (job.employee_user_id !== session.user.id && !isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
      
      db.prepare('UPDATE jobs SET status=?, started_at=?, updated_at=? WHERE id=?').run('in_progress', now, now, jobId);
      const flat = db.prepare('SELECT address FROM flats WHERE id = ?').get(job.flat_id);
      sendPushNotification(job.client_user_id, { title: 'Serviço Iniciado ⏱️', body: `A limpeza no flat ${flat.address} começou agora.` }).catch(() => {});
      notifyAdmins({ title: 'Serviço Iniciado ⏱️', body: `A limpeza no flat ${flat.address} foi iniciada.` });
    } else if (action === 'finish') {
      const isEmployeeView = ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(session.user.role);
      if (!isEmployeeView) return sendJson(res, 403, { error: 'Apenas funcionarios podem finalizar servicos.' });
      if (job.employee_user_id !== session.user.id) return sendJson(res, 403, { error: 'Este servico nao esta designado para voce.' });
      if (job.status !== 'in_progress') return sendJson(res, 400, { error: `Nao e possivel finalizar um servico com status '${job.status}'.` });

      const startedAt = new Date(job.started_at);
      const finishedAt = new Date(now);
      const durationMs = finishedAt - startedAt;
      const durationHours = roundCurrency(durationMs / 3_600_000);

      const employee = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user.id);
      const flat = db.prepare('SELECT * FROM flats WHERE id = ?').get(job.flat_id);

      const reqDate = new Date(job.requested_date);
      const isWeekend = reqDate.getDay() === 0 || reqDate.getDay() === 6;
      let employeeRate = 0;
      if (job.is_holiday) {
        employeeRate = Number(employee.holiday_rate || employee.hourly_rate || 0);
      } else if (isWeekend) {
        employeeRate = Number(employee.weekend_rate || employee.hourly_rate || 0);
      } else {
        employeeRate = Number(employee.hourly_rate || 0);
      }

      const employeeAmount = roundCurrency(durationHours * employeeRate);
      let clientRate = 0;
      if (job.is_holiday) {
        clientRate = Number(flat.hourly_holiday_rate || flat.hourly_rate || 0);
      } else if (isWeekend) {
        clientRate = Number(flat.hourly_weekend_rate || flat.hourly_rate || 0);
      } else {
        clientRate = Number(flat.hourly_rate || 0);
      }
      const clientAmount = flat.billing_type === 'project' ? roundCurrency(Number(flat.project_rate || 0)) : roundCurrency(durationHours * clientRate);

      db.prepare('UPDATE jobs SET status=?, finished_at=?, duration_hours=?, client_amount=?, employee_amount=?, employee_notes=?, updated_at=? WHERE id=?').run('completed', now, durationHours, clientAmount, employeeAmount, body.employeeNotes || '', now, jobId);

      // Send invoice email (fire and forget)
      const updatedJob = db.prepare('SELECT j.*, f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code, cu.name AS client_name, cu.email AS client_email FROM jobs j LEFT JOIN flats f ON f.id = j.flat_id LEFT JOIN users cu ON cu.id = j.client_user_id WHERE j.id = ?').get(jobId);
      sendInvoiceEmail(updatedJob, durationHours, clientAmount).catch((e) => console.error('Invoice email error:', e));
      sendPushNotification(job.client_user_id, { title: 'Serviço Concluído 🔴', body: `A limpeza no flat ${flat.address} foi finalizada.` }).catch(() => {});
      notifyAdmins({ title: 'Serviço Concluído 🔴', body: `A limpeza no flat ${flat.address} foi finalizada.` });
    } else if (action === 'cancel') {
      if (session.user.role === 'client' || session.user.role === 'client_user') {
        const targetClientId = session.user.role === 'client_user' ? session.user.parent_client_id : session.user.id;
        if (job.client_user_id !== targetClientId) return sendJson(res, 403, { error: 'Este servico nao pertence a voce.' });
        if (job.status === 'in_progress' || job.status === 'completed') return sendJson(res, 400, { error: 'Nao e possivel cancelar um servico ja em andamento ou concluido.' });
      } else if (!isAdminRole(session.user.role)) {
        return sendJson(res, 403, { error: 'Permissao insuficiente.' });
      }
      if (job.status === 'completed') return sendJson(res, 400, { error: 'Nao e possivel cancelar um servico concluido.' });
      db.prepare('UPDATE jobs SET status=?, updated_at=? WHERE id=?').run('cancelled', now, jobId);
      if (job.employee_user_id) {
        sendPushNotification(job.employee_user_id, { title: 'Serviço Cancelado 🚫', body: `Um serviço agendado para você foi cancelado.` }).catch(() => {});
      }
    }

    const updatedJob = db.prepare(`
      SELECT j.*, f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code, f.billing_type AS flat_billing_type, f.hourly_rate AS flat_hourly_rate, f.project_rate AS flat_project_rate,
        cu.name AS client_name, cu.email AS client_email, eu.name AS employee_name, eu.email AS employee_email
      FROM jobs j LEFT JOIN flats f ON f.id=j.flat_id LEFT JOIN users cu ON cu.id=j.client_user_id LEFT JOIN users eu ON eu.id=j.employee_user_id
      WHERE j.id=?
    `).get(jobId);
    return sendJson(res, 200, { job: hydrateJob(updatedJob) });
  }

  // ── Job Photos ──
  const jobPhotosMatch = requestUrl.pathname.match(/^\/api\/jobs\/(\d+)\/photos$/);
  if (jobPhotosMatch && req.method === 'GET') {
    const jobId = Number(jobPhotosMatch[1]);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) return sendJson(res, 404, { error: 'Servico nao encontrado.' });
    if (session.user.role === 'employee' && job.employee_user_id !== session.user.id) return sendJson(res, 403, { error: 'Sem permissao.' });
    const targetClientId = session.user.role === 'client_user' ? session.user.parent_client_id : session.user.id;
    if ((session.user.role === 'client' || session.user.role === 'client_user') && job.client_user_id !== targetClientId) return sendJson(res, 403, { error: 'Sem permissao.' });
    const photos = db.prepare('SELECT * FROM job_photos WHERE job_id = ? ORDER BY uploaded_at ASC').all(jobId);
    return sendJson(res, 200, { photos });
  }
  if (jobPhotosMatch && req.method === 'POST') {
    const jobId = Number(jobPhotosMatch[1]);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) return sendJson(res, 404, { error: 'Servico nao encontrado.' });
    if (!['employee', 'admin', 'superadmin', 'manager'].includes(session.user.role)) return sendJson(res, 403, { error: 'Apenas funcionarios e gerencia podem enviar fotos.' });
    if (job.employee_user_id !== session.user.id) return sendJson(res, 403, { error: 'Este servico nao esta designado para voce.' });
    if (!['in_progress', 'completed'].includes(job.status)) return sendJson(res, 400, { error: 'So e possivel enviar fotos durante ou apos o servico.' });

    let uploadedFile;
    try {
      uploadedFile = await parseMultipart(req, UPLOAD_DIR);
    } catch (e) {
      return sendJson(res, 400, { error: e.message || 'Erro ao processar upload.' });
    }

    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO job_photos (job_id, filename, original_name, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?)').run(jobId, uploadedFile.filename, uploadedFile.originalName, session.user.id, now);
    return sendJson(res, 201, { photo: db.prepare('SELECT * FROM job_photos WHERE id = ?').get(result.lastInsertRowid) });
  }

  const jobPhotoDeleteMatch = requestUrl.pathname.match(/^\/api\/jobs\/(\d+)\/photos\/(\d+)$/);
  if (jobPhotoDeleteMatch && req.method === 'DELETE') {
    if (!isAdminRole(session.user.role) && session.user.role !== 'employee') return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const photoId = Number(jobPhotoDeleteMatch[2]);
    const photo = db.prepare('SELECT * FROM job_photos WHERE id = ?').get(photoId);
    if (!photo) return sendJson(res, 404, { error: 'Foto nao encontrada.' });
    db.prepare('DELETE FROM job_photos WHERE id = ?').run(photoId);
    fs.unlink(path.join(UPLOAD_DIR, photo.filename)).catch(() => {});
    return sendJson(res, 200, { ok: true });
  }

  // ── Payslip / Holerite por serviço ──
  if (requestUrl.pathname === '/api/payslip/mine' && req.method === 'GET') {
    if (!['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(session.user.role)) return sendJson(res, 403, { error: 'Apenas funcionarios e gerência podem acessar holerites.' });
    const month = requestUrl.searchParams.get('month') || currentMonthParam();
    return sendJson(res, 200, buildJobPayslip(session.user.id, month));
  }

  const payslipMatch = requestUrl.pathname.match(/^\/api\/payslip\/employee\/(\d+)$/);
  if (payslipMatch && req.method === 'GET') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const employeeId = Number(payslipMatch[1]);
    const month = requestUrl.searchParams.get('month') || currentMonthParam();
    return sendJson(res, 200, buildJobPayslip(employeeId, month));
  }

  const invoiceMatch = requestUrl.pathname.match(/^\/api\/invoices\/client\/(\d+)$/);
  if (invoiceMatch && req.method === 'GET') {
    if (session.user.role !== 'client' && session.user.role !== 'client_user' && !isAdminRole(session.user.role) && session.user.role !== 'viewer') {
      return sendJson(res, 403, { error: 'Sem permissao.' });
    }
    const clientId = Number(invoiceMatch[1]);
    const month = requestUrl.searchParams.get('month') || currentMonthParam();
    return sendJson(res, 200, buildClientInvoice(clientId, month));
  }

  // ── Global Config ──
  if (requestUrl.pathname === '/api/config' && req.method === 'GET') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const rows = db.prepare('SELECT config_key, value_text FROM app_config').all();
    const config = {};
    rows.forEach((r) => { config[r.config_key] = r.value_text; });
    return sendJson(res, 200, { config });
  }
  if (requestUrl.pathname === '/api/config' && req.method === 'PUT') {
    if (!ensureRole(session.user, ['superadmin'], res)) return;
    const body = await parseBody(req);
    const now = new Date().toISOString();
    for (const [key, value] of Object.entries(body || {})) {
      db.prepare('INSERT INTO app_config (config_key, value_text, updated_at) VALUES (?, ?, ?) ON CONFLICT(config_key) DO UPDATE SET value_text=excluded.value_text, updated_at=excluded.updated_at').run(String(key), String(value || ''), now);
    }
    const rows = db.prepare('SELECT config_key, value_text FROM app_config').all();
    const config = {};
    rows.forEach((r) => { config[r.config_key] = r.value_text; });
    return sendJson(res, 200, { config });
  }

  // ── Financial Report ──
  if (requestUrl.pathname === '/api/reports/financial' && req.method === 'GET') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const from = requestUrl.searchParams.get('from') || '';
    const to = requestUrl.searchParams.get('to') || '';
    return sendJson(res, 200, buildFinancialReport(from, to));
  }

  // ── Holerites (legacy collaborator module) ──
  if (requestUrl.pathname === '/api/holerites/summary' && req.method === 'GET') {
    return sendJson(res, 200, buildHoleriteSummary(session.user));
  }
  if (requestUrl.pathname === '/api/holerites/collaborators' && req.method === 'GET') {
    return sendJson(res, 200, { collaborators: listCollaborators(session.user) });
  }
  if (requestUrl.pathname === '/api/holerites/collaborators' && req.method === 'POST') {
    if (!ensureRole(session.user, ['superadmin', 'manager'], res)) return;
    const body = await parseBody(req);
    const holeritesClientId = getHoleritesClientId();
    const { salt, hash } = hashPassword(body.password || '123456');
    const userResult = db.prepare('INSERT OR IGNORE INTO users (name, email, role, password_hash, password_salt, hourly_rate) VALUES (?, ?, ?, ?, ?, ?)').run(body.fullName || 'Novo colaborador', body.email || '', 'viewer', hash, salt, 0);
    db.prepare('INSERT OR IGNORE INTO user_clients (user_id, client_id) VALUES (?, ?)').run(userResult.lastInsertRowid, holeritesClientId);
    const result = db.prepare('INSERT INTO collaborators (user_id, client_id, full_name, document_id, pix_key, hourly_weekday, hourly_weekend, hourly_holiday, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(userResult.lastInsertRowid, holeritesClientId, body.fullName || 'Novo colaborador', body.documentId || '', body.pixKey || '', Number(body.hourlyWeekday || 0), Number(body.hourlyWeekend || 0), Number(body.hourlyHoliday || 0), body.active === false ? 0 : 1);
    return sendJson(res, 201, { collaborator: getCollaboratorById(result.lastInsertRowid) });
  }
  if (requestUrl.pathname === '/api/holerites/entries' && req.method === 'GET') {
    return sendJson(res, 200, { entries: listHoleriteEntries(session.user) });
  }
  if (requestUrl.pathname === '/api/holerites/entries' && req.method === 'POST') {
    if (!ensureRole(session.user, ['superadmin', 'manager'], res)) return;
    const body = await parseBody(req);
    const collaborator = getCollaboratorById(Number(body.collaboratorId));
    if (!collaborator) return sendJson(res, 404, { error: 'Colaborador nao encontrado.' });
    const hoursWeekday = Number(body.hoursWeekday || 0);
    const hoursWeekend = Number(body.hoursWeekend || 0);
    const hoursHoliday = Number(body.hoursHoliday || 0);
    const grossAmount = roundCurrency(hoursWeekday * Number(collaborator.hourly_weekday) + hoursWeekend * Number(collaborator.hourly_weekend) + hoursHoliday * Number(collaborator.hourly_holiday));
    const discountAmount = Number(body.discountAmount || 0);
    const netAmount = roundCurrency(grossAmount - discountAmount);
    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO holerite_entries (collaborator_id, competence, hours_weekday, hours_weekend, hours_holiday, gross_amount, discount_amount, net_amount, status, document_name, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(Number(body.collaboratorId), body.competence || currentCompetence(), hoursWeekday, hoursWeekend, hoursHoliday, grossAmount, discountAmount, netAmount, body.status || 'pendente', body.documentName || '', body.notes || '', now, now);
    return sendJson(res, 201, { entry: getHoleriteEntryById(result.lastInsertRowid) });
  }

  // ── Automated Finance ──
  if (requestUrl.pathname === '/api/finance/generate' && req.method === 'POST') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const body = await parseBody(req);
    const { type, periodFrom, periodTo, targetId, groupByClient } = body;
    if (!periodFrom || !periodTo || !type) return sendJson(res, 400, { error: 'Periodo ou tipo invalido.' });
    const now = new Date().toISOString();

    const jobs = db.prepare(`
      SELECT j.*, f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code, f.city AS city, cu.name AS client_name, eu.name AS employee_name
      FROM jobs j
      LEFT JOIN flats f ON f.id = j.flat_id
      LEFT JOIN users cu ON cu.id = j.client_user_id
      LEFT JOIN users eu ON eu.id = j.employee_user_id
      WHERE j.status = 'completed'
        AND COALESCE(j.requested_date, substr(j.finished_at, 1, 10)) >= ?
        AND COALESCE(j.requested_date, substr(j.finished_at, 1, 10)) <= ?
    `).all(periodFrom, periodTo);

    let invoicesGenerated = 0;
    let payrollsGenerated = 0;

    if (type === 'invoice') {
      const jobsByClientGroup = {};
      jobs.forEach(j => {
        if (!j.invoice_id) {
          if (targetId && targetId !== 'all' && String(j.client_user_id) !== String(targetId)) return;
          const groupKey = `${j.client_user_id}::${j.city || 'Automático'}`;
          if (!jobsByClientGroup[groupKey]) jobsByClientGroup[groupKey] = [];
          jobsByClientGroup[groupKey].push(j);
        }
      });
      for (const [groupKey, clientJobs] of Object.entries(jobsByClientGroup)) {
        const [clientId, cityGroup] = groupKey.split('::');
        const invoiceGroup = cityGroup === 'Automático' ? 'Automático' : cityGroup;
        const totalAmount = clientJobs.reduce((s, j) => s + (j.client_amount || 0), 0);
        if (totalAmount <= 0) continue;
        const inv = db.prepare('INSERT INTO invoices (client_user_id, period_from, period_to, total_amount, invoice_group, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(clientId, periodFrom, periodTo, totalAmount, invoiceGroup, now);
        clientJobs.forEach(j => {
          db.prepare('UPDATE jobs SET invoice_id = ? WHERE id = ?').run(inv.lastInsertRowid, j.id);
        });
        invoicesGenerated++;
      }
    } else if (type === 'payroll') {
      const targetClientId = body.targetClientId;
      const jobsByEmployee = {};
      jobs.forEach(j => {
        if (!j.payroll_id && j.employee_user_id) {
          if (targetId && targetId !== 'all' && String(j.employee_user_id) !== String(targetId)) return;
          if (targetClientId && targetClientId !== 'all') {
            const allowedClients = Array.isArray(targetClientId) ? targetClientId : [String(targetClientId)];
            if (!allowedClients.includes(String(j.client_user_id))) return;
          }
          
          const groupKey = groupByClient ? `${j.employee_user_id}::${j.client_user_id}` : `${j.employee_user_id}`;
          if (!jobsByEmployee[groupKey]) jobsByEmployee[groupKey] = [];
          jobsByEmployee[groupKey].push(j);
        }
      });
      for (const [groupKey, empJobs] of Object.entries(jobsByEmployee)) {
        const parts = groupKey.split('::');
        const employeeId = parts[0];
        const clientId = parts[1] || null;
        
        const totalAmount = empJobs.reduce((s, j) => s + (j.employee_amount || 0), 0);
        if (totalAmount <= 0) continue;
        const pr = db.prepare('INSERT INTO payrolls (employee_user_id, client_user_id, period_from, period_to, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(employeeId, clientId, periodFrom, periodTo, totalAmount, now);
        empJobs.forEach(j => {
          db.prepare('UPDATE jobs SET payroll_id = ? WHERE id = ?').run(pr.lastInsertRowid, j.id);
        });
        payrollsGenerated++;
      }
    }

    return sendJson(res, 201, { invoicesGenerated, payrollsGenerated });
  }

  if (requestUrl.pathname === '/api/finance/summary' && req.method === 'GET') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const invoices = db.prepare(`
      SELECT i.*, u.name as client_name
      FROM invoices i LEFT JOIN users u ON u.id = i.client_user_id
      ORDER BY i.created_at DESC
    `).all();
    const payrolls = db.prepare(`
      SELECT p.*, u.name as employee_name, cu.name as client_name
      FROM payrolls p 
      LEFT JOIN users u ON u.id = p.employee_user_id
      LEFT JOIN users cu ON cu.id = p.client_user_id
      ORDER BY p.created_at DESC
    `).all();
    
    invoices.forEach(i => {
      i.jobs = db.prepare('SELECT j.*, f.address as flat_address FROM jobs j LEFT JOIN flats f ON f.id = j.flat_id WHERE j.invoice_id = ?').all(i.id);
      i.extras = safeJsonParse(i.extras_json) || [];
    });
    payrolls.forEach(p => {
      p.jobs = db.prepare('SELECT j.*, f.address as flat_address, cu.name as client_name FROM jobs j LEFT JOIN flats f ON f.id = j.flat_id LEFT JOIN users cu ON cu.id = j.client_user_id WHERE j.payroll_id = ?').all(p.id);
      p.extras = safeJsonParse(p.extras_json) || [];
    });

    return sendJson(res, 200, { invoices, payrolls });
  }

  if (requestUrl.pathname === '/api/dashboard/stats' && req.method === 'GET') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const jobs = db.prepare(`
      SELECT j.*,
        cu.name AS client_name,
        eu.name AS employee_name
      FROM jobs j
      LEFT JOIN users cu ON cu.id = j.client_user_id
      LEFT JOIN users eu ON eu.id = j.employee_user_id
      WHERE j.status = 'completed'
    `).all();
    return sendJson(res, 200, { jobs });
  }

  if (requestUrl.pathname === '/api/finance/payrolls/mine' && req.method === 'GET') {
    if (!['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(session.user.role)) return sendJson(res, 403, { error: 'Apenas funcionarios e gerência.' });
    const month = requestUrl.searchParams.get('month');
    let query = 'SELECT * FROM payrolls WHERE employee_user_id = ?';
    const params = [session.user.id];
    if (month) {
      query += ' AND period_from LIKE ?';
      params.push(month + '%');
    }
    query += ' ORDER BY created_at DESC LIMIT 1';
    
    const payroll = db.prepare(query).get(...params);
    if (!payroll) {
      return sendJson(res, 200, { entries: [], totalHours: 0, totalAmount: 0 });
    }
    
    const jobs = db.prepare(`
      SELECT j.*, f.address as flatAddress, f.full_address as flat_full_address, f.access_code as flat_access_code, j.duration_hours as durationHours, j.employee_amount as employeeAmount, j.finished_at as date 
      FROM jobs j 
      LEFT JOIN flats f ON f.id = j.flat_id 
      WHERE j.payroll_id = ? 
      ORDER BY j.finished_at ASC
    `).all(payroll.id);
    
    let totalHours = 0;
    jobs.forEach(j => totalHours += (j.durationHours || 0));
    
    return sendJson(res, 200, { 
      entries: jobs,
      totalHours,
      totalAmount: payroll.total_amount
    });
  }

  if (requestUrl.pathname === '/api/finance/invoices/mine' && req.method === 'GET') {
    if (session.user.role !== 'client' && session.user.role !== 'client_user') return sendJson(res, 403, { error: 'Apenas clientes.' });
    const targetClientId = session.user.role === 'client_user' ? session.user.parent_client_id : session.user.id;
    const invoices = db.prepare('SELECT * FROM invoices WHERE client_user_id = ? ORDER BY created_at DESC').all(targetClientId);
    invoices.forEach(i => {
      i.jobs = db.prepare('SELECT j.*, f.address as flat_address FROM jobs j LEFT JOIN flats f ON f.id = j.flat_id WHERE j.invoice_id = ? ORDER BY j.finished_at ASC').all(i.id);
    });
    return sendJson(res, 200, { invoices });
  }

  // ── Edit Invoice Number ──
  const matchFinanceInvoiceNumber = requestUrl.pathname.match(/^\/api\/finance\/invoices\/(\d+)\/number$/);
  if (matchFinanceInvoiceNumber && req.method === 'PATCH') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const invoiceId = Number(matchFinanceInvoiceNumber[1]);
    const body = await parseBody(req);
    const invoiceNumber = body.invoiceNumber || null;
    
    db.prepare('UPDATE invoices SET invoice_number = ? WHERE id = ?').run(invoiceNumber, invoiceId);
    return sendJson(res, 200, { success: true });
  }

  // ── Edit Finance Jobs ──
  const matchFinanceInvoiceJob = requestUrl.pathname.match(/^\/api\/finance\/invoices\/(\d+)\/jobs\/(\d+)$/);
  if (matchFinanceInvoiceJob && req.method === 'PATCH') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const invoiceId = Number(matchFinanceInvoiceJob[1]);
    const jobId = Number(matchFinanceInvoiceJob[2]);
    const body = await parseBody(req);
    
    db.prepare('UPDATE jobs SET client_amount = ?, duration_hours = ? WHERE id = ? AND invoice_id = ?')
      .run(Number(body.clientAmount) || 0, Number(body.durationHours) || 0, jobId, invoiceId);
      
    const total = db.prepare('SELECT SUM(client_amount) as total FROM jobs WHERE invoice_id = ?').get(invoiceId).total || 0;
    db.prepare('UPDATE invoices SET total_amount = ? WHERE id = ?').run(total, invoiceId);
    
    return sendJson(res, 200, { success: true, newTotal: total });
  }

  const matchFinancePayrollJob = requestUrl.pathname.match(/^\/api\/finance\/payrolls\/(\d+)\/jobs\/(\d+)$/);
  if (matchFinancePayrollJob && req.method === 'PATCH') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const payrollId = Number(matchFinancePayrollJob[1]);
    const jobId = Number(matchFinancePayrollJob[2]);
    const body = await parseBody(req);
    
    db.prepare('UPDATE jobs SET employee_amount = ?, duration_hours = ? WHERE id = ? AND payroll_id = ?')
      .run(Number(body.employeeAmount) || 0, Number(body.durationHours) || 0, jobId, payrollId);
      
    const totalJobs = db.prepare('SELECT SUM(employee_amount) as total FROM jobs WHERE payroll_id = ?').get(payrollId).total || 0;
    const payroll = db.prepare('SELECT extras_json FROM payrolls WHERE id = ?').get(payrollId);
    const extras = safeJsonParse(payroll.extras_json) || [];
    const totalExtras = extras.reduce((sum, e) => sum + Number(e.total || 0), 0);
    const total = totalJobs + totalExtras;
    db.prepare('UPDATE payrolls SET total_amount = ? WHERE id = ?').run(total, payrollId);
    
    return sendJson(res, 200, { success: true, newTotal: total });
  }

  // ── Edit Finance Extras ──
  const matchFinanceInvoiceExtra = requestUrl.pathname.match(/^\/api\/finance\/invoices\/(\d+)\/extras$/);
  if (matchFinanceInvoiceExtra && req.method === 'POST') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const invoiceId = Number(matchFinanceInvoiceExtra[1]);
    const body = await parseBody(req);
    const invoice = db.prepare('SELECT extras_json FROM invoices WHERE id = ?').get(invoiceId);
    const extras = safeJsonParse(invoice.extras_json) || [];
    extras.push({ description: body.description, quantity: Number(body.quantity), unitPrice: Number(body.unitPrice), total: Number(body.total) });
    db.prepare('UPDATE invoices SET extras_json = ? WHERE id = ?').run(JSON.stringify(extras), invoiceId);
    
    const totalJobs = db.prepare('SELECT SUM(client_amount) as total FROM jobs WHERE invoice_id = ?').get(invoiceId).total || 0;
    const totalExtras = extras.reduce((sum, e) => sum + Number(e.total || 0), 0);
    const total = totalJobs + totalExtras;
    db.prepare('UPDATE invoices SET total_amount = ? WHERE id = ?').run(total, invoiceId);
    return sendJson(res, 200, { success: true, newTotal: total, extras });
  }

  const matchFinanceInvoiceExtraDel = requestUrl.pathname.match(/^\/api\/finance\/invoices\/(\d+)\/extras\/(\d+)$/);
  if (matchFinanceInvoiceExtraDel && req.method === 'DELETE') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const invoiceId = Number(matchFinanceInvoiceExtraDel[1]);
    const index = Number(matchFinanceInvoiceExtraDel[2]);
    const invoice = db.prepare('SELECT extras_json FROM invoices WHERE id = ?').get(invoiceId);
    const extras = safeJsonParse(invoice.extras_json) || [];
    extras.splice(index, 1);
    db.prepare('UPDATE invoices SET extras_json = ? WHERE id = ?').run(JSON.stringify(extras), invoiceId);
    
    const totalJobs = db.prepare('SELECT SUM(client_amount) as total FROM jobs WHERE invoice_id = ?').get(invoiceId).total || 0;
    const totalExtras = extras.reduce((sum, e) => sum + Number(e.total || 0), 0);
    const total = totalJobs + totalExtras;
    db.prepare('UPDATE invoices SET total_amount = ? WHERE id = ?').run(total, invoiceId);
    return sendJson(res, 200, { success: true, newTotal: total, extras });
  }

  const matchFinancePayrollExtra = requestUrl.pathname.match(/^\/api\/finance\/payrolls\/(\d+)\/extras$/);
  if (matchFinancePayrollExtra && req.method === 'POST') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const payrollId = Number(matchFinancePayrollExtra[1]);
    const body = await parseBody(req);
    const payroll = db.prepare('SELECT extras_json FROM payrolls WHERE id = ?').get(payrollId);
    const extras = safeJsonParse(payroll.extras_json) || [];
    extras.push({ description: body.description, quantity: Number(body.quantity), unitPrice: Number(body.unitPrice), total: Number(body.total) });
    db.prepare('UPDATE payrolls SET extras_json = ? WHERE id = ?').run(JSON.stringify(extras), payrollId);
    
    const totalJobs = db.prepare('SELECT SUM(employee_amount) as total FROM jobs WHERE payroll_id = ?').get(payrollId).total || 0;
    const totalExtras = extras.reduce((sum, e) => sum + Number(e.total || 0), 0);
    const total = totalJobs + totalExtras;
    db.prepare('UPDATE payrolls SET total_amount = ? WHERE id = ?').run(total, payrollId);
    return sendJson(res, 200, { success: true, newTotal: total, extras });
  }

  const matchFinancePayrollExtraDel = requestUrl.pathname.match(/^\/api\/finance\/payrolls\/(\d+)\/extras\/(\d+)$/);
  if (matchFinancePayrollExtraDel && req.method === 'DELETE') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const payrollId = Number(matchFinancePayrollExtraDel[1]);
    const index = Number(matchFinancePayrollExtraDel[2]);
    const payroll = db.prepare('SELECT extras_json FROM payrolls WHERE id = ?').get(payrollId);
    const extras = safeJsonParse(payroll.extras_json) || [];
    extras.splice(index, 1);
    db.prepare('UPDATE payrolls SET extras_json = ? WHERE id = ?').run(JSON.stringify(extras), payrollId);
    
    const totalJobs = db.prepare('SELECT SUM(employee_amount) as total FROM jobs WHERE payroll_id = ?').get(payrollId).total || 0;
    const totalExtras = extras.reduce((sum, e) => sum + Number(e.total || 0), 0);
    const total = totalJobs + totalExtras;
    db.prepare('UPDATE payrolls SET total_amount = ? WHERE id = ?').run(total, payrollId);
    return sendJson(res, 200, { success: true, newTotal: total, extras });
  }

  const matchFinanceInvoiceDel = requestUrl.pathname.match(/^\/api\/finance\/invoices\/(\d+)$/);
  if (matchFinanceInvoiceDel && req.method === 'DELETE') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const invoiceId = Number(matchFinanceInvoiceDel[1]);
    const info = db.prepare('SELECT id FROM invoices WHERE id = ?').get(invoiceId);
    if (!info) return sendJson(res, 404, { error: 'Fatura nao encontrada.' });
    db.prepare('UPDATE jobs SET invoice_id = NULL, invoice_sent = 0 WHERE invoice_id = ?').run(invoiceId);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(invoiceId);
    return sendJson(res, 200, { success: true });
  }

  const matchFinancePayrollDel = requestUrl.pathname.match(/^\/api\/finance\/payrolls\/(\d+)$/);
  if (matchFinancePayrollDel && req.method === 'DELETE') {
    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
    const payrollId = Number(matchFinancePayrollDel[1]);
    const info = db.prepare('SELECT id FROM payrolls WHERE id = ?').get(payrollId);
    if (!info) return sendJson(res, 404, { error: 'Holerite nao encontrado.' });
    db.prepare('UPDATE jobs SET payroll_id = NULL WHERE payroll_id = ?').run(payrollId);
    db.prepare('DELETE FROM payrolls WHERE id = ?').run(payrollId);
    return sendJson(res, 200, { success: true });
  }

  // ── Operations State ──
  if (requestUrl.pathname === '/api/operations/state' && req.method === 'GET') {
    return sendJson(res, 200, getOperationsState());
  }
  if (requestUrl.pathname === '/api/operations/state' && req.method === 'PUT') {
    if (!ensureRole(session.user, ['superadmin', 'manager', 'analyst'], res)) return;
    const body = await parseBody(req);
    const nextState = sanitizeOperationsState(body);
    saveOperationsState(nextState);
    return sendJson(res, 200, getOperationsState());
  }

  // ── Records (per-client) ──
  const match = requestUrl.pathname.match(/^\/api\/clients\/(\d+)(?:\/(.*))?$/);
  if (!match) return sendJson(res, 404, { error: 'Rota nao encontrada.' });
  const clientId = Number(match[1]);
  const subPath = match[2] || '';
  if (!canAccessClient(session.user, clientId)) return sendJson(res, 403, { error: 'Voce nao tem acesso a este cliente.' });

  if (subPath === 'config' && req.method === 'GET') return sendJson(res, 200, getClientConfig(clientId));
  if (subPath === 'fields' && req.method === 'POST') {
    if (!ensureRole(session.user, ['superadmin', 'manager'], res)) return;
    const body = await parseBody(req);
    const next = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS nextPosition FROM fields WHERE client_id = ?').get(clientId).nextPosition;
    db.prepare('INSERT INTO fields (client_id, field_key, label, field_type, required, position) VALUES (?, ?, ?, ?, ?, ?)').run(clientId, slugify(body.fieldKey || body.label || `campo-${Date.now()}`), body.label || 'Novo campo', normalizeFieldType(body.fieldType), body.required ? 1 : 0, next);
    return sendJson(res, 201, getClientConfig(clientId));
  }
  if (subPath === 'statuses' && req.method === 'POST') {
    if (!ensureRole(session.user, ['superadmin', 'manager'], res)) return;
    const body = await parseBody(req);
    const next = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS nextPosition FROM statuses WHERE client_id = ?').get(clientId).nextPosition;
    db.prepare('INSERT INTO statuses (client_id, status_key, label, color, position) VALUES (?, ?, ?, ?, ?)').run(clientId, slugify(body.statusKey || body.label || `status-${Date.now()}`), body.label || 'Novo status', body.color || '#5B8DEF', next);
    return sendJson(res, 201, getClientConfig(clientId));
  }
  if (subPath === 'records' && req.method === 'GET') {
    const filters = {
      search: requestUrl.searchParams.get('search') || '',
      status: requestUrl.searchParams.get('status') || '',
      sort: sanitizeSortColumn(requestUrl.searchParams.get('sort')),
      direction: sanitizeDirection(requestUrl.searchParams.get('direction')),
      filterField: requestUrl.searchParams.get('filterField') || '',
      filterValue: requestUrl.searchParams.get('filterValue') || '',
    };
    return sendJson(res, 200, { records: listRecords(clientId, filters), config: getClientConfig(clientId) });
  }
  if (subPath === 'records' && req.method === 'POST') {
    if (!ensureRole(session.user, ['superadmin', 'manager', 'analyst'], res)) return;
    const body = await parseBody(req);
    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO records (client_id, title, status_key, payload_json, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(clientId, body.title || 'Novo registro', body.statusKey || 'novo', JSON.stringify(body.payload || {}), session.user.id, session.user.id, now, now);
    const created = db.prepare('SELECT * FROM records WHERE id = ?').get(result.lastInsertRowid);
    insertAuditLog(clientId, created.id, session.user.id, 'create', hydrateRecord(created));
    return sendJson(res, 201, { record: hydrateRecord(created) });
  }
  if (subPath === 'import' && req.method === 'POST') {
    if (!ensureRole(session.user, ['superadmin', 'manager', 'analyst'], res)) return;
    const body = await parseBody(req);
    const rows = parseCsv(String(body.csv || ''));
    if (!rows.length) return sendJson(res, 400, { error: 'CSV vazio ou invalido.' });
    const headers = rows[0].map((item) => item.trim());
    const config = getClientConfig(clientId);
    const knownFields = new Set(config.fields.map((f) => f.field_key));
    for (const header of headers) {
      const key = slugify(header);
      if (!['titulo', 'title', 'status'].includes(key) && !knownFields.has(key)) {
        const next = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS nextPosition FROM fields WHERE client_id = ?').get(clientId).nextPosition;
        db.prepare('INSERT INTO fields (client_id, field_key, label, field_type, required, position) VALUES (?, ?, ?, ?, ?, ?)').run(clientId, key, header, 'text', 0, next);
        knownFields.add(key);
      }
    }
    let imported = 0;
    for (const row of rows.slice(1)) {
      if (!row.some((v) => String(v || '').trim())) continue;
      let title = ''; let statusKey = config.statuses[0]?.status_key || 'novo'; const payload = {};
      headers.forEach((header, index) => {
        const key = slugify(header); const value = row[index] || '';
        if (['titulo', 'title'].includes(key)) title = value || title;
        else if (key === 'status') { statusKey = slugify(value) || statusKey; ensureStatusExists(clientId, statusKey, value || statusKey); }
        else payload[key] = value;
      });
      const now = new Date().toISOString();
      const result = db.prepare('INSERT INTO records (client_id, title, status_key, payload_json, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(clientId, title || `Registro importado ${imported + 1}`, statusKey, JSON.stringify(payload), session.user.id, session.user.id, now, now);
      const created = db.prepare('SELECT * FROM records WHERE id = ?').get(result.lastInsertRowid);
      insertAuditLog(clientId, created.id, session.user.id, 'import', hydrateRecord(created));
      imported += 1;
    }
    return sendJson(res, 200, { ok: true, imported, config: getClientConfig(clientId) });
  }
  if (subPath === 'export.csv' && req.method === 'GET') {
    const filters = { search: requestUrl.searchParams.get('search') || '', status: requestUrl.searchParams.get('status') || '', sort: sanitizeSortColumn(requestUrl.searchParams.get('sort')), direction: sanitizeDirection(requestUrl.searchParams.get('direction')), filterField: requestUrl.searchParams.get('filterField') || '', filterValue: requestUrl.searchParams.get('filterValue') || '' };
    const config = getClientConfig(clientId);
    const records = listRecords(clientId, filters);
    const headers = ['title', 'status', ...config.fields.map((f) => f.field_key), 'updated_at'];
    const lines = [headers.map(csvEscape).join(',')];
    for (const record of records) {
      lines.push([record.title, record.status_key, ...config.fields.map((f) => record.payload[f.field_key] ?? ''), record.updated_at].map(csvEscape).join(','));
    }
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="export-cliente-${clientId}.csv"`, 'Cache-Control': 'no-store' });
    return res.end(lines.join('\n'));
  }
  const recordMatch = subPath.match(/^records\/(\d+)(?:\/(history))?$/);
  if (recordMatch) {
    const recordId = Number(recordMatch[1]); const tail = recordMatch[2] || '';
    if (tail === 'history' && req.method === 'GET') {
      const history = db.prepare('SELECT l.*, u.name AS user_name FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id WHERE l.client_id = ? AND l.record_id = ? ORDER BY l.created_at DESC').all(clientId, recordId).map((item) => ({ ...item, snapshot: safeJsonParse(item.snapshot_json) }));
      return sendJson(res, 200, { history });
    }
    if (req.method === 'PUT') {
      if (!ensureRole(session.user, ['superadmin', 'manager', 'analyst'], res)) return;
      const existing = db.prepare('SELECT * FROM records WHERE id = ? AND client_id = ?').get(recordId, clientId);
      if (!existing) return sendJson(res, 404, { error: 'Registro nao encontrado.' });
      const body = await parseBody(req);
      const now = new Date().toISOString();
      db.prepare('UPDATE records SET title = ?, status_key = ?, payload_json = ?, updated_by = ?, updated_at = ? WHERE id = ? AND client_id = ?').run(body.title || existing.title, body.statusKey || existing.status_key, JSON.stringify(body.payload || {}), session.user.id, now, recordId, clientId);
      const updated = db.prepare('SELECT * FROM records WHERE id = ?').get(recordId);
      insertAuditLog(clientId, recordId, session.user.id, 'update', { before: hydrateRecord(existing), after: hydrateRecord(updated) });
      return sendJson(res, 200, { record: hydrateRecord(updated) });
    }
    if (req.method === 'DELETE') {
      if (!ensureRole(session.user, ['superadmin', 'manager', 'analyst'], res)) return;
      const existing = db.prepare('SELECT * FROM records WHERE id = ? AND client_id = ?').get(recordId, clientId);
      if (!existing) return sendJson(res, 404, { error: 'Registro nao encontrado.' });
      db.prepare('DELETE FROM records WHERE id = ? AND client_id = ?').run(recordId, clientId);
      insertAuditLog(clientId, recordId, session.user.id, 'delete', hydrateRecord(existing));
      return sendNoContent(res);
    }
  }
  return sendJson(res, 404, { error: 'Rota de cliente nao encontrada.' });
}

// ─── Print Routes ─────────────────────────────────────────────────────────────
async function handlePrintRequest(req, res, requestUrl) {
  const session = getSession(req);
  if (!session) {
    res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('Sessao expirada.');
    return;
  }

  // ── Print Invoice ──
  const printInvoiceMatch = requestUrl.pathname.match(/^\/print\/invoice\/(\d+)$/);
  if (printInvoiceMatch && req.method === 'GET') {
    if (session.user.role !== 'client' && session.user.role !== 'client_user' && !isAdminRole(session.user.role) && session.user.role !== 'viewer') {
      res.writeHead(403);
      return res.end('Acesso negado.');
    }
    const invoiceId = Number(printInvoiceMatch[1]);
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!invoice) {
      res.writeHead(404);
      return res.end('Fatura nao encontrada.');
    }
    
    if (session.user.role === 'client' || session.user.role === 'client_user') {
      const targetClientId = session.user.role === 'client_user' ? session.user.parent_client_id : session.user.id;
      if (String(invoice.client_user_id) !== String(targetClientId)) {
        res.writeHead(403);
        return res.end('Acesso negado.');
      }
    }
    const client = db.prepare('SELECT * FROM users WHERE id = ?').get(invoice.client_user_id) || {};
    const jobs = db.prepare('SELECT j.*, f.address as flat_address, f.billing_type as flat_billing_type FROM jobs j LEFT JOIN flats f ON f.id = j.flat_id WHERE j.invoice_id = ? ORDER BY j.finished_at ASC').all(invoice.id);
    const config = db.prepare('SELECT * FROM config LIMIT 1').get() || {};
    
    const html = renderInvoiceHtml(invoice, jobs, client, config);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // ── Print Payslip ──
  const printPayslipMatch = requestUrl.pathname.match(/^\/print\/payslip\/(\d+|mine)$/);
  if (printPayslipMatch && req.method === 'GET') {
    const isMine = printPayslipMatch[1] === 'mine';
    const month = requestUrl.searchParams.get('month'); // YYYY-MM
    let employeeId;

    if (isMine) {
      if (session.user.role !== 'employee') {
        res.writeHead(403);
        return res.end('Acesso negado.');
      }
      employeeId = session.user.id;
    } else {
      if (!isAdminRole(session.user.role) && session.user.role !== 'viewer') {
        res.writeHead(403);
        return res.end('Sem permissao.');
      }
      employeeId = Number(printPayslipMatch[1]);
    }

    let query = 'SELECT * FROM payrolls WHERE employee_user_id = ?';
    const params = [employeeId];
    if (month) {
      query += ' AND period_from LIKE ?';
      params.push(month + '%');
    } else if (!isMine) {
      // If it's a specific ID and not mine, the ID is actually the payroll ID, not employee ID!
      const payrollId = Number(printPayslipMatch[1]);
      const payroll = db.prepare('SELECT p.*, u.name as employee_name, u.email as employee_email, cu.name as client_name FROM payrolls p LEFT JOIN users u ON u.id = p.employee_user_id LEFT JOIN users cu ON cu.id = p.client_user_id WHERE p.id = ?').get(payrollId);
      if (!payroll) {
        res.writeHead(404);
        return res.end('Holerite nao encontrado.');
      }
      const jobs = db.prepare('SELECT j.*, f.address as flat_address, cu.name as client_name FROM jobs j LEFT JOIN flats f ON f.id = j.flat_id LEFT JOIN users cu ON cu.id = j.client_user_id WHERE j.payroll_id = ? ORDER BY j.finished_at ASC').all(payroll.id);
      const employee = db.prepare('SELECT * FROM users WHERE id = ?').get(payroll.employee_user_id) || {};
      const html = renderPayslipHtml(payroll, jobs, employee);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 1';
    
    const payroll = db.prepare(query).get(...params);
    if (!payroll) {
      res.writeHead(404);
      return res.end('Holerite nao encontrado para o periodo.');
    }
    
    const jobs = db.prepare('SELECT j.*, f.address as flat_address FROM jobs j LEFT JOIN flats f ON f.id = j.flat_id WHERE j.payroll_id = ? ORDER BY j.finished_at ASC').all(payroll.id);
    const employee = db.prepare('SELECT * FROM users WHERE id = ?').get(payroll.employee_user_id) || {};
    const html = renderPayslipHtml(payroll, jobs, employee);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }



  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Rota nao encontrada.');
}

// ─── Business Logic ───────────────────────────────────────────────────────────
function buildJobPayslip(employeeId, month) {
  const employee = db.prepare('SELECT * FROM users WHERE id = ?').get(employeeId);
  if (!employee) return { employee: null, entries: [], totalHours: 0, totalAmount: 0, period: month };

  // month format: YYYY-MM
  const [year, mon] = (month || currentMonthParam()).split('-');
  const fromDate = `${year}-${mon}-01`;
  const toDate = `${year}-${mon}-31`;

  const jobs = db.prepare(`
    SELECT j.*, f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code
    FROM jobs j
    LEFT JOIN flats f ON f.id = j.flat_id
    WHERE j.employee_user_id = ? AND j.status = 'completed'
      AND COALESCE(j.requested_date, substr(j.finished_at, 1, 10)) >= ?
      AND COALESCE(j.requested_date, substr(j.finished_at, 1, 10)) <= ?
    ORDER BY j.finished_at ASC
  `).all(employeeId, fromDate, toDate);

  const entries = jobs.map((j) => ({
    jobId: j.id,
    flatAddress: j.flat_address || '-',
    date: j.finished_at ? j.finished_at.slice(0, 10) : (j.requested_date || '-'),
    durationHours: Number(j.duration_hours || 0),
    employeeAmount: Number(j.employee_amount || 0),
  }));

  const totalHours = roundCurrency(entries.reduce((s, e) => s + e.durationHours, 0));
  const totalAmount = roundCurrency(entries.reduce((s, e) => s + e.employeeAmount, 0));

  return {
    employee: { id: employee.id, name: employee.name, email: employee.email, hourlyRate: Number(employee.hourly_rate || 0) },
    entries,
    totalHours,
    totalAmount,
    period: month,
  };
}

function buildClientInvoice(clientId, month) {
  const client = db.prepare('SELECT * FROM users WHERE id = ?').get(clientId);
  if (!client) return { client: null, entries: [], totalAmount: 0, period: month };

  const [year, mon] = (month || currentMonthParam()).split('-');
  const fromDate = `${year}-${mon}-01`;
  const toDate = `${year}-${mon}-31`;

  const jobs = db.prepare(`
    SELECT j.*, f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code
    FROM jobs j
    LEFT JOIN flats f ON f.id = j.flat_id
    WHERE j.client_user_id = ? AND j.status = 'completed'
      AND COALESCE(j.requested_date, substr(j.finished_at, 1, 10)) >= ?
      AND COALESCE(j.requested_date, substr(j.finished_at, 1, 10)) <= ?
    ORDER BY j.finished_at ASC
  `).all(clientId, fromDate, toDate);

  const grouped = {};
  jobs.forEach(j => {
    const date = j.requested_date || j.finished_at?.slice(0, 10) || '-';
    const key = `${j.flat_id}_${date}`;
    if (!grouped[key]) {
      grouped[key] = {
        jobId: j.id,
        flatAddress: j.flat_address || '-',
        date: date,
        durationHours: 0,
        clientAmount: 0
      };
    }
    grouped[key].durationHours += Number(j.duration_hours || 0);
    grouped[key].clientAmount += Number(j.client_amount || 0);
  });

  const entries = Object.values(grouped);
  const totalAmount = roundCurrency(entries.reduce((s, e) => s + e.clientAmount, 0));

  return {
    client: { id: client.id, name: client.name, email: client.email },
    entries,
    totalAmount,
    period: month,
  };
}

function buildFinancialReport(from, to) {
  let sql = `SELECT j.*, f.address AS flat_address, f.full_address AS flat_full_address, f.access_code AS flat_access_code, cu.name AS client_name, eu.name AS employee_name
    FROM jobs j
    LEFT JOIN flats f ON f.id = j.flat_id
    LEFT JOIN users cu ON cu.id = j.client_user_id
    LEFT JOIN users eu ON eu.id = j.employee_user_id
    WHERE j.status = 'completed'`;
  const params = [];
  if (from) { sql += ' AND COALESCE(j.requested_date, substr(j.finished_at, 1, 10)) >= ?'; params.push(from); }
  if (to) { sql += ' AND COALESCE(j.requested_date, substr(j.finished_at, 1, 10)) <= ?'; params.push(to); }
  const jobs = db.prepare(sql).all(...params);

  const totalRevenue = roundCurrency(jobs.reduce((s, j) => s + Number(j.client_amount || 0), 0));
  const totalPayroll = roundCurrency(jobs.reduce((s, j) => s + Number(j.employee_amount || 0), 0));
  const margin = roundCurrency(totalRevenue - totalPayroll);
  const marginPct = totalRevenue > 0 ? roundCurrency((margin / totalRevenue) * 100) : 0;

  // By employee
  const byEmployee = {};
  jobs.forEach((j) => {
    const key = j.employee_name || 'N/A';
    if (!byEmployee[key]) byEmployee[key] = { name: key, jobs: 0, hours: 0, amount: 0 };
    byEmployee[key].jobs += 1;
    byEmployee[key].hours = roundCurrency(byEmployee[key].hours + Number(j.duration_hours || 0));
    byEmployee[key].amount = roundCurrency(byEmployee[key].amount + Number(j.employee_amount || 0));
  });

  // By client
  const byClient = {};
  jobs.forEach((j) => {
    const key = j.client_name || 'N/A';
    if (!byClient[key]) byClient[key] = { name: key, jobs: 0, revenue: 0 };
    byClient[key].jobs += 1;
    byClient[key].revenue = roundCurrency(byClient[key].revenue + Number(j.client_amount || 0));
  });

  return {
    totalRevenue, totalPayroll, margin, marginPct,
    byEmployee: Object.values(byEmployee).sort((a, b) => b.amount - a.amount),
    byClient: Object.values(byClient).sort((a, b) => b.revenue - a.revenue),
    jobCount: jobs.length,
  };
}

function hydrateJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    flatId: row.flat_id,
    flatAddress: row.flat_address || '',
    flatFullAddress: row.flat_full_address || '',
    flatAccessCode: row.flat_access_code || '',
    flatBillingType: row.flat_billing_type || 'hourly',
    flatHourlyRate: Number(row.flat_hourly_rate || 0),
    flatProjectRate: Number(row.flat_project_rate || 0),
    clientUserId: row.client_user_id,
    clientName: row.client_name || '',
    clientEmail: row.client_email || '',
    employeeUserId: row.employee_user_id,
    employeeName: row.employee_name || '',
    employeeEmail: row.employee_email || '',
    status: row.status,
    requestedDate: row.requested_date,
    notes: row.notes || '',
    employeeNotes: row.employee_notes || '',
    startedAt: row.started_at || null,
    finishedAt: row.finished_at || null,
    durationHours: row.duration_hours !== null && row.duration_hours !== undefined ? Number(row.duration_hours) : null,
    clientAmount: row.client_amount !== null && row.client_amount !== undefined ? Number(row.client_amount) : null,
    employeeAmount: row.employee_amount !== null && row.employee_amount !== undefined ? Number(row.employee_amount) : null,
    invoiceSent: Boolean(row.invoice_sent),
    isHoliday: Boolean(row.is_holiday),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Multipart Upload Parser ─────────────────────────────────────────────────
async function parseMultipart(req, uploadDir) {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) throw new Error('Requisicao nao e multipart/form-data valida.');
  const boundary = '--' + boundaryMatch[1].trim();

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  if (buffer.length > MAX_PHOTO_SIZE + 65536) throw new Error('Arquivo muito grande. Maximo: 15MB.');

  const boundaryBuf = Buffer.from(boundary);
  const parts = [];
  let start = 0;

  while (start < buffer.length) {
    const bStart = buffer.indexOf(boundaryBuf, start);
    if (bStart === -1) break;
    const headerStart = bStart + boundaryBuf.length;
    if (buffer[headerStart] === 45 && buffer[headerStart + 1] === 45) break; // '--'
    // Skip CRLF after boundary
    const headerContentStart = (buffer[headerStart] === 13 && buffer[headerStart + 1] === 10) ? headerStart + 2 : headerStart;
    const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), headerContentStart);
    if (headerEnd === -1) break;
    const headerStr = buffer.slice(headerContentStart, headerEnd).toString('utf8');
    const nextBoundary = buffer.indexOf(boundaryBuf, headerEnd + 4);
    const contentEnd = nextBoundary !== -1 ? nextBoundary - 2 : buffer.length; // -2 for CRLF
    const content = buffer.slice(headerEnd + 4, contentEnd);

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const ctMatch = headerStr.match(/Content-Type:\s*(.+)/i);

    parts.push({
      name: nameMatch ? nameMatch[1] : '',
      filename: filenameMatch ? filenameMatch[1] : null,
      contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
      content,
    });
    start = nextBoundary !== -1 ? nextBoundary : buffer.length;
  }

  const filePart = parts.find((p) => p.filename && p.name === 'photo');
  if (!filePart) throw new Error('Campo "photo" nao encontrado no upload.');
  if (filePart.content.length > MAX_PHOTO_SIZE) throw new Error('Arquivo muito grande. Maximo: 15MB.');

  const detectedType = filePart.contentType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_PHOTO_TYPES.includes(detectedType)) throw new Error('Tipo de arquivo nao permitido. Use JPEG, PNG ou WebP.');

  const ext = path.extname(filePart.filename).toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
  const filename = `photo_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${safeExt}`;
  const filePath = path.join(uploadDir, filename);
  writeFileSync(filePath, filePart.content);

  return { filename, originalName: filePart.filename };
}

// ─── Email Invoice ────────────────────────────────────────────────────────────
async function sendInvoiceEmail(job, durationHours, clientAmount) {
  const config = {};
  db.prepare('SELECT config_key, value_text FROM app_config').all().forEach((r) => { config[r.config_key] = r.value_text; });
  const smtpHost = config.smtp_host || SMTP_HOST;
  const smtpUser = config.smtp_user || SMTP_USER;
  const smtpPass = config.smtp_pass || SMTP_PASS;
  const smtpFrom = config.smtp_from || SMTP_FROM;
  const smtpPort = Number(config.smtp_port || SMTP_PORT);

  const invoiceHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:8px;">
      <h2 style="color:#c9743f;">Fantastic BnB — Invoice de Servico</h2>
      <p>Ol&aacute;, <strong>${escapeHtml(job.client_name || 'Cliente')}</strong>!</p>
      <p>O servico no flat <strong>${escapeHtml(job.flat_address || '')}</strong> foi conclu&iacute;do.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Data</td><td style="padding:8px;border-bottom:1px solid #eee;">${job.finished_at ? job.finished_at.slice(0, 10) : ''}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Flat</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(job.flat_address || '')}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Dura&ccedil;&atilde;o</td><td style="padding:8px;border-bottom:1px solid #eee;">${formatHours(durationHours)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#c9743f;">Total</td><td style="padding:8px;font-weight:bold;color:#c9743f;">${formatCurrencyGBP(clientAmount)}</td></tr>
      </table>
      <p style="color:#666;font-size:0.9em;">Obrigado por usar os servi&ccedil;os Fantastic BnB!</p>
    </div>
  `;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[Invoice Email] SMTP nao configurado. Invoice para ${job.client_email || 'N/A'}:\n  Flat: ${job.flat_address}\n  Total: ${formatCurrencyGBP(clientAmount)}\n  Duracao: ${formatHours(durationHours)}`);
    db.prepare('UPDATE jobs SET invoice_sent = 0 WHERE id = ?').run(job.id);
    return;
  }

  await sendSmtpEmail({
    host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass,
    from: smtpFrom, to: job.client_email || smtpUser,
    subject: `Invoice — Servico em ${job.flat_address}`,
    html: invoiceHtml,
  });
  db.prepare('UPDATE jobs SET invoice_sent = 1 WHERE id = ?').run(job.id);
}

async function sendSmtpEmail({ host, port, user, pass, from, to, subject, html }) {
  return new Promise(async (resolve, reject) => {
    const { createConnection } = await import('node:net');
    const tls = await import('node:tls');

    const body = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
    ].join('\r\n');

    const b64Auth = Buffer.from(`\0${user}\0${pass}`).toString('base64');

    let socket;
    let buf = '';
    const send = (line) => socket.write(line + '\r\n');

    const steps = [
      () => send(`EHLO fantastic-bnb`),
      () => send('AUTH PLAIN ' + b64Auth),
      () => send(`MAIL FROM:<${from}>`),
      () => send(`RCPT TO:<${to}>`),
      () => send('DATA'),
      () => { send(body); send('.'); },
      () => { send('QUIT'); resolve(); },
    ];
    let step = 0;
    const next = () => { if (step < steps.length) steps[step++](); };

    const connect = () => {
      if (port === 465) {
        socket = tls.connect({ host, port }, () => next());
      } else {
        socket = createConnection({ host, port }, () => next());
      }
      socket.setEncoding('utf8');
      socket.on('data', (d) => {
        buf += d;
        const lines = buf.split('\r\n');
        buf = lines.pop();
        for (const line of lines) {
          if (/^220/.test(line) && step === 0) next();
          else if (/^250|^235|^354/.test(line)) next();
          else if (/^221/.test(line)) socket.end();
          else if (/^[45]/.test(line)) reject(new Error(`SMTP error: ${line}`));
        }
      });
      socket.on('error', reject);
    };
    connect();
  });
}

function renderPayslipPrintHtml(payslip, month) {
  const rows = (payslip.entries || []).map((e) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #eee;">${escapeHtml(e.date)}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;">${escapeHtml(e.flatAddress)}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">${formatHours(e.durationHours)}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${formatCurrencyGBP(e.employeeAmount)}</td>
    </tr>
  `).join('');

  const [year, mon] = (month || currentMonthParam()).split('-');
  const monthLabel = `${mon}/${year}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Holerite — ${escapeHtml(payslip.employee?.name || '')} — ${escapeHtml(monthLabel)}</title>
  <style>
    body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { text-align: left; padding: 12px; background: #f8f8f8; border-bottom: 2px solid #ddd; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #c9743f; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Fantastic BnB</div>
      <div style="margin-top:8px;color:#666;">Holerite Mensal (Serviços Realizados)</div>
    </div>
    <div style="text-align:right;">
      <h2 style="margin:0 0 8px 0;">Referência: ${escapeHtml(monthLabel)}</h2>
      <div style="color:#666;">
        <p><strong>Funcionário:</strong> ${escapeHtml(payslip.employee?.name || 'N/A')}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(payslip.employee?.email || '')}</p>
        <p><strong>Taxa horária:</strong> ${formatCurrencyGBP(payslip.employee?.hourlyRate || 0)}/h</p>
      </div>
    </div>
    <h2>Holerite — ${escapeHtml(monthLabel)}</h2>
    <table>
      <thead>
        <tr><th>Data</th><th>Flat</th><th style="text-align:center;">Horas</th><th style="text-align:right;">Valor</th></tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="4" style="text-align:center;color:#999;">Nenhum serviço concluído neste período</td></tr>'}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="2">Total</td>
          <td style="text-align:center;">${formatHours(payslip.totalHours)}</td>
          <td style="text-align:right;">${formatCurrencyGBP(payslip.totalAmount)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="footer">Fantastic BnB Cleaning Services — fantasticbnbservices@gmail.com</div>
  </div>
  <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body>
</html>`;
}

// ─── Seed Functions ────────────────────────────────────────────────────────────
function migrateUserRoles() {
  // Recreate users table without old CHECK constraint to support employee/client roles
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (tableInfo && tableInfo.sql && tableInfo.sql.includes("CHECK(role IN") && !tableInfo.sql.includes("'employee'")) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS users_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        hourly_rate REAL NOT NULL DEFAULT 0,
        weekend_rate REAL NOT NULL DEFAULT 0,
        holiday_rate REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO users_v2 (id, name, email, role, password_hash, password_salt, hourly_rate, weekend_rate, holiday_rate, created_at)
        SELECT id, name, email, role, password_hash, password_salt, hourly_rate, weekend_rate, holiday_rate, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_v2 RENAME TO users;
      PRAGMA foreign_keys = ON;
    `);
    console.log('[Migration] users table recreated with expanded roles.');
  }
}

function seedDatabase() {
  if (db.prepare('SELECT COUNT(*) AS total FROM users').get().total > 0) return;
  const { salt, hash } = hashPassword('admin123');
  db.prepare('INSERT OR IGNORE INTO users (name, email, role, password_hash, password_salt, hourly_rate) VALUES (?, ?, ?, ?, ?, ?)').run('Luis Admin', 'admin@fantasticbnb.app', 'superadmin', hash, salt, 0);
  console.log('[Seed] Superadmin created.');
}

function seedCleanOps() {
  if (db.prepare('SELECT COUNT(*) AS total FROM flats').get().total > 0) return;

  // Create employee users
  const employees = [
    { name: 'Carol Silva', email: 'carol@fantasticbnb.app', password: 'carol123', hourlyRate: 16 },
    { name: 'Ronaldo Costa', email: 'ronaldo@fantasticbnb.app', password: 'ronaldo123', hourlyRate: 14 },
  ];
  const employeeIds = employees.map((emp) => {
    const { salt, hash } = hashPassword(emp.password);
    return db.prepare('INSERT OR IGNORE INTO users (name, email, role, password_hash, password_salt, hourly_rate) VALUES (?, ?, ?, ?, ?, ?)').run(emp.name, emp.email, 'employee', hash, salt, emp.hourlyRate).lastInsertRowid;
  });

  // Create client users
  const clientUsers = [
    { name: 'Ross James (Simply)', email: 'ross@client.fantasticbnb.app', password: 'client123' },
    { name: 'Dylan Stays', email: 'dylan@client.fantasticbnb.app', password: 'client123' },
  ];
  const clientIds = clientUsers.map((cu) => {
    const { salt, hash } = hashPassword(cu.password);
    return db.prepare('INSERT OR IGNORE INTO users (name, email, role, password_hash, password_salt, hourly_rate) VALUES (?, ?, ?, ?, ?, ?)').run(cu.name, cu.email, 'client', hash, salt, 0).lastInsertRowid;
  });

  // Create flats
  const flats = [
    { clientUserId: clientIds[0], address: 'FLAT 19, Simply Accommodation', billingType: 'hourly', hourlyRate: 17, projectRate: 0 },
    { clientUserId: clientIds[0], address: '10 NORMANDY, Simply Accommodation', billingType: 'hourly', hourlyRate: 17, projectRate: 0 },
    { clientUserId: clientIds[1], address: '8WC, Silver Maple House', billingType: 'project', hourlyRate: 0, projectRate: 65 },
  ];
  const flatIds = flats.map((f) => db.prepare('INSERT INTO flats (client_user_id, address, billing_type, hourly_rate, project_rate) VALUES (?, ?, ?, ?, ?)').run(f.clientUserId, f.address, f.billingType, f.hourlyRate, f.projectRate).lastInsertRowid);

  // Create demo jobs
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

  // Completed job (2 days ago, 2h30 duration)
  const startedAt1 = new Date(Date.now() - 2 * 86400000 - 9000000).toISOString();
  const finishedAt1 = new Date(Date.now() - 2 * 86400000 - 9000000 + 9000000).toISOString();
  db.prepare('INSERT INTO jobs (flat_id, client_user_id, employee_user_id, status, requested_date, notes, started_at, finished_at, duration_hours, client_amount, employee_amount, invoice_sent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    flatIds[0], clientIds[0], employeeIds[0], 'completed', twoDaysAgo.slice(0, 10), 'Check-out 11h', startedAt1, finishedAt1, 2.5, 42.5, 40, 0, twoDaysAgo, twoDaysAgo,
  );

  // In progress job (started yesterday)
  db.prepare('INSERT INTO jobs (flat_id, client_user_id, employee_user_id, status, requested_date, notes, started_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    flatIds[1], clientIds[0], employeeIds[1], 'in_progress', yesterday.slice(0, 10), 'Check-in às 15h', yesterday, yesterday, yesterday,
  );

  // Assigned job (pending acceptance)
  db.prepare('INSERT INTO jobs (flat_id, client_user_id, employee_user_id, status, requested_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    flatIds[2], clientIds[1], employeeIds[0], 'assigned', now.slice(0, 10), 'Limpeza pós check-out', now, now,
  );

  // Pending job (just created by client)
  db.prepare('INSERT INTO jobs (flat_id, client_user_id, status, requested_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    flatIds[0], clientIds[0], 'pending', new Date(Date.now() + 86400000).toISOString().slice(0, 10), 'Urgente — novo hóspede amanhã', now, now,
  );

  console.log('[Seed CleanOps] Demo data created.');
  console.log('[Seed CleanOps] Employee logins: carol@fantasticbnb.app / carol123 | ronaldo@fantasticbnb.app / ronaldo123');
  console.log('[Seed CleanOps] Client logins: ross@client.fantasticbnb.app / client123 | dylan@client.fantasticbnb.app / client123');
}

function syncClientCatalog() {
  const current = db.prepare('SELECT * FROM clients ORDER BY id').all();
  DEFAULT_CLIENT_CATALOG.forEach((catalogClient, index) => {
    const existing = current[index];
    if (existing) {
      // Only update segment, never overwrite name/slug that may have been customized
      db.prepare('UPDATE clients SET segment = ? WHERE id = ? AND name = ? AND slug = ?').run(catalogClient.segment, existing.id, catalogClient.name, catalogClient.slug);
      return;
    }
    const result = db.prepare('INSERT INTO clients (name, slug, segment) VALUES (?, ?, ?)').run(catalogClient.name, catalogClient.slug, catalogClient.segment);
    createDefaultClientConfig(result.lastInsertRowid);
    db.prepare('INSERT OR IGNORE INTO user_clients (user_id, client_id) SELECT id, ? FROM users WHERE role = ?').run(result.lastInsertRowid, 'superadmin');
  });
}

function createDefaultClientConfig(clientId) {
  [['novo', 'Novo', '#77B6EA'], ['em-andamento', 'Em andamento', '#FFB347'], ['concluido', 'Concluido', '#34C38F'], ['bloqueado', 'Bloqueado', '#F25F5C']].forEach((item, index) => db.prepare('INSERT INTO statuses (client_id, status_key, label, color, position) VALUES (?, ?, ?, ?, ?)').run(clientId, item[0], item[1], item[2], index));
  [['responsavel', 'Responsavel', 'text'], ['prioridade', 'Prioridade', 'text'], ['checkin', 'Check-in', 'date'], ['valor', 'Valor', 'number'], ['observacoes', 'Observacoes', 'textarea']].forEach((item, index) => db.prepare('INSERT INTO fields (client_id, field_key, label, field_type, required, position) VALUES (?, ?, ?, ?, ?, ?)').run(clientId, item[0], item[1], item[2], 0, index));
}

function seedCollaboratorModule() {
  if (db.prepare('SELECT COUNT(*) AS total FROM collaborators').get().total > 0) return;
  const holeritesClientId = getHoleritesClientId();
  const collaborators = [
    { name: 'Ana Souza', email: 'ana@fantasticbnb.app', password: 'ana123', document: '111.111.111-11', pix: 'ana@pix.com', weekday: 25, weekend: 35, holiday: 50 },
    { name: 'Carlos Lima', email: 'carlos@fantasticbnb.app', password: 'carlos123', document: '222.222.222-22', pix: 'carlos@pix.com', weekday: 23, weekend: 32, holiday: 45 },
  ];
  collaborators.forEach((item, index) => {
    const { salt, hash } = hashPassword(item.password);
    db.prepare('INSERT OR IGNORE INTO users (name, email, role, password_hash, password_salt, hourly_rate) VALUES (?, ?, ?, ?, ?, ?)').run(item.name, item.email, 'viewer', hash, salt, 0);
    const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(item.email);
    const userId = userRow.id;
    db.prepare('INSERT OR IGNORE INTO user_clients (user_id, client_id) VALUES (?, ?)').run(userId, holeritesClientId);
    const collaboratorResult = db.prepare('INSERT INTO collaborators (user_id, client_id, full_name, document_id, pix_key, hourly_weekday, hourly_weekend, hourly_holiday, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)').run(userId, holeritesClientId, item.name, item.document, item.pix, item.weekday, item.weekend, item.holiday);
    const entries = [
      { competence: currentCompetence(), hoursWeekday: 132 + index * 4, hoursWeekend: 18, hoursHoliday: 8, discount: 180 + index * 20, status: 'enviado', document: `HLT-24${index + 1}-${currentMonthParam()}.pdf` },
    ];
    entries.forEach((entry) => {
      const gross = roundCurrency(entry.hoursWeekday * item.weekday + entry.hoursWeekend * item.weekend + entry.hoursHoliday * item.holiday);
      const net = roundCurrency(gross - entry.discount);
      const now = new Date().toISOString();
      db.prepare('INSERT INTO holerite_entries (collaborator_id, competence, hours_weekday, hours_weekend, hours_holiday, gross_amount, discount_amount, net_amount, status, document_name, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(collaboratorResult.lastInsertRowid, entry.competence, entry.hoursWeekday, entry.hoursWeekend, entry.hoursHoliday, gross, entry.discount, net, entry.status, entry.document, 'Seed inicial.', now, now);
    });
  });
}

// ─── Operations State (legacy) ───────────────────────────────────────────────
function buildDefaultOperationsState() {
  return { cleanings: OPERATIONS_CLEANING_SEED, cleaners: OPERATIONS_CLEANER_SEED, cleaningClients: OPERATIONS_CLIENT_SEED, generatedInvoices: [], generatedPayrolls: [], invoiceServiceExtras: {}, cleaningIdCounter: Math.max(1, ...OPERATIONS_CLEANING_SEED.map((item) => Number(item.id || 0))) + 1 };
}
function sanitizeOperationsState(payload = {}) {
  const fallback = buildDefaultOperationsState();
  return { cleanings: Array.isArray(payload.cleanings) ? payload.cleanings : fallback.cleanings, cleaners: Array.isArray(payload.cleaners) ? payload.cleaners : fallback.cleaners, cleaningClients: Array.isArray(payload.cleaningClients) ? payload.cleaningClients : fallback.cleaningClients, generatedInvoices: Array.isArray(payload.generatedInvoices) ? payload.generatedInvoices : [], generatedPayrolls: Array.isArray(payload.generatedPayrolls) ? payload.generatedPayrolls : [], invoiceServiceExtras: payload.invoiceServiceExtras && typeof payload.invoiceServiceExtras === 'object' ? payload.invoiceServiceExtras : {}, cleaningIdCounter: Math.max(1, Number(payload.cleaningIdCounter || fallback.cleaningIdCounter || 1)) };
}
function getOperationsState() {
  const row = db.prepare('SELECT value_json FROM app_state WHERE state_key = ?').get(OPERATIONS_STATE_KEY);
  if (!row) { const state = buildDefaultOperationsState(); saveOperationsState(state); return state; }
  return sanitizeOperationsState(safeJsonParse(row.value_json));
}
function saveOperationsState(nextState) {
  const sanitized = sanitizeOperationsState(nextState);
  db.prepare('INSERT INTO app_state (state_key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(state_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at').run(OPERATIONS_STATE_KEY, JSON.stringify(sanitized), new Date().toISOString());
  return sanitized;
}

// ─── Invoice Print (legacy) ───────────────────────────────────────────────────
function buildInvoicePrintDocumentHtml(documentNumber) {
  const state = getOperationsState();
  const generated = (state.generatedInvoices || []).find((item) => String(item.number || '') === String(documentNumber || ''));
  if (!generated) return '';
  const parsedRange = parsePrintPeriodRange(generated.periodLabel);
  const fromRaw = generated.periodFrom || parsedRange.from;
  const toRaw = generated.periodTo || parsedRange.to;
  const from = fromRaw && toRaw && fromRaw > toRaw ? toRaw : fromRaw;
  const to = fromRaw && toRaw && fromRaw > toRaw ? fromRaw : toRaw;
  const entries = (state.cleanings || []).filter((item) => { if (from && item.date < from) return false; if (to && item.date > to) return false; return item.clientName === generated.clientName && item.invoiceGroup === generated.invoiceGroup; }).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  if (!entries.length) return '';
  const clientConfig = (state.cleaningClients || []).find((item) => item.clientName === generated.clientName);
  const groupConfig = clientConfig?.groups?.find((g) => g.name === generated.invoiceGroup) || null;
  const invoice = buildServerInvoiceSummary(generated, entries, groupConfig);
  return renderServerInvoicePrintHtml(invoice);
}

function buildServerInvoiceSummary(generated, entries, groupConfig) {
  const serviceExtras = Array.isArray(generated.serviceExtras) ? generated.serviceExtras : [];
  const operationalExtras = entries.filter((item) => String(item.extraLabel || '').trim() && Number(item.extraAmount || 0)).map((item) => ({ label: String(item.extraLabel || '').trim(), amount: roundCurrency(Number(item.extraAmount || 0)) }));
  const groupedOperationalExtras = [...operationalExtras.reduce((map, item) => { map.set(item.label, roundCurrency((map.get(item.label) || 0) + item.amount)); return map; }, new Map()).entries()].map(([label, amount]) => ({ label, amount }));
  const serviceLines = serviceExtras.filter((item) => String(item.description || '').trim() && Number(item.quantity || 0) > 0).map((item) => ({ label: `${String(item.description || '').trim()} x${Number(item.quantity || 0)}`, amount: roundCurrency(Number(item.total || (Number(item.quantity || 0) * Number(item.unitPrice || 0)))) }));
  let weekdayHoursMinutes = 0; let weekendHoursMinutes = 0; let weekdayValue = 0; let weekendValue = 0;
  entries.forEach((item) => { const minutes = parseHourLabelToMinutes(item.hours); const amount = calculateEntryClientTotal(item); if (String(item.dayType) === 'Weekends' || String(item.dayType) === 'Holiday') { weekendHoursMinutes += minutes; weekendValue = roundCurrency(weekendValue + amount); } else { weekdayHoursMinutes += minutes; weekdayValue = roundCurrency(weekdayValue + amount); } });
  return { number: generated.number, displayNumber: getServerDisplayDocumentNumber(generated.number), periodLabel: String(generated.periodLabel || '').replace(' a ', ' - '), title: generated.invoiceGroup, billTo: groupConfig?.billTo || generated.invoiceGroup, email: groupConfig?.email || '', rows: entries.map((item) => ({ date: formatServerDate(item.date), flat: item.flat, hours: formatServerInvoiceHours(item.hours) })), weekdayHoursMinutes, weekendHoursMinutes, weekdayValue, weekendValue, extraLines: [...groupedOperationalExtras, ...serviceLines], finalTotal: roundCurrency(weekdayValue + weekendValue + groupedOperationalExtras.reduce((sum, item) => sum + item.amount, 0) + serviceLines.reduce((sum, item) => sum + item.amount, 0)) };
}

function renderServerInvoicePrintHtml(invoice) {
  const config = {};
  db.prepare('SELECT config_key, value_text FROM app_config').all().forEach((r) => { config[r.config_key] = r.value_text; });
  const bankName = config.bank_name || 'Elita Aparecida de Oliveira';
  const sortCode = config.bank_sort_code || '23-14-70';
  const accountNumber = config.bank_account || '46630320';

  const invoiceRows = invoice.rows.map((item) => `<tr><td>${escapeHtml(item.date)}</td><td>${escapeHtml(item.flat)}</td><td class="hours-cell">${escapeHtml(item.hours)}</td></tr>`).join('');
  const extrasRows = invoice.extraLines.map((item) => `<tr class="extra-row"><td>${escapeHtml(item.label)}</td><td></td><td class="currency-cell">${escapeHtml(formatCurrencyGBP(item.amount))}</td></tr>`).join('');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>${escapeHtml(invoice.displayNumber)}</title><style>*{box-sizing:border-box;}body{margin:0;background:#fff;color:#000;font-family:"Times New Roman",Georgia,serif;}.invoice-sheet{width:860px;margin:0 auto;border:2px solid #111;}.header-grid{display:grid;grid-template-columns:150px 1fr;}.logo-box{min-height:146px;background:linear-gradient(180deg,#050505 0%,#161616 100%);color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;border-right:2px solid #111;}.logo-box strong{display:block;font-size:26px;line-height:1;}.logo-box span{display:block;font-size:18px;margin-top:6px;}.logo-box small{display:block;font-size:13px;margin-top:8px;letter-spacing:0.08em;}.header-table{width:100%;border-collapse:collapse;table-layout:fixed;}.header-table th,.header-table td{border:1px solid #111;padding:4px 8px;font-size:15px;vertical-align:middle;}.header-title{font-size:18px;font-style:italic;text-align:center;font-weight:700;}.header-label{width:140px;font-weight:700;font-style:italic;white-space:nowrap;}.header-value{word-break:break-word;line-height:1.15;}.invoice-title{text-align:center;font-size:28px;font-weight:700;padding:10px 12px 8px;border-top:2px solid #111;border-bottom:2px solid #111;}.detail-table{width:100%;border-collapse:collapse;table-layout:fixed;}.detail-table th,.detail-table td{border-bottom:1px solid #111;padding:4px 10px;font-size:16px;}.detail-table thead th{text-align:center;font-size:17px;font-weight:700;}.detail-table td:first-child{text-align:center;width:180px;}.detail-table td:nth-child(2){text-align:center;}.hours-cell{text-align:center;width:180px;}.summary-row td{border-top:2px solid #111;border-bottom:2px solid #111;font-size:18px;}.summary-row td:first-child,.summary-row td:last-child{text-align:center;}.amount-row td{border-bottom:1px solid #111;font-size:18px;}.currency-cell{text-align:right;padding-right:14px;}.extra-row td{border-top:2px solid #111;border-bottom:2px solid #111;font-size:18px;text-align:center;}.total-block{display:grid;grid-template-columns:1fr 220px;background:#e7f1dc;border-top:2px solid #111;border-bottom:2px solid #111;}.total-block strong{font-size:44px;text-align:center;padding:10px 0;font-weight:400;}.payment-title{background:#8b8b8b;color:#fff;text-align:center;font-size:16px;font-weight:700;padding:4px 0;border-bottom:2px solid #111;}.payment-body{text-align:center;padding:8px 16px 12px;font-size:16px;line-height:1.5;}@media print{body{margin:0;}.invoice-sheet{width:auto;margin:0;}}</style></head><body>
  <div class="invoice-sheet">
    <div class="header-grid">
      <div class="logo-box"><div><strong>Fantastic</strong><span>BnB</span><small>Cleaning Services</small></div></div>
      <table class="header-table"><tr><th colspan="2" class="header-title">Fantastic BnB Cleaning Services</th></tr><tr><td class="header-label">Email:</td><td class="header-value">fantasticbnbservicss@gmail.com</td></tr><tr><td class="header-label">Invoice #</td><td class="header-value">${escapeHtml(invoice.displayNumber)}</td></tr><tr><td class="header-label">Period:</td><td class="header-value">${escapeHtml(invoice.periodLabel)}</td></tr><tr><td class="header-label">Bill To:</td><td class="header-value">${escapeHtml(invoice.billTo)}</td></tr><tr><td class="header-label">Email:</td><td class="header-value">${escapeHtml(invoice.email || '-')}</td></tr></table>
    </div>
    <div class="invoice-title">${escapeHtml(invoice.title)}</div>
    <table class="detail-table"><thead><tr><th>Date</th><th>Flat</th><th>Total Hours</th></tr></thead><tbody>${invoiceRows}<tr class="summary-row"><td>Total Hours</td><td></td><td class="hours-cell">${escapeHtml(minutesToInvoiceLabel(invoice.weekdayHoursMinutes + invoice.weekendHoursMinutes))}</td></tr><tr class="amount-row"><td>Weekdays Hours</td><td class="hours-cell">${escapeHtml(minutesToInvoiceLabel(invoice.weekdayHoursMinutes))}</td><td class="currency-cell">${escapeHtml(formatCurrencyGBP(invoice.weekdayValue))}</td></tr><tr class="amount-row"><td>Weekends Hours</td><td class="hours-cell">${escapeHtml(minutesToInvoiceLabel(invoice.weekendHoursMinutes))}</td><td class="currency-cell">${escapeHtml(formatCurrencyGBP(invoice.weekendValue))}</td></tr>${extrasRows}</tbody></table>
    <div class="total-block"><strong>TOTAL</strong><strong>${escapeHtml(formatCurrencyGBP(invoice.finalTotal))}</strong></div>
    <div class="payment-title">Payment info :</div>
    <div class="payment-body"><div>Bank details: ${escapeHtml(bankName)}</div><div>Sort code : ${escapeHtml(sortCode)}</div><div>Account number : ${escapeHtml(accountNumber)}</div></div>
  </div>
  <script>window.onload=()=>setTimeout(()=>window.print(),250);</script></body></html>`;
}

// ─── Holerites Legacy ─────────────────────────────────────────────────────────
function getHoleritesClientId() {
  let client = db.prepare('SELECT id FROM clients WHERE slug = ?').get('holerites');
  if (!client) {
    const result = db.prepare('INSERT INTO clients (name, slug, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run('Holerites Internos', 'holerites');
    return result.lastInsertRowid;
  }
  return client.id;
}
function getCollaboratorProfile(userId) { const row = db.prepare('SELECT c.*, u.email FROM collaborators c JOIN users u ON u.id = c.user_id WHERE c.user_id = ?').get(userId); return row ? formatCollaborator(row) : null; }
function getCollaboratorById(id) { const row = db.prepare('SELECT c.*, u.email FROM collaborators c JOIN users u ON u.id = c.user_id WHERE c.id = ?').get(id); return row ? formatCollaborator(row) : null; }
function formatCollaborator(row) { return { id: row.id, user_id: row.user_id, client_id: row.client_id, full_name: row.full_name, document_id: row.document_id, pix_key: row.pix_key, hourly_weekday: Number(row.hourly_weekday), hourly_weekend: Number(row.hourly_weekend), hourly_holiday: Number(row.hourly_holiday), active: Number(row.active) === 1, email: row.email }; }
function listCollaborators(user) { const own = getCollaboratorProfile(user.id); if (own) return [own]; return db.prepare('SELECT c.*, u.email FROM collaborators c JOIN users u ON u.id = c.user_id ORDER BY c.full_name').all().map(formatCollaborator); }
function listHoleriteEntries(user) {
  const own = getCollaboratorProfile(user.id);
  const rows = own
    ? db.prepare('SELECT h.*, c.full_name, c.hourly_weekday, c.hourly_weekend, c.hourly_holiday FROM holerite_entries h JOIN collaborators c ON c.id = h.collaborator_id WHERE h.collaborator_id = ? ORDER BY h.competence DESC, h.id DESC').all(own.id)
    : db.prepare('SELECT h.*, c.full_name, c.hourly_weekday, c.hourly_weekend, c.hourly_holiday FROM holerite_entries h JOIN collaborators c ON c.id = h.collaborator_id ORDER BY h.competence DESC, c.full_name ASC').all();
  return rows.map((row) => ({ id: row.id, collaborator_id: row.collaborator_id, collaborator_name: row.full_name, competence: row.competence, hours_weekday: Number(row.hours_weekday), hours_weekend: Number(row.hours_weekend), hours_holiday: Number(row.hours_holiday), gross_amount: Number(row.gross_amount), discount_amount: Number(row.discount_amount), net_amount: Number(row.net_amount), status: row.status, document_name: row.document_name, notes: row.notes, created_at: row.created_at, updated_at: row.updated_at }));
}
function getHoleriteEntryById(id) { return listHoleriteEntries({ id: -1, role: 'superadmin' }).find((e) => e.id === id) || null; }
function buildHoleriteSummary(user) {
  const collaborator = getCollaboratorProfile(user.id);
  const collaborators = listCollaborators(user);
  const entries = listHoleriteEntries(user);
  const current = currentCompetence();
  const currentEntries = entries.filter((e) => e.competence === current);
  if (collaborator) return { collaborator, collaborators, entries, stats: { cards: [{ label: 'Hora util', value: formatCurrency(collaborator.hourly_weekday) }, { label: 'Fim de semana', value: formatCurrency(collaborator.hourly_weekend) }, { label: 'Feriado', value: formatCurrency(collaborator.hourly_holiday) }, { label: 'Ultimo liquido', value: formatCurrency(entries[0]?.net_amount || 0) }] } };
  return { collaborator: null, collaborators, entries, stats: { cards: [{ label: 'Colaboradores', value: String(collaborators.length) }, { label: 'Competencia atual', value: current }, { label: 'Enviados', value: String(currentEntries.filter((e) => ['enviado', 'confirmado'].includes(e.status)).length) }, { label: 'Pendentes', value: String(currentEntries.filter((e) => ['pendente', 'revisao'].includes(e.status)).length) }] } };
}

// ─── Utility Functions ────────────────────────────────────────────────────────
function ensureStatusExists(clientId, statusKey, label) {
  const exists = db.prepare('SELECT id FROM statuses WHERE client_id = ? AND status_key = ?').get(clientId, statusKey);
  if (!exists) {
    const next = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS n FROM statuses WHERE client_id = ?').get(clientId).n;
    db.prepare('INSERT OR IGNORE INTO statuses (client_id, status_key, label, color, position) VALUES (?, ?, ?, ?, ?)').run(clientId, statusKey, label, '#5B8DEF', next);
  }
}
function parsePrintPeriodRange(label = '') { const parts = String(label || '').split(' a ').map((item) => item.trim()).filter(Boolean); return { from: parts[0] ? parsePtBrDateToIso(parts[0]) : '', to: parts[1] ? parsePtBrDateToIso(parts[1]) : parts[0] ? parsePtBrDateToIso(parts[0]) : '' }; }
function parsePtBrDateToIso(value = '') { const [day, month, year] = String(value || '').split('/'); if (!day || !month || !year) return ''; return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; }
function parseHourLabelToMinutes(value = '') { const [h = '0', m = '0'] = String(value || '0:00').split(':'); return (Number(h) * 60) + Number(m); }
function minutesToInvoiceLabel(totalMinutes = 0) { const h = Math.floor(Number(totalMinutes || 0) / 60); const m = Number(totalMinutes || 0) % 60; return `${h}:${String(m).padStart(2, '0')}:00`; }
function formatServerInvoiceHours(value = '') { return minutesToInvoiceLabel(parseHourLabelToMinutes(value)); }
function validateRole(role) {
  const valid = ['superadmin', 'admin', 'client', 'employee', 'viewer', 'client_user'];
  return valid.includes(role) ? role : 'viewer';
}
function calculateEntryClientTotal(item) { const rate = Number(item.clientRate || 0); if (String(item.billingType) === 'project') return roundCurrency(rate); const hours = parseHourLabelToMinutes(item.hours) / 60; return roundCurrency(hours * rate); }
function formatServerDate(value = '') { const [year, month, day] = String(value || '').split('-'); return year && month && day ? `${day}/${month}/${year}` : value || '-'; }
function getServerDisplayDocumentNumber(value = '') { return String(value || '').trim() || '#-'; }
function formatHours(decimalHours) { const h = Math.floor(Number(decimalHours || 0)); const m = Math.round((Number(decimalHours || 0) - h) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
function roundCurrency(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)); }
function formatCurrencyGBP(value) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value || 0)); }
function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function currentCompetence() {
  const now = new Date();
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[now.getMonth()]}/${now.getFullYear()}`;
}
function currentMonthParam() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function isAdminRole(role) { return ['superadmin', 'admin', 'manager', 'analyst'].includes(role); }
function normalizeFieldType(fieldType) { return ['text', 'number', 'date', 'status', 'textarea'].includes(fieldType) ? fieldType : 'text'; }
function hashPassword(password) { const salt = crypto.randomBytes(16).toString('hex'); const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex'); return { salt, hash }; }
function verifyPassword(password, salt, hash) { const candidate = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex'); return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex')); }
function parseCookies(raw) { return raw.split(';').map((item) => item.trim()).filter(Boolean).reduce((acc, item) => { const [key, ...rest] = item.split('='); acc[key] = decodeURIComponent(rest.join('=')); return acc; }, {}); }
async function parseBody(req) { const chunks = []; for await (const chunk of req) chunks.push(chunk); const raw = Buffer.concat(chunks).toString('utf8'); return raw ? JSON.parse(raw) : {}; }
function sendJson(res, status, payload) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(payload)); }
function sendNoContent(res) { res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end(); }
async function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  createReadStream(filePath).pipe(res);
}
function safeJsonParse(value) { try { return JSON.parse(value || '{}'); } catch { return {}; } }
function slugify(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || `item-${Date.now()}`; }
function sanitizeSortColumn(value) { return ['title', 'status_key', 'updated_at', 'created_at'].includes(value) ? value : 'updated_at'; }
function sanitizeDirection(value) { return value === 'ASC' ? 'ASC' : 'DESC'; }
function parseCsv(text) {
  const rows = []; let row = []; let current = ''; let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]; const next = text[i + 1];
    if (char === '"') { if (inQuotes && next === '"') { current += '"'; i += 1; } else inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { row.push(current); current = ''; continue; }
    if ((char === '\n' || char === '\r') && !inQuotes) { if (char === '\r' && next === '\n') i += 1; row.push(current); rows.push(row); row = []; current = ''; continue; }
    current += char;
  }
  if (current.length || row.length) { row.push(current); rows.push(row); }
  return rows;
}
function csvEscape(value) { const text = String(value ?? ''); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function createBackup(reason) {
  if (!existsSync(DB_PATH)) return;
  // Checkpoint WAL before backup to prevent WAL file growth
  try { db.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch {}
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync(DB_PATH, path.join(BACKUP_DIR, `backup-${reason}-${stamp}.sqlite`));
  trimBackups();
}
function trimBackups() { listBackups().slice(12).forEach((item) => fs.unlink(path.join(BACKUP_DIR, item.name)).catch(() => {})); }
function listBackups() { return readdirSync(BACKUP_DIR, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.sqlite')).map((e) => ({ name: e.name, time: statSync(path.join(BACKUP_DIR, e.name)).mtimeMs })).sort((a, b) => b.time - a.time); }
function insertAuditLog(clientId, recordId, userId, action, snapshot) { db.prepare('INSERT INTO audit_logs (client_id, record_id, user_id, action, snapshot_json) VALUES (?, ?, ?, ?, ?)').run(clientId, recordId, userId, action, JSON.stringify(snapshot)); }
function hydrateRecord(record) { return { ...record, payload: safeJsonParse(record.payload_json) }; }
function countRecords(clientIds) { if (!clientIds.length) return 0; const p = clientIds.map(() => '?').join(','); return db.prepare(`SELECT COUNT(*) AS total FROM records WHERE client_id IN (${p})`).get(...clientIds).total; }
function countUpdatesToday(clientIds) { if (!clientIds.length) return 0; const p = clientIds.map(() => '?').join(','); const start = new Date(); start.setHours(0, 0, 0, 0); return db.prepare(`SELECT COUNT(*) AS total FROM records WHERE client_id IN (${p}) AND updated_at >= ?`).get(...clientIds, start.toISOString()).total; }
function requireSession(req, res) {
  cleanupExpiredSessions();
  const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE];
  if (!token) { sendJson(res, 401, { error: 'Sessao expirada.' }); return null; }
  const row = db.prepare('SELECT s.token, s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').get(token);
  if (!row || new Date(row.expires_at).getTime() < Date.now()) { if (row) db.prepare('DELETE FROM sessions WHERE token = ?').run(token); sendJson(res, 401, { error: 'Sessao expirada.' }); return null; }
  return { token, user: sanitizeUser(row) };
}
function sanitizeUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role, hourlyRate: Number(user.hourly_rate || 0), parent_client_id: user.parent_client_id }; }
function buildSessionPayload(user) { return { user: { ...sanitizeUser(user), collaborator: getCollaboratorProfile(user.id) } }; }
function ensureRole(user, roles, res) { if (!roles.includes(user.role)) { sendJson(res, 403, { error: 'Permissao insuficiente.' }); return false; } return true; }
function cleanupExpiredSessions() { db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString()); }
function getSession(req) { const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE]; if (!token) return null; const row = db.prepare('SELECT s.token, s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').get(token); return row && new Date(row.expires_at).getTime() >= Date.now() ? { token, user: sanitizeUser(row) } : null; }
function getAccessibleClients(user) { if (isAdminRole(user.role) || user.role === 'superadmin') return db.prepare('SELECT * FROM clients ORDER BY name').all(); return db.prepare('SELECT c.* FROM clients c JOIN user_clients uc ON uc.client_id = c.id WHERE uc.user_id = ? ORDER BY c.name').all(user.id); }
function canAccessClient(user, clientId) { return getAccessibleClients(user).some((c) => c.id === clientId); }
function getClientConfig(clientId) { return { client: db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId), fields: db.prepare('SELECT * FROM fields WHERE client_id = ? ORDER BY position, id').all(clientId), statuses: db.prepare('SELECT * FROM statuses WHERE client_id = ? ORDER BY position, id').all(clientId) }; }
function listRecords(clientId, filters) {
  let sql = 'SELECT * FROM records WHERE client_id = ?';
  const params = [clientId];
  if (filters.search) { const term = `%${filters.search.toLowerCase()}%`; sql += ' AND (lower(title) LIKE ? OR lower(payload_json) LIKE ?)'; params.push(term, term); }
  if (filters.status) { sql += ' AND status_key = ?'; params.push(filters.status); }
  if (filters.filterField && filters.filterValue) { sql += ' AND lower(json_extract(payload_json, ?)) LIKE ?'; params.push(`$.${filters.filterField}`, `%${filters.filterValue.toLowerCase()}%`); }
  sql += ` ORDER BY ${filters.sort} ${filters.direction} LIMIT 500`;
  return db.prepare(sql).all(...params).map(hydrateRecord);
}

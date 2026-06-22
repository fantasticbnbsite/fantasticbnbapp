/* ════════════════════════════════════════════════════════
   client.js  —  CleanOps Client Portal
   All API calls use cookie-based auth (fantastic_session)
═══════════════════════════════════════════════════════ */

'use strict';

/* ─── State ──────────────────────────────────────────────── */
const state = {
  user: null,
  jobs: [],
  flats: [],
  currentView: 'jobs',
};

/* ─── DOM refs ───────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const loginScreen   = $('loginScreen');
const app           = $('app');
const loginForm     = $('loginForm');
const loginEmail    = $('loginEmail');
const loginPassword = $('loginPassword');
const loginError    = $('loginError');
const loginBtn      = $('loginBtn');
const headerUserName= $('userNameDisplay');
const logoutBtn     = $('logoutBtn');
const viewJobs      = $('viewJobs');
const viewRequest   = $('viewRequest');
const jobList       = $('jobList');
const tabJobs       = $('tabJobs');
const tabRequest    = $('tabRequest');
const tabJobsDesk   = $('tabJobsDesk');
const tabRequestDesk= $('tabRequestDesk');
const requestForm   = $('requestForm');
const selectFlat    = $('selectFlat');
const inputDate     = $('inputDate');
const inputNotes    = $('inputNotes');
const billingChip   = $('billingChip');
const billingChipTxt= $('billingChipText');
const errFlat       = $('errFlat');
const errDate       = $('errDate');
const errGeneral    = $('errGeneral');
const requestSubmit = $('requestSubmit');
const photosModal   = $('photosModal');
const photosModalTitle = $('photosModalTitle');
const photoGrid     = $('photoGrid');
const closePhotosModalBtn = $('closePhotosModal');
const lightbox      = $('lightbox');
const lightboxImg   = $('lightboxImg');
const lightboxClose = $('lightboxClose');
const toast         = $('toast');

/* ─── Status Config ──────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:     { label: 'Pending',              icon: '⏳', color: '#706356', bg: 'rgba(112,99,86,0.1)',   border: 'rgba(112,99,86,0.2)'   },
  assigned:    { label: 'Cleaner assigned', icon: '👤', color: '#5B8DEF', bg: 'rgba(91,141,239,0.1)',  border: 'rgba(91,141,239,0.22)' },
  accepted:    { label: 'Confirmed',             icon: '✅', color: '#D4900A', bg: 'rgba(255,179,71,0.12)', border: 'rgba(255,179,71,0.28)' },
  in_progress: { label: 'In progress',           icon: '🧹', color: '#16756b', bg: 'rgba(22,117,107,0.1)',  border: 'rgba(22,117,107,0.22)' },
  completed:   { label: 'Completed',              icon: '✨', color: '#1b8a5a', bg: 'rgba(52,195,143,0.1)',  border: 'rgba(52,195,143,0.24)' },
  cancelled:   { label: 'Cancelled',              icon: '🚫', color: '#888888', bg: 'rgba(57,57,57,0.1)',    border: 'rgba(57,57,57,0.2)'    },
};

/* ─── Helpers ────────────────────────────────────────────── */

/**
 * Generic fetch wrapper — always sends credentials
 */
async function api(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: {},
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  if (res.status === 204) return {};
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || data.error || 'Unknown error'), { status: res.status, data });
  return data;
}

/**
 * Format a date string "YYYY-MM-DD" or ISO into a pretty PT-BR string
 */
function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Format decimal hours to "Xh Ym"
 */
function fmtHours(h) {
  if (h == null) return '—';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Today's date in YYYY-MM-DD
 */
function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Show a toast notification
 * @param {string} msg
 * @param {'ok'|'err'|''} type
 */
let toastTimer;
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = 'show' + (type ? ` toast-${type}` : '');
  toastTimer = setTimeout(() => { toast.className = ''; }, 3400);
}

/**
 * Build status badge HTML
 */
function badgeHTML(status) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return `<span class="status-badge" style="color:${cfg.color};background:${cfg.bg};border-color:${cfg.border}">${cfg.icon} ${cfg.label}</span>`;
}

/* ─── Boot ───────────────────────────────────────────────── */

async function boot() {
  // Step 1: Check authentication (isolated try-catch)
  let userData = null;
  try {
    const data = await api('GET', '/api/auth/me');
    if (data && data.user && (data.user.role === 'client' || data.user.role === 'client_user')) {
      userData = data.user;
    }
  } catch (e) {
    // Not authenticated — will show login form below
    console.log('Auth check failed:', e.message);
  }

  if (!userData) {
    // Not authenticated or wrong role — show login form right here
    showLoginFallback();
    return;
  }

  // Step 2: Authenticated — render the app (separate try-catch so
  //         a DOM error here never gets confused with an auth failure)
  state.user = userData;
  try {
    showPushBanner();
    showApp();
  } catch (uiErr) {
    console.error('Error rendering app:', uiErr);
    // Still try to show something rather than a blank page
    if (app) app.classList.remove('hidden');
    if (loginScreen) loginScreen.classList.add('hidden');
  }
}

/** Show the login form that lives inside client.html */
function showLoginFallback() {
  if (app) app.classList.add('hidden');
  if (loginScreen) loginScreen.classList.remove('hidden');
  if (loginEmail) loginEmail.focus();
}

function showPushBanner() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (localStorage.getItem('hidePushBanner') === 'true') return;
  if (Notification.permission === 'granted') {
    setupPushNotifications();
    return;
  }
  if (Notification.permission === 'denied') return;
  
  if (document.getElementById('push-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'push-banner';
  banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px;z-index:9999;display:flex;align-items:center;gap:16px;box-shadow:var(--shadow);width:90%;max-width:400px;backdrop-filter:blur(22px);';
  banner.innerHTML = `
    <div style="flex:1;">
      <strong style="color:var(--text);font-size:0.95rem;">Enable Notifications</strong><br/>
      <small style="color:var(--text-light);font-size:0.8rem;">Receive status updates.</small>
    </div>
    <div style="display:flex; gap:8px;">
      <button id="push-dismiss" style="background:none; border:none; color:var(--muted); font-weight:bold; font-size:0.85rem; padding:8px;">Not now</button>
      <button id="push-activate" class="btn-primary" style="padding:8px 16px;font-size:0.85rem;width:auto;">Enable</button>
    </div>
  `;
  document.body.appendChild(banner);
  
  document.getElementById('push-dismiss').onclick = () => {
    localStorage.setItem('hidePushBanner', 'true');
    banner.remove();
  };

  document.getElementById('push-activate').onclick = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setupPushNotifications();
        banner.remove();
        alert('Permission granted! You will receive a test notification shortly.');
      } else if (permission === 'denied') {
        banner.remove();
        alert('Notifications blocked in your browser settings.');
      } else {
        alert('Permission ignored. To receive updates, you need to click "Allow" in the browser prompt.');
      }
    } catch(e) { console.error(e); }
  };
}

async function setupPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const res = await api('GET', '/api/push/vapidPublicKey');
      const vapidPublicKey = res.publicKey;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }
    await api('POST', '/api/push/subscribe', sub);
  } catch(e) {
    console.error('Push setup error:', e);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function showLogin() {
  showLoginFallback();
}

function showApp() {
  if (loginScreen) loginScreen.classList.add('hidden');
  if (app) app.classList.remove('hidden');
  headerUserName.textContent = state.user.name || state.user.email;
  setMinDate();
  switchView('jobs');
  loadJobs();
  loadFlats();
}

/* ─── Auth ───────────────────────────────────────────────── */

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      loginError.textContent = 'Enter email and password.';
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in…';

    try {
      await api('POST', '/api/auth/login', { email, password });
      const me = await api('GET', '/api/auth/me');
      if (!me.user || (me.user.role !== 'client' && me.user.role !== 'client_user')) {
        loginError.textContent = 'Access restricted to clients only.';
        await api('POST', '/api/auth/logout');
        return;
      }
      state.user = me.user;
      sessionStorage.removeItem('client_auth_bounce');
      showApp();
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        loginError.textContent = 'Incorrect email or password.';
      } else {
        loginError.textContent = err.message || 'Error logging in. Please try again.';
      }
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Log In';
    }
  });
}

logoutBtn.addEventListener('click', async () => {
  try { await api('POST', '/api/auth/logout'); } catch (_) {}
  state.user = null;
  state.jobs = [];
  state.flats = [];
  window.location.href = '/';
});

/* ─── View Navigation ────────────────────────────────────── */

function switchView(view) {
  state.currentView = view;

  viewJobs.classList.toggle('active', view === 'jobs');
  viewRequest.classList.toggle('active', view === 'request');
  const viewInvoices = document.getElementById('viewInvoices');
  if (viewInvoices) viewInvoices.style.display = view === 'invoices' ? 'block' : 'none';
  if (viewJobs) viewJobs.style.display = view === 'jobs' ? 'block' : 'none';
  if (viewRequest) viewRequest.style.display = view === 'request' ? 'block' : 'none';

  tabJobs.classList.toggle('active', view === 'jobs');
  tabRequest.classList.toggle('active', view === 'request');
  const tabInvoices = document.getElementById('tabInvoices');
  if (tabInvoices) tabInvoices.classList.toggle('active', view === 'invoices');

  if (tabJobsDesk) tabJobsDesk.classList.toggle('active', view === 'jobs');
  if (tabRequestDesk) tabRequestDesk.classList.toggle('active', view === 'request');
  const tabInvoicesDesk = document.getElementById('tabInvoicesDesk');
  if (tabInvoicesDesk) tabInvoicesDesk.classList.toggle('active', view === 'invoices');

  tabJobs.setAttribute('aria-selected', view === 'jobs');
  tabRequest.setAttribute('aria-selected', view === 'request');
  if (tabInvoices) tabInvoices.setAttribute('aria-selected', view === 'invoices');
  
  if (view === 'invoices') {
    loadInvoices();
  }
}

tabJobs.addEventListener('click', () => switchView('jobs'));
tabRequest.addEventListener('click', () => switchView('request'));
const tabInvoices = document.getElementById('tabInvoices');
if (tabInvoices) tabInvoices.addEventListener('click', () => switchView('invoices'));

if (tabJobsDesk) tabJobsDesk.addEventListener('click', () => switchView('jobs'));
if (tabRequestDesk) tabRequestDesk.addEventListener('click', () => switchView('request'));
const tabInvoicesDesk = document.getElementById('tabInvoicesDesk');
if (tabInvoicesDesk) tabInvoicesDesk.addEventListener('click', () => switchView('invoices'));

/* ─── Load Invoices ──────────────────────────────────────── */

let globalClientInvoices = [];

async function loadInvoices() {
  const container = document.getElementById('invoicesContainer');
  container.innerHTML = `<div class="loading-overlay"><div class="big-spinner"></div><span>Loading invoices...</span></div>`;
  try {
    const data = await api('GET', '/api/finance/invoices/mine');
    globalClientInvoices = data.invoices || [];
    renderInvoices();
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Error loading invoices: ${err.message}</div>`;
  }
}

window.renderInvoices = function() {
  const container = document.getElementById('invoicesContainer');
  const invNo = document.getElementById('filterInvoiceNo')?.value.toLowerCase().trim();
  const invDate = document.getElementById('filterInvoiceDate')?.value;

  let filtered = globalClientInvoices;
  if (invNo) {
    filtered = filtered.filter(i => String(i.id).includes(invNo));
  }
  if (invDate) {
    filtered = filtered.filter(i => i.period_from <= invDate && i.period_to >= invDate);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--muted);">
        <div style="font-size:3rem; margin-bottom:12px;">🧾</div>
        No invoices found.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(i => {
    const jobs = i.jobs || [];
    
    // Group jobs by date and flat
    const groupedJobs = {};
    jobs.forEach(j => {
      const dateStr = j.finished_at ? fmtDate(j.finished_at) : 'No date';
      const flatStr = j.flat_address || 'Unknown';
      const key = dateStr + '|' + flatStr;
      if (!groupedJobs[key]) {
        groupedJobs[key] = {
          dateStr,
          flatStr,
          totalClientAmount: 0,
          totalDurationHours: 0
        };
      }
      groupedJobs[key].totalClientAmount += Number(j.client_amount || 0);
      groupedJobs[key].totalDurationHours += Number(j.duration_hours || 0);
    });

    const rows = Object.values(groupedJobs).map(g => `
      <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line);">
        <div>
          <div style="font-size:0.95rem;">${g.dateStr} - ${escHtml(g.flatStr)}</div>
          <div style="font-size:0.85rem; color:var(--muted);">${g.totalDurationHours ? fmtHours(g.totalDurationHours) : ''}</div>
        </div>
        <div style="font-weight:600; display:flex; align-items:center;">£${g.totalClientAmount.toFixed(2)}</div>
      </div>
    `).join('');

    return `
      <div class="form-card glass-card" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong style="font-size:1.15rem; color:var(--text);">Invoice nº ${i.id}</strong>
            <div style="color:var(--muted); font-size:0.9rem; margin-top:4px;">Period: ${fmtDate(i.period_from)} to ${fmtDate(i.period_to)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700; font-size:1.2rem; color:var(--primary); margin-bottom:4px;">£${Number(i.total_amount).toFixed(2)}</div>
            <span class="status-badge status-${i.status}">${i.status}</span>
          </div>
        </div>
        
        <div style="margin-top: 20px; display:flex; gap: 8px;">
          <a href="/print/invoice/${i.id}" target="_blank" class="button button-primary" style="flex:1; text-align:center; padding:12px; text-decoration:none; font-size:0.9rem; border-radius:12px;">Download PDF</a>
          <button class="button button-secondary" style="flex:1; font-size:0.9rem; border-radius:12px;" onclick="toggleInvoiceDetails(${i.id})">Details</button>
        </div>

        <div id="invoiceDetails_${i.id}" style="display:none; margin-top: 16px; padding-top: 12px;">
          <h4 style="font-size:0.9rem; color:var(--muted); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Job Breakdown</h4>
          ${rows || '<div style="color:var(--muted); font-size:0.9rem;">No jobs attached.</div>'}
        </div>
      </div>
    `;
  }).join('');
};

window.toggleInvoiceDetails = function(id) {
  const el = document.getElementById('invoiceDetails_' + id);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
};

/* ─── Load Jobs ──────────────────────────────────────────── */

async function loadJobs() {
  // show skeleton
  jobList.innerHTML = `
    <div class="skeleton glass-card"><div class="skeleton-inner"></div></div>
    <div class="skeleton glass-card"><div class="skeleton-inner"></div></div>
    <div class="skeleton glass-card"><div class="skeleton-inner"></div></div>
  `;
  try {
    console.log('[client] Loading jobs...');
    const data = await api('GET', '/api/jobs/mine');
    console.log('[client] Jobs loaded:', data);
    const rawJobs = data.jobs || [];
    const grouped = {};
    rawJobs.forEach(j => {
      const date = j.requestedDate || j.finishedAt?.slice(0, 10) || '-';
      const key = `${j.flatId}_${date}`;
      if (!grouped[key]) {
        grouped[key] = { ...j, jobIds: [j.id], durationHours: 0, clientAmount: 0 };
      } else {
        grouped[key].jobIds.push(j.id);
      }
      grouped[key].durationHours += Number(j.durationHours || 0);
      grouped[key].clientAmount += Number(j.clientAmount || 0);
      
      if (j.status === 'in_progress' && grouped[key].status === 'pending') grouped[key].status = 'in_progress';
      else if (j.status === 'completed' && grouped[key].status !== 'completed') grouped[key].status = 'completed';
    });

    state.jobs = Object.values(grouped).map(g => ({
      ...g,
      id: g.jobIds.join(',')
    })).sort((a, b) => new Date(b.requestedDate) - new Date(a.requestedDate));

    // Populate filter drop down
    const filterJobFlat = document.getElementById('filterJobFlat');
    if (filterJobFlat) {
      const uniqueFlats = [...new Set(state.jobs.map(j => j.flatAddress).filter(Boolean))].sort();
      const currentVal = filterJobFlat.value;
      filterJobFlat.innerHTML = '<option value="all">All Flats</option>' + 
        uniqueFlats.map(f => `<option value="${escHtml(f)}">${escHtml(f)}</option>`).join('');
      filterJobFlat.value = currentVal;
    }

    renderJobs();
  } catch (err) {
    console.error('[client] Error loading jobs:', err);
    jobList.innerHTML = `<div class="empty-state glass-card" style="border-radius:24px">
      <span class="empty-icon">⚠️</span>
      <h3>Error loading</h3>
      <p>${escHtml(err.message || 'Could not fetch cleans.')}</p>
    </div>`;
  }
}

window.renderJobs = function() {
  const jobFlat = document.getElementById('filterJobFlat')?.value;
  const jobDate = document.getElementById('filterJobDate')?.value;

  let filtered = state.jobs;

  if (jobFlat && jobFlat !== 'all') {
    filtered = filtered.filter(j => j.flatAddress === jobFlat);
  }
  if (jobDate) {
    filtered = filtered.filter(j => j.requestedDate && j.requestedDate.slice(0, 10) === jobDate);
  }

  if (filtered.length === 0) {
    jobList.innerHTML = `
      <div class="empty-state glass-card" style="border-radius:24px">
        <span class="empty-icon">🏡</span>
        <h3>No cleans found</h3>
        <p>No cleans match your filters.</p>
      </div>
    `;
    return;
  }

  jobList.innerHTML = filtered.map(job => jobCardHTML(job)).join('');

  // Attach photo button listeners
  jobList.querySelectorAll('[data-photos-job]').forEach(btn => {
    btn.addEventListener('click', () => openPhotosModal(btn.dataset.photosJob, btn.dataset.photosAddress));
  });
}

function jobCardHTML(job) {
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const dateStr = fmtDate(job.requestedDate);

  // Build footer content
  let footContent = '';

  if (job.status === 'in_progress') {
    footContent = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <div class="pulse-row">
          <span class="pulse-dot"></span>
          In progress
        </div>
        <button class="btn btn-ghost btn-sm" data-photos-job="${job.id}" data-photos-address="${escHtml(job.flatAddress || '')}">
          📸 View photos
        </button>
      </div>
    `;
  } else if (job.status === 'completed') {
    const dur = job.durationHours != null ? `<span class="duration-chip">⏱ ${fmtHours(job.durationHours)}</span>` : '';
    const amt = job.clientAmount != null ? `<span class="duration-chip" style="background:rgba(22,117,107,0.1);color:#16756b;">£${Number(job.clientAmount).toFixed(2)}</span>` : '';
    footContent = `
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        ${dur}${amt}
      </div>
      <button class="btn btn-ghost btn-sm" data-photos-job="${job.id}" data-photos-address="${escHtml(job.flatAddress || '')}">
        📸 View photos
      </button>
    `;
  } else {
    // pending / assigned / accepted — show cleaner if assigned
    let text = '';
    if (job.employeeName && job.status !== 'pending') {
      text = `<span style="font-size:0.84rem;color:var(--muted);">👤 ${escHtml(job.employeeName)}</span>`;
    }
    
    let actionBtn = '';
    if (job.status !== 'cancelled') {
      actionBtn = `<button class="btn btn-ghost btn-sm" style="color:var(--danger,#d45555); margin-left: auto;" onclick="cancelJob('${job.id}')">❌ Cancel</button>`;
    } else {
      actionBtn = `<button class="btn btn-ghost btn-sm" style="color:var(--muted); margin-left: auto;" onclick="deleteJob('${job.id}')">🗑️ Delete</button>`;
    }
    
    if (text || actionBtn) {
      footContent = `<div style="display:flex; align-items:center; width:100%;">
        ${text}
        ${actionBtn}
      </div>`;
    }
  }

  let notesHTML = job.notes
    ? `<div class="job-meta-item" style="width:100%;margin-top:2px;"><span>📝</span> <em style="color:var(--muted);font-style:normal;font-size:0.83rem;">${escHtml(job.notes)}</em></div>`
    : '';
    
  if (job.status === 'cancelled') {
    const cancelDate = job.updatedAt ? new Intl.DateTimeFormat('en-GB').format(new Date(job.updatedAt)) : '';
    notesHTML += `<div class="job-meta-item" style="width:100%;margin-top:2px;color:var(--danger,#d45555);">🚫 Cancelled on ${cancelDate}</div>`;
  }

  const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
  let timelineHtml = '';
  if (job.startedAt) timelineHtml += `<span style="color:#16756b; font-weight:600; margin-right:12px;">🟢 Started: ${timeFmt.format(new Date(job.startedAt))} (UK)</span>`;
  if (job.finishedAt) timelineHtml += `<span style="color:#d45555; font-weight:600;">🔴 Finished: ${timeFmt.format(new Date(job.finishedAt))} (UK)</span>`;
  const timelineBlock = timelineHtml ? `<div class="job-meta-item" style="width:100%;margin-top:2px;">${timelineHtml}</div>` : '';

  return `
    <article class="job-card glass-card" style="--status-color:${cfg.color}">
      <div class="job-card-inner">
        <div class="job-card-top">
          <span class="job-address">${escHtml(job.flatAddress || 'Address not provided')}</span>
          ${badgeHTML(job.status)}
        </div>
        <div class="job-meta">
          <div class="job-meta-item">📅 ${dateStr}</div>
          ${job.billingType === 'hourly' ? '<div class="job-meta-item">⏱ Hourly</div>' : job.billingType === 'project' ? '<div class="job-meta-item">📋 Fixed project</div>' : ''}
          ${notesHTML}
          ${timelineBlock}
        </div>
        ${footContent ? `<div class="job-card-foot">${footContent}</div>` : ''}
      </div>
    </article>
  `;
}

/* ─── Load Flats ─────────────────────────────────────────── */

async function loadFlats() {
  try {
    const data = await api('GET', '/api/flats/mine');
    state.flats = data.flats || [];
    populateFlatSelect();
  } catch (err) {
    // Silently fail; form will show no options
    console.error('Failed to load flats:', err);
  }
}

function populateFlatSelect() {
  selectFlat.innerHTML = '<option value="">Select a property…</option>';
  state.flats.forEach(flat => {
    const opt = document.createElement('option');
    opt.value = flat.id;
    opt.textContent = flat.address;
    opt.dataset.billingType = flat.billingType || '';
    opt.dataset.hourlyRate = flat.hourlyRate || '';
    opt.dataset.projectRate = flat.projectRate || '';
    selectFlat.appendChild(opt);
  });
}

/* Show billing info chip when flat is selected */
selectFlat.addEventListener('change', () => {
  const opt = selectFlat.selectedOptions[0];
  errFlat.textContent = '';
  if (!opt || !opt.value) {
    billingChip.classList.remove('show');
    return;
  }
  const bt = opt.dataset.billingType;
  const hr = opt.dataset.hourlyRate;
  const pr = opt.dataset.projectRate;
  let chipText = '';
  if (bt === 'hourly' && hr) {
    chipText = `Hourly billing · £${Number(hr).toFixed(2)}`;
  } else if (bt === 'project' && pr) {
    chipText = `Fixed project · £${Number(pr).toFixed(2)}`;
  } else if (bt === 'hourly') {
    chipText = 'Hourly billing';
  } else if (bt === 'project') {
    chipText = 'Fixed project';
  }
  if (chipText) {
    billingChipTxt.textContent = chipText;
    billingChip.classList.add('show');
  } else {
    billingChip.classList.remove('show');
  }
});

/* ─── Set min date ───────────────────────────────────────── */

function setMinDate() {
  inputDate.min = todayStr();
}

/* ─── Request Form ───────────────────────────────────────── */

requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  // Clear errors
  errFlat.textContent = '';
  errDate.textContent = '';
  errGeneral.textContent = '';

  const flatId = selectFlat.value;
  const requestedDate = inputDate.value;
  const notes = inputNotes.value.trim();

  let valid = true;

  if (!flatId) {
    errFlat.textContent = 'Select a property.';
    valid = false;
  }

  if (!requestedDate) {
    errDate.textContent = 'Select a date.';
    valid = false;
  } else if (requestedDate < todayStr()) {
    errDate.textContent = 'The date must be today or in the future.';
    valid = false;
  }

  if (!valid) return;

  requestSubmit.disabled = true;
  requestSubmit.innerHTML = '<span>⏳</span> Requesting…';

  try {
    await api('POST', '/api/jobs', { flatId, requestedDate, notes: notes || undefined });
    // Success
    showToast('✅ Clean requested successfully!', 'ok');
    requestForm.reset();
    billingChip.classList.remove('show');
    setMinDate();
    // Switch to jobs view & refresh
    switchView('jobs');
    await loadJobs();
  } catch (err) {
    errGeneral.textContent = err.message || 'Error requesting clean. Please try again.';
    showToast('Error requesting clean.', 'err');
  } finally {
    requestSubmit.disabled = false;
    requestSubmit.innerHTML = '<span>🧹</span> Request Clean';
  }
});

/* ─── Photos Modal ───────────────────────────────────────── */

async function openPhotosModal(jobIdsStr, address) {
  photosModalTitle.textContent = `📸 Photos — ${address || 'Clean'}`;
  photoGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--muted);">Loading…</div>`;
  photosModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    const ids = String(jobIdsStr).split(',');
    let photos = [];
    for (const id of ids) {
      const data = await api('GET', `/api/jobs/${id}/photos`);
      if (data.photos) photos.push(...data.photos);
    }
    
    if (photos.length === 0) {
      photoGrid.innerHTML = `
        <div class="photos-empty" style="grid-column:1/-1">
          <span class="icon">📷</span>
          <p>No photos available for this clean.</p>
        </div>
      `;
    } else {
      photoGrid.innerHTML = photos.map(p => `
        <div style="display:flex; flex-direction:column; gap:4px;">
          <div class="photo-thumb" data-src="/uploads/${escHtml(p.filename)}" title="${escHtml(p.originalName || p.filename)}">
            <img
              src="/uploads/${escHtml(p.filename)}"
              alt="${escHtml(p.originalName || 'Clean photo')}"
              loading="lazy"
            />
          </div>
          <a href="/uploads/${escHtml(p.filename)}" download="${escHtml(p.originalName || p.filename)}" class="btn btn-ghost btn-sm" style="padding: 4px; font-size: 0.8rem; background: #eee;">⬇️ Download</a>
        </div>
      `).join('');

      photoGrid.querySelectorAll('.photo-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => openLightbox(thumb.dataset.src));
      });
    }
  } catch (err) {
    photoGrid.innerHTML = `
      <div class="photos-empty" style="grid-column:1/-1">
        <span class="icon">⚠️</span>
        <p>${err.message || 'Error loading photos.'}</p>
      </div>
    `;
  }
}

function closePhotosModal() {
  photosModal.classList.remove('open');
  document.body.style.overflow = '';
  photoGrid.innerHTML = '';
}

closePhotosModalBtn.addEventListener('click', closePhotosModal);

photosModal.addEventListener('click', (e) => {
  if (e.target === photosModal) closePhotosModal();
});

/* ─── Lightbox ───────────────────────────────────────────── */

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxImg.src = '';
  // Restore scroll only if photos modal is also closed
  if (!photosModal.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target === lightboxImg) closeLightbox();
});

/* ─── Keyboard accessibility ─────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (lightbox.classList.contains('open')) { closeLightbox(); return; }
    if (photosModal.classList.contains('open')) { closePhotosModal(); return; }
  }
});

/* ─── Utility ────────────────────────────────────────────── */

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ─── Start ──────────────────────────────────────────────── */
boot();

window.cancelJob = async function(jobId) {
  if (!confirm('Are you sure you want to cancel this service request?')) return;
  try {
    await api('PATCH', `/api/jobs/${jobId}/cancel`);
    showToast('Service cancelled successfully.', 'success');
    await loadJobs();
  } catch (err) {
    showToast('Error cancelling: ' + (err.message || ''), 'error');
  }
};

window.deleteJob = async function(jobId) {
  if (!confirm('Do you want to delete this service from your list? This action cannot be undone.')) return;
  try {
    await api('DELETE', `/api/jobs/${jobId}`);
    showToast('Service deleted successfully.', 'success');
    await loadJobs();
  } catch (err) {
    showToast('Error deleting: ' + (err.message || ''), 'error');
  }
};

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────
function openChangePasswordModal() {
  document.getElementById('changePasswordForm').reset();
  const modal = document.getElementById('changePasswordModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}
function closeChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 300);
}
async function submitChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('cpCurrent').value;
  const newPassword = document.getElementById('cpNew').value;
  const confirmPassword = document.getElementById('cpConfirm').value;
  
  if (newPassword !== confirmPassword) return showToast('The new password and confirmation do not match', 'error');
  if (newPassword.length < 6) return showToast('The new password must be at least 6 characters', 'error');
  
  const btn = document.getElementById('cpSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  try {
    const res = await fetch('/api/me/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error changing password');
    
    showToast('Password changed successfully!', 'success');
    closeChangePasswordModal();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Password';
  }
}

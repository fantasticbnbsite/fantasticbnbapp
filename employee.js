/**
 * employee.js — CleanOps Employee Portal
 * Fantastic BNB | vanilla JS, no dependencies
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   APP NAMESPACE
───────────────────────────────────────────────────────────────── */
const App = (() => {

  /* ── State ───────────────────────────────────────────────────── */
  let currentUser = null;
  let allJobs = [];
  let payslipMonth = currentMonthString();   // 'YYYY-MM'
  let payslipData = null;

  /* ── Status config ───────────────────────────────────────────── */
  const STATUS_CONFIG = {
    pending:     { label: 'Pendente',     color: '#706356', order: 0 },
    assigned:    { label: 'Designado',    color: '#5B8DEF', order: 1 },
    accepted:    { label: 'Aceito',       color: '#FFB347', order: 2 },
    in_progress: { label: 'Em andamento', color: '#16756b', order: 3 },
    completed:   { label: 'Concluído',    color: '#34C38F', order: 4 },
  };

  const STATUS_DISPLAY_ORDER = ['in_progress', 'accepted', 'assigned', 'pending', 'completed'];

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */
  async function init() {
    setupLoginForm();
    await checkAuth();
  }

  /* ── Auth check ─────────────────────────────────────────────── */
  async function checkAuth() {
    try {
      const data = await apiFetch('/api/auth/me');
      if (!data || !data.user) { showLogin(); return; }
      if (data.user.role !== 'employee') { showLogin('Acesso restrito a funcionários.'); return; }
      currentUser = data.user;
      showApp();
    } catch {
      showLogin();
    }
  }

  function showLogin(msg) {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appShell').classList.remove('visible');
    if (msg) showLoginError(msg);
  }

  function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appShell').classList.add('visible');

    // Populate user info
    const initials = getInitials(currentUser.name);
    document.getElementById('sidebarAvatarDesktop').textContent = initials;
    document.getElementById('sidebarNameDesktop').textContent   = currentUser.name;

    // Date header
    const now = new Date();
    document.getElementById('servicesDate').textContent =
      now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    switchView('services');
  }

  /* ══════════════════════════════════════════════════════════════
     LOGIN
  ══════════════════════════════════════════════════════════════ */
  function setupLoginForm() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      const email    = document.getElementById('emailInput').value.trim();
      const password = document.getElementById('passwordInput').value;

      hideLoginError();
      setButtonLoading(btn, true);

      try {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (!data || !data.user) {
          showLoginError('Credenciais inválidas. Tente novamente.');
          return;
        }
        if (data.user.role !== 'employee') {
          showLoginError('Acesso restrito. Este portal é para funcionários.');
          return;
        }

        currentUser = data.user;
        showApp();
      } catch (err) {
        showLoginError(err.message || 'Erro ao fazer login. Tente novamente.');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  function showLoginError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg;
    el.style.display = 'block';
  }

  function hideLoginError() {
    const el = document.getElementById('loginError');
    el.style.display = 'none';
    el.textContent = '';
  }

  /* ══════════════════════════════════════════════════════════════
     VIEW SWITCHING
  ══════════════════════════════════════════════════════════════ */
  function switchView(view) {
    const views = { services: 'viewServices', payslip: 'viewPayslip' };

    // Show / hide views
    Object.entries(views).forEach(([key, id]) => {
      document.getElementById(id).classList.toggle('hidden', key !== view);
    });

    // Update nav active states
    document.querySelectorAll('[data-view]').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });

    // Load view data
    if (view === 'services') loadServices();
    if (view === 'payslip') loadPayslip();
  }

  /* ══════════════════════════════════════════════════════════════
     SERVICES VIEW
  ══════════════════════════════════════════════════════════════ */
  async function loadServices() {
    const container = document.getElementById('jobsContainer');
    container.innerHTML = loadingHTML('A carregar serviços…');

    try {
      const data = await apiFetch('/api/jobs/mine');
      allJobs = data.jobs || [];
      renderServices();
    } catch (err) {
      container.innerHTML = errorHTML('Não foi possível carregar os serviços.', loadServices);
    }
  }

  function renderServices() {
    updateSummary();
    renderJobGroups();
  }

  function updateSummary() {
    const now = new Date();
    const monthStr = currentMonthString();

    const inProgressCount = allJobs.filter(j => j.status === 'in_progress').length;
    const pendingCount     = allJobs.filter(j => j.status === 'assigned' || j.status === 'accepted').length;

    const completedThisMonth = allJobs.filter(j => {
      if (j.status !== 'completed') return false;
      const date = new Date(j.finishedAt || j.requestedDate);
      return date.toISOString().slice(0, 7) === monthStr;
    });

    const earningsThisMonth = completedThisMonth.reduce((sum, j) => sum + (j.employeeAmount || 0), 0);

    document.getElementById('summaryInProgress').textContent = inProgressCount;
    document.getElementById('summaryPending').textContent    = pendingCount;
    document.getElementById('summaryCompleted').textContent  = completedThisMonth.length;
    document.getElementById('summaryEarnings').textContent   = formatCurrency(earningsThisMonth);
  }

  function renderJobGroups() {
    const container = document.getElementById('jobsContainer');

    if (allJobs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="es-icon">🧹</div>
          <div class="es-text">Nenhum serviço encontrado</div>
        </div>`;
      return;
    }

    // Group by status
    const grouped = {};
    for (const status of STATUS_DISPLAY_ORDER) {
      grouped[status] = [];
    }
    allJobs.forEach(job => {
      if (grouped[job.status]) grouped[job.status].push(job);
      else grouped[job.status] = [job];
    });

    // Sort each group: most recent first
    Object.keys(grouped).forEach(status => {
      grouped[status].sort((a, b) =>
        new Date(b.requestedDate || b.createdAt) - new Date(a.requestedDate || a.createdAt)
      );
    });

    let html = '';
    for (const status of STATUS_DISPLAY_ORDER) {
      const jobs = grouped[status];
      if (!jobs || jobs.length === 0) continue;

      const cfg = STATUS_CONFIG[status] || { label: status, color: '#706356' };
      html += `
        <div class="status-group">
          <div class="status-group-header">
            <div class="status-dot" style="background:${cfg.color}"></div>
            <h3>${cfg.label}</h3>
            <span class="status-count">${jobs.length}</span>
          </div>
          ${jobs.map(job => renderJobCard(job)).join('')}
        </div>`;
    }

    container.innerHTML = html;

    // Attach events for photo inputs
    container.querySelectorAll('.photo-input-hidden').forEach(input => {
      input.addEventListener('change', handlePhotoChange);
    });

    // Load photos for in_progress jobs
    allJobs.filter(j => j.status === 'in_progress').forEach(job => {
      loadJobPhotos(job.id);
    });

    // Load photos for completed jobs
    allJobs.filter(j => j.status === 'completed').forEach(job => {
      loadJobPhotos(job.id, true);
    });
  }

  function renderJobCard(job) {
    const cfg   = STATUS_CONFIG[job.status] || { label: job.status, color: '#706356' };
    const date  = job.requestedDate ? formatDate(job.requestedDate) : '—';
    const notes = job.notes ? escapeHtml(job.notes) : '';

    let actionsHtml = '';
    let extraHtml   = '';

    if (job.status === 'assigned') {
      actionsHtml = `
        <div style="display:flex;gap:8px;width:100%;">
          <button class="btn btn-accept" style="flex:1;" onclick="App.acceptJob('${job.id}', this)">
            <span class="spinner"></span>
            <span class="btn-text">✅ Aceitar</span>
          </button>
          <button class="btn btn-finish" style="flex:1;background:#fff;border:1px solid var(--danger,#d45555);color:var(--danger,#d45555);" onclick="App.rejectJob('${job.id}', this)">
            <span class="spinner"></span>
            <span class="btn-text">❌ Recusar</span>
          </button>
        </div>`;
    }

    if (job.status === 'accepted') {
      actionsHtml = `
        <button class="btn btn-start" onclick="App.startJob('${job.id}', this)">
          <span class="spinner"></span>
          <span class="btn-text">▶️ Iniciar</span>
        </button>`;
    }

    if (job.status === 'in_progress') {
      actionsHtml = `
        <div class="employee-notes-wrapper" style="margin-bottom: 12px;">
          <textarea id="obs-${job.id}" class="form-input" rows="2" placeholder="Alguma observação sobre a limpeza? (Opcional)"></textarea>
        </div>
        <button class="btn btn-finish" onclick="App.finishJob('${job.id}', this)">
          <span class="spinner"></span>
          <span class="btn-text">🏁 Finalizar</span>
        </button>`;

      extraHtml = `
        <div class="photo-section">
          <div class="photo-section-title">📸 Fotos do Serviço</div>
          <div class="photo-thumbnails" id="photos-${job.id}">
            <!-- loaded async -->
          </div>
          <label class="photo-upload-label" for="photo-input-${job.id}">
            📎 Adicionar Foto
          </label>
          <input
            type="file"
            accept="image/*"
            class="photo-input-hidden"
            id="photo-input-${job.id}"
            data-job-id="${job.id}"
          />
        </div>`;
    }

    if (job.status === 'completed') {
      extraHtml = `
        <div class="job-completed-details">
          <div class="completed-stat">
            <div class="cs-label">Duração</div>
            <div class="cs-value">${formatHours(job.durationHours)}</div>
          </div>
          <div class="completed-stat">
            <div class="cs-label">Ganho</div>
            <div class="cs-value">${formatCurrency(job.employeeAmount)}</div>
          </div>
          ${job.finishedAt ? `
          <div class="completed-stat">
            <div class="cs-label">Concluído em</div>
            <div class="cs-value" style="font-size:0.85rem">${formatDate(job.finishedAt)}</div>
          </div>` : ''}
        </div>
        <div class="photo-section" style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px;">
          <div class="photo-section-title">📸 Fotos</div>
          <div class="photo-thumbnails" id="photos-${job.id}"></div>
        </div>`;
    }

    const timeFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
    let timelineHtml = '';
    if (job.startedAt) timelineHtml += `<span style="color:#16756b; font-weight:600; margin-right:12px;">🟢 Início: ${timeFmt.format(new Date(job.startedAt))} (UK)</span>`;
    if (job.finishedAt) timelineHtml += `<span style="color:#d45555; font-weight:600;">🔴 Término: ${timeFmt.format(new Date(job.finishedAt))} (UK)</span>`;
    const timelineBlock = timelineHtml ? `<div class="job-notes" style="margin-top:2px;font-size:0.85rem;">${timelineHtml}</div>` : '';

    return `
      <div class="job-card" id="card-${job.id}">
        <div class="job-card-header">
          <div class="job-card-info">
            <div class="job-address">${escapeHtml(job.flatAddress || 'Endereço não informado')}</div>
            <div class="job-meta">
              <span class="job-date">📅 ${date}</span>
              <span class="status-badge ${job.status}">
                <span class="dot"></span>
                ${cfg.label}
              </span>
            </div>
          </div>
        </div>
        ${notes ? `<div class="job-notes">💬 ${notes}</div>` : ''}
        ${timelineBlock}
        ${actionsHtml ? `<div class="job-actions">${actionsHtml}</div>` : ''}
        ${extraHtml}
      </div>`;
  }

  /* ── Job Photos ─────────────────────────────────────────────── */
  async function loadJobPhotos(jobId, readOnly = false) {
    const container = document.getElementById(`photos-${jobId}`);
    if (!container) return;

    try {
      const data = await apiFetch(`/api/jobs/${jobId}/photos`);
      const photos = data.photos || [];
      renderPhotoThumbs(container, photos);
    } catch {
      // silently fail – photos are non-critical
    }
  }

  function renderPhotoThumbs(container, photos) {
    if (photos.length === 0) return;
    const html = photos.map(p => `
      <img
        class="photo-thumb"
        src="/uploads/${encodeURIComponent(p.filename)}"
        alt="${escapeHtml(p.originalName || p.filename)}"
        title="${escapeHtml(p.originalName || p.filename)}"
        onclick="App.openLightbox(this.src)"
        loading="lazy"
      />`).join('');
    container.innerHTML += html;
  }

  async function handlePhotoChange(e) {
    const input = e.target;
    const jobId = input.dataset.jobId;
    const file  = input.files[0];
    if (!file) return;

    const container = document.getElementById(`photos-${jobId}`);

    // Show skeleton placeholder
    const skeleton = document.createElement('div');
    skeleton.className = 'photo-thumb-skeleton';
    container.appendChild(skeleton);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const data = await apiFetch(`/api/jobs/${jobId}/photos`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      skeleton.remove();

      const photo = data.photo || data;
      if (photo && photo.filename) {
        const img = document.createElement('img');
        img.className = 'photo-thumb';
        img.src = `/uploads/${encodeURIComponent(photo.filename)}`;
        img.alt = photo.originalName || photo.filename;
        img.onclick = () => App.openLightbox(img.src);
        container.appendChild(img);
        showToast('Foto enviada com sucesso!', 'success');
      }
    } catch (err) {
      skeleton.remove();
      showToast('Erro ao enviar foto: ' + (err.message || 'Tente novamente'), 'error');
    }

    // Reset input so same file can be re-selected
    input.value = '';
  }

  /* ── Job Actions ────────────────────────────────────────────── */
  async function acceptJob(jobId, btn) {
    setButtonLoading(btn, true);
    try {
      await apiFetch(`/api/jobs/${jobId}/accept`, { method: 'PATCH' });
      showToast('Serviço aceito com sucesso!', 'success');
      updateJobStatus(jobId, 'accepted');
    } catch (err) {
      showToast('Erro ao aceitar serviço: ' + (err.message || ''), 'error');
      setButtonLoading(btn, false);
    }
  }

  async function rejectJob(jobId, btn) {
    if (!confirm('Deseja realmente recusar este serviço? Ele será devolvido à gerência.')) return;
    setButtonLoading(btn, true);
    try {
      await apiFetch(`/api/jobs/${jobId}/reject`, { method: 'PATCH' });
      showToast('Serviço recusado.', 'success');
      allJobs = allJobs.filter(j => String(j.id) !== String(jobId));
      renderServices();
    } catch (err) {
      showToast('Erro ao recusar serviço: ' + (err.message || ''), 'error');
      setButtonLoading(btn, false);
    }
  }

  async function startJob(jobId, btn) {
    setButtonLoading(btn, true);
    try {
      await apiFetch(`/api/jobs/${jobId}/start`, { method: 'PATCH' });
      showToast('Serviço iniciado!', 'success');
      updateJobStatus(jobId, 'in_progress');
    } catch (err) {
      showToast('Erro ao iniciar serviço: ' + (err.message || ''), 'error');
      setButtonLoading(btn, false);
    }
  }

  async function finishJob(jobId, btn) {
    setButtonLoading(btn, true);
    try {
      const obsInput = document.getElementById('obs-' + jobId);
      const employeeNotes = obsInput ? obsInput.value : '';
      const data = await apiFetch(`/api/jobs/${jobId}/finish`, { 
        method: 'PATCH',
        body: JSON.stringify({ employeeNotes })
      });
      showToast('Serviço concluído! 🎉', 'success');
      // Merge returned job data if available
      if (data && data.job) {
        const idx = allJobs.findIndex(j => String(j.id) === String(jobId));
        if (idx !== -1) allJobs[idx] = { ...allJobs[idx], ...data.job };
      } else {
        updateJobStatus(jobId, 'completed');
      }
      renderServices();
    } catch (err) {
      showToast('Erro ao finalizar serviço: ' + (err.message || ''), 'error');
      setButtonLoading(btn, false);
    }
  }

  function updateJobStatus(jobId, newStatus) {
    const idx = allJobs.findIndex(j => String(j.id) === String(jobId));
    if (idx !== -1) allJobs[idx].status = newStatus;
    renderServices();
  }

  /* ══════════════════════════════════════════════════════════════
     PAYSLIP VIEW
  ══════════════════════════════════════════════════════════════ */
  async function loadPayslip() {
    const container = document.getElementById('payslipContainer');
    const footer = document.getElementById('payslipFooter');
    
    footer.classList.add('hidden');
    container.innerHTML = loadingHTML('A carregar holerites...');

    try {
      const data = await apiFetch(`/api/finance/payrolls/mine?month=${payslipMonth}`);
      renderPayslip(data);
    } catch (err) {
      container.innerHTML = errorHTML('Não foi possível carregar os holerites.', loadPayslip);
    }
  }

  function renderPayslip(data) {
    const container = document.getElementById('payslipContainer');
    const entries   = data.entries || [];
    const totalHours  = data.totalHours  || 0;
    const totalAmount = data.totalAmount || 0;

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="payslip-empty">
          <div class="pe-icon">📭</div>
          <div>Nenhum serviço concluído neste mês</div>
        </div>`;
      return;
    }

    const rows = entries.map(e => `
      <tr>
        <td>${e.date ? formatDate(e.date) : '—'}</td>
        <td>${escapeHtml(e.flatAddress || '—')}</td>
        <td class="hours">${formatHours(e.durationHours)}</td>
        <td class="amount">${formatCurrency(e.employeeAmount)}</td>
      </tr>`).join('');

    container.innerHTML = `
      <div class="payslip-totals">
        <div class="total-item">
          <div class="t-label">Total de Horas</div>
          <div class="t-value">${totalHours.toFixed(1)}h</div>
        </div>
        <div class="total-item">
          <div class="t-label">Total a Receber</div>
          <div class="t-value">${formatCurrency(totalAmount)}</div>
        </div>
        <div class="total-item">
          <div class="t-label">Serviços</div>
          <div class="t-value" style="color:var(--primary)">${entries.length}</div>
        </div>
      </div>
      <div class="payslip-table-wrap">
        <table class="payslip-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Imóvel</th>
              <th>Horas</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
      
    document.getElementById('payslipFooter').classList.remove('hidden');
  }

  function changePayslipMonth(delta) {
    const [year, month] = payslipMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    payslipMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    loadPayslip();
  }

  function printPayslip() {
    window.open(`/print/payslip/mine?month=${payslipMonth}`, '_blank');
  }

  /* ══════════════════════════════════════════════════════════════
     LIGHTBOX
  ══════════════════════════════════════════════════════════════ */
  function openLightbox(src) {
    const lb  = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    img.src = src;
    lb.classList.add('open');
  }

  /* ══════════════════════════════════════════════════════════════
     LOGOUT
  ══════════════════════════════════════════════════════════════ */
  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    currentUser = null;
    allJobs = [];
    showLogin();
  }

  /* ══════════════════════════════════════════════════════════════
     API HELPER
  ══════════════════════════════════════════════════════════════ */
  async function apiFetch(url, options = {}) {
    const { isFormData, ...rest } = options;

    const fetchOptions = {
      credentials: 'include',
      ...rest,
    };

    if (!isFormData && rest.body && typeof rest.body === 'string') {
      fetchOptions.headers = {
        'Content-Type': 'application/json',
        ...(rest.headers || {}),
      };
    }

    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      currentUser = null;
      showLogin('Sessão expirada. Por favor, faça login novamente.');
      throw new Error('Não autorizado');
    }

    if (!response.ok) {
      let errMsg = `Erro ${response.status}`;
      try {
        const errData = await response.json();
        errMsg = errData.message || errData.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    // Some PATCH/POST responses may be empty
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return {};
  }

  /* ══════════════════════════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════════════════════════ */
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  }

  /* ══════════════════════════════════════════════════════════════
     UI HELPERS
  ══════════════════════════════════════════════════════════════ */
  function setButtonLoading(btn, loading) {
    btn.disabled = loading;
    btn.classList.toggle('loading', loading);
  }

  function loadingHTML(msg = 'A carregar…') {
    return `
      <div class="loading-overlay">
        <div class="big-spinner"></div>
        <span>${msg}</span>
      </div>`;
  }

  function errorHTML(msg, retryFn) {
    const fnName = retryFn ? retryFn.name : '';
    return `
      <div class="empty-state">
        <div class="es-icon">⚠️</div>
        <div class="es-text">${msg}</div>
        ${fnName ? `<br><button class="btn btn-photo" style="margin:8px auto" onclick="App.${fnName}()">Tentar novamente</button>` : ''}
      </div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     UTILITY FUNCTIONS
  ══════════════════════════════════════════════════════════════ */
  function currentMonthString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  function formatHours(h) {
    if (h == null) return '—';
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    if (mm === 0) return `${hh}h`;
    return `${hh}h ${String(mm).padStart(2, '0')}m`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return '£0.00';
    return `£${Number(amount).toFixed(2)}`;
  }

  function getInitials(name = '') {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Public API ─────────────────────────────────────────────── */
  return {
    init,
    switchView,
    acceptJob,
    rejectJob,
    startJob,
    finishJob,
    changePayslipMonth,
    printPayslip,
    openLightbox,
    logout,
    loadServices,  // exposed for retry button
    loadPayslip,   // exposed for retry button
  };

})();

/* ── Bootstrap ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => App.init());

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
  
  if (newPassword !== confirmPassword) return App.showToast('A nova senha e a confirmacao nao coincidem', 'error');
  if (newPassword.length < 6) return App.showToast('A nova senha deve ter no minimo 6 caracteres', 'error');
  
  const btn = document.getElementById('cpSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Salvando...';
  
  try {
    const res = await fetch('/api/me/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro ao trocar senha');
    
    App.showToast('Senha alterada com sucesso!', 'success');
    closeChangePasswordModal();
  } catch (err) {
    App.showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Senha';
  }
}

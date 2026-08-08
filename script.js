const state = {
  user: null,
  clients: [],
  selectedClientId: null,
  config: null,
  records: [],
  users: [],
  overview: null,
  holerites: null,
  cleanings: [],
  cleaners: [],
  cleaningClients: [],
  generatedInvoices: [],
  generatedPayrolls: [],
  cleaningFilters: { from: '', to: '' },
  sort: 'updated_at',
  direction: 'DESC',
  filters: { search: '', status: '', filterField: '', filterValue: '' },
  editingRecord: null,
  flats: [],
};

const CLEANING_STORAGE_KEY = 'fantastic-cleanings-v1';
const CLEANER_STORAGE_KEY = 'fantastic-cleaners-v1';
const CLEANING_CLIENT_STORAGE_KEY = 'fantastic-cleaning-clients-v1';
const CLEANING_ID_COUNTER_STORAGE_KEY = 'fantastic-cleaning-id-counter-v1';
const GENERATED_INVOICES_STORAGE_KEY = 'fantastic-generated-invoices-v1';
const GENERATED_PAYROLLS_STORAGE_KEY = 'fantastic-generated-payrolls-v1';
const CLEANING_INVOICE_GROUPS = {
  default: [
    { name: 'Padrao', billingType: 'hourly', flats: [], flatRates: {} }
  ]
};
const CLEANING_SEED = [];
const CLEANER_SEED = [];
const CLEANING_CLIENT_SEED = [];

const $ = (selector) => document.querySelector(selector);
const els = {
  loginScreen: $('#loginScreen'),
  appShell: $('#appShell'),
  loginForm: $('#loginForm'),
  loginFeedback: $('#loginFeedback'),
  logoutButton: $('#logoutButton'),
  userPill: $('#userPill'),
  welcomeTitle: $('#welcomeTitle'),
  sidebarHint: $('#sidebarHint'),
  clientSelector: $('#clientSelector'),
  searchInput: $('#searchInput'),
  statusFilter: $('#statusFilter'),
  fieldFilter: $('#fieldFilter'),
  fieldFilterValue: $('#fieldFilterValue'),
  sortButton: $('#sortButton'),
  exportButton: $('#exportButton'),
  importInput: $('#importInput'),
  newRecordButton: $('#newRecordButton'),
  recordsSummary: $('#recordsSummary'),
  recordsHead: $('#recordsTable thead'),
  recordsBody: $('#recordsTable tbody'),
  statusLegend: $('#statusLegend'),
  overviewStats: $('#overviewStats'),
  clientsList: $('#clientsList'),
  backupList: $('#backupList'),
  usersList: $('#usersList'),
  clientForm: $('#clientForm') || document.createElement('form'),
  clientSubmitButton: $('#clientSubmitButton') || document.createElement('button'),
  clientCancelEdit: $('#clientCancelEdit') || document.createElement('button'),
  clientCreateBillingType: $('#clientCreateBillingType') || document.createElement('select'),
  clientCreateHourlyFields: $('#clientCreateHourlyFields') || document.createElement('div'),
  clientCreateProjectFields: $('#clientCreateProjectFields') || document.createElement('div'),
  userForm: $('#userForm'),
  recordModal: $('#recordModal'),
  recordForm: $('#recordForm'),
  modalTitle: $('#modalTitle'),
  closeModalButton: $('#closeModalButton'),
  historyDrawer: $('#historyDrawer'),
  historyTitle: $('#historyTitle'),
  historyList: $('#historyList'),
  closeHistoryButton: $('#closeHistoryButton'),
  toast: $('#toast'),
  navLinks: [...document.querySelectorAll('.nav-link')],
  cadastroTabs: [...document.querySelectorAll('[data-cadastro-view]')],
  cadastroPanels: [...document.querySelectorAll('[data-cadastro-panel]')],
  collaboratorForm: $('#collaboratorForm'),
  holeriteEntryForm: $('#holeriteEntryForm'),
  holeriteCollaboratorSelect: $('#holeriteCollaboratorSelect'),
  holeritesStats: $('#holeritesStats'),
  collaboratorsList: $('#collaboratorsList'),
  holeritesHighlights: $('#holeritesHighlights'),
  holeritesHead: $('#holeritesTable thead'),
  holeritesBody: $('#holeritesTable tbody'),
  holeritesTitle: $('#holeritesTitle'),
  holeritesSubtitle: $('#holeritesSubtitle'),
  holeritesTableSubtitle: $('#holeritesTableSubtitle'),
  cleanerForm: $('#cleanerForm'),
  cleanerSubmitButton: $('#cleanerSubmitButton'),
  cleanerCancelEdit: $('#cleanerCancelEdit'),
  cleanerManageSelect: $('#cleanerManageSelect'),
  editSelectedCleaner: $('#editSelectedCleaner'),
  deleteSelectedCleaner: $('#deleteSelectedCleaner'),
  selectedCleanerHint: $('#selectedCleanerHint'),
  cleanersList: $('#cleanersList'),
  cleaningClientForm: $('#cleaningClientForm') || document.createElement('form'),
  clientConfigSelect: $('#clientConfigSelect') || document.createElement('select'),
  editSelectedClient: $('#editSelectedClient') || document.createElement('button'),
  deleteSelectedClient: $('#deleteSelectedClient') || document.createElement('button'),
  selectedGroupFlatsList: $('#selectedGroupFlatsList') || document.createElement('div'),
  selectedGroupHint: $('#selectedGroupHint') || document.createElement('div'),
  billingTypeSelect: $('#billingTypeSelect') || document.createElement('select'),
  hourlyPricingFields: $('#hourlyPricingFields') || document.createElement('div'),
  projectPricingFields: $('#projectPricingFields') || document.createElement('div'),
  clientConfigSubmitButton: $('#clientConfigSubmitButton') || document.createElement('button'),
  clientGroupsList: $('#clientGroupsList') || document.createElement('div'),
  cleaningForm: $('#cleaningForm'),
  cleaningSubmitButton: $('#cleaningSubmitButton'),
  cleaningCancelEdit: $('#cleaningCancelEdit'),
  cleaningClientSelect: $('#cleaningClientSelect'),
  cleaningInvoiceGroup: $('#cleaningInvoiceGroup'),
  cleanerSelect: $('#cleanerSelect'),
  cleaningFlatSelect: $('#cleaningFlatSelect'),
  cleaningBillTo: $('#cleaningBillTo'),
  detectedDayType: $('#detectedDayType'),
  detectedBillingType: $('#detectedBillingType'),
  detectedClientRate: $('#detectedClientRate'),
  detectedStaffRate: $('#detectedStaffRate'),
  cleaningStats: $('#cleaningStats'),
  financeStats: $('#financeStats'),
  invoiceSummaryList: $('#invoiceSummaryList'),
  financePayrollList: $('#financePayrollList'),
  generateInvoicesButton: $('#generateInvoicesButton'),
  generatePayrollsButton: $('#generatePayrollsButton'),
  invoicePeriodFrom: $('#invoicePeriodFrom'),
  invoicePeriodTo: $('#invoicePeriodTo'),
  invoicePeriodReset: $('#invoicePeriodReset'),
  generatedInvoiceClientFilter: $('#generatedInvoiceClientFilter'),
  generatedInvoiceFrom: $('#generatedInvoiceFrom'),
  generatedInvoiceTo: $('#generatedInvoiceTo'),
  generatedInvoicesList: $('#generatedInvoicesList'),
  generatedPayrollCleanerFilter: $('#generatedPayrollCleanerFilter'),
  generatedPayrollFrom: $('#generatedPayrollFrom'),
  generatedPayrollTo: $('#generatedPayrollTo'),
  generatedPayrollsList: $('#generatedPayrollsList'),
  cleaningHead: $('#cleaningTable thead'),
  cleaningBody: $('#cleaningTable tbody'),
  adminOnlyBlocks: [...document.querySelectorAll('.admin-only-block')],
  adminNavs: [...document.querySelectorAll('.admin-nav')],
  adminOnly: [...document.querySelectorAll('.admin-only')],
  views: {
    overview: $('#overviewView'),
    cleaners: $('#cleanersView'),
    cleaningLaunches: $('#cleaningLaunchesView'),
    finance: $('#financeView'),
    records: $('#recordsView'),
    holerites: $('#holeritesView'),
    admin: $('#adminView'),
    jobs: $('#jobsView'),
    flats: $('#flatsView'),
    config: $('#configView'),
    dashboard: $('#dashboardView'),
  },
};

boot();

async function boot() {
  localStorage.removeItem(CLEANING_STORAGE_KEY);
  localStorage.removeItem(CLEANER_STORAGE_KEY);
  localStorage.removeItem(CLEANING_CLIENT_STORAGE_KEY);
  localStorage.removeItem(GENERATED_INVOICES_STORAGE_KEY);
  localStorage.removeItem(GENERATED_PAYROLLS_STORAGE_KEY);
  bindEvents();
  try {
    const session = await api('/api/me');
    state.user = session.user;
    if (state.user.role === 'client' || state.user.role === 'client_user') {
      window.location.href = '/client.html';
      return;
    }
    if (state.user.role === 'employee') {
      window.location.href = '/employee.html';
      return;
    }
    showPushBanner();
    await loadApp();
    showApp();
  } catch {
    showLogin();
  }
}

function showPushBanner() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  // if (localStorage.getItem('hidePushBanner') === 'true') return;
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
      <strong style="color:var(--text);font-size:0.95rem;">Ativar Notificações</strong><br/>
      <small style="color:var(--text-light);font-size:0.8rem;">Receba atualizações de status.</small>
    </div>
    <div style="display:flex; gap:8px;">
      <button id="push-dismiss" style="background:none; border:none; color:var(--muted); font-weight:bold; font-size:0.85rem; padding:8px;">Agora não</button>
      <button id="push-activate" class="btn-primary" style="padding:8px 16px;font-size:0.85rem;width:auto;">Ativar</button>
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
        alert('Permissão concedida! Você receberá uma notificação de teste em instantes.');
      } else if (permission === 'denied') {
        banner.remove();
        alert('Notificações bloqueadas nas configurações do seu navegador.');
      } else {
        alert('Permissão ignorada. Para receber avisos, você precisa clicar em "Permitir" na mensagem do navegador.');
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
      const res = await api('/api/push/vapidPublicKey');
      const vapidPublicKey = res.publicKey;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }
    await api('/api/push/subscribe', { method: 'POST', body: sub });
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

function bindEvents() { window.onerror = function(msg, url, lineNo, columnNo, error) { alert("Error: " + msg + "\nLine: " + lineNo + "\nCol: " + columnNo + "\nError obj: " + JSON.stringify(error)); return false; };
  els.loginForm.addEventListener('submit', onLogin);
  els.logoutButton.addEventListener('click', onLogout);
  els.clientSelector.addEventListener('change', async (event) => {
    state.selectedClientId = Number(event.target.value);
    await refreshClientContext();
  });
  els.searchInput.addEventListener('input', debounce(async (event) => {
    state.filters.search = event.target.value.trim();
    await loadRecords();
  }, 250));
  els.statusFilter.addEventListener('change', async (event) => {
    state.filters.status = event.target.value;
    await loadRecords();
  });
  els.fieldFilter.addEventListener('change', async (event) => {
    state.filters.filterField = event.target.value;
    await loadRecords();
  });
  els.fieldFilterValue.addEventListener('input', debounce(async (event) => {
    state.filters.filterValue = event.target.value.trim();
    await loadRecords();
  }, 250));
  els.sortButton.addEventListener('click', async () => {
    cycleSort();
    await loadRecords();
  });
  els.exportButton.addEventListener('click', onExport);
  els.importInput.addEventListener('change', onImport);
  els.newRecordButton.addEventListener('click', () => openRecordModal());
  els.closeModalButton.addEventListener('click', closeRecordModal);
  els.closeHistoryButton.addEventListener('click', closeHistoryDrawer);
  els.recordModal.addEventListener('click', (event) => { if (event.target === els.recordModal) closeRecordModal(); });
  els.historyDrawer.addEventListener('click', (event) => { if (event.target === els.historyDrawer) closeHistoryDrawer(); });
  els.clientForm.addEventListener('submit', onCreateClient);
  els.clientCancelEdit?.addEventListener('click', resetClientForm);
  els.userForm.addEventListener('submit', onCreateUser);
  document.getElementById('userCancelEdit')?.addEventListener('click', resetUserForm);
  const userRoleSelect = document.getElementById('userRoleSelect');
  const userHourlyRateContainer = document.getElementById('userHourlyRateContainer');
  const userParentClientContainer = document.getElementById('userParentClientContainer');
  const userParentClientSelect = document.getElementById('userParentClientSelect');
  
  if (userRoleSelect) {
    userRoleSelect.addEventListener('change', () => {
      if (userRoleSelect.value === 'client_user') {
        const companies = (state.users || []).filter(u => u.role === 'client');
        userParentClientSelect.innerHTML = '<option value="">Selecione a empresa...</option>' + 
          companies.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        userParentClientContainer.style.display = 'block';
      } else {
        userParentClientContainer.style.display = 'none';
        userParentClientSelect.value = '';
      }
      
      if (userHourlyRateContainer) {
        userHourlyRateContainer.style.display = ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(userRoleSelect.value) ? 'block' : 'none';
      }
    });
    // Trigger initial state
    if (userParentClientContainer) userParentClientContainer.style.display = 'none';
    if (userHourlyRateContainer) userHourlyRateContainer.style.display = 'none';
  }
  els.collaboratorForm?.addEventListener('submit', onCreateCollaborator);
  els.holeriteEntryForm?.addEventListener('submit', onCreateHoleriteEntry);
  els.cleanerForm?.addEventListener('submit', onCreateCleaner);
  els.cleanerCancelEdit?.addEventListener('click', resetCleanerForm);
  els.cleanerManageSelect?.addEventListener('change', onCleanerManageChange);
  els.editSelectedCleaner?.addEventListener('click', onEditSelectedCleaner);
  els.deleteSelectedCleaner?.addEventListener('click', onDeleteSelectedCleaner);
  els.cleaningClientForm?.addEventListener('submit', onSaveClientGroup);
  els.clientConfigSelect?.addEventListener('change', onClientConfigSelectChange);
  els.editSelectedClient?.addEventListener('click', onEditSelectedClient);
  els.deleteSelectedClient?.addEventListener('click', onDeleteSelectedClient);
  els.billingTypeSelect?.addEventListener('change', syncClientPricingVisibility);
  els.cleaningForm?.addEventListener('submit', onCreateCleaning);
  els.cleaningCancelEdit?.addEventListener('click', resetCleaningForm);
  els.cleaningClientSelect?.addEventListener('change', () => onCleaningClientChange());
  els.cleaningInvoiceGroup?.addEventListener('change', syncCleaningGroupDetails);
  
  const flatForm = document.getElementById('flatForm');
  if (flatForm) {
    flatForm.addEventListener('submit', onFlatSubmit);
  }
  const flatCancelEdit = document.getElementById('flatCancelEdit');
  if (flatCancelEdit) {
    flatCancelEdit.addEventListener('click', closeFlatForm);
  }
  
  const newFlatBtn = document.getElementById('newFlatButton');
  if (newFlatBtn) {
    newFlatBtn.addEventListener('click', () => {
      // Find the client currently selected/open if any, or just open form
      openFlatForm(null);
    });
  }
  
  const flatBillingTypeSelect = document.getElementById('flatBillingType');
  if (flatBillingTypeSelect) {
    flatBillingTypeSelect.addEventListener('change', updateFlatRateFields);
  }

  els.cleanerSelect?.addEventListener('change', syncCleaningAutoFields);
  els.cleaningFlatSelect?.addEventListener('change', syncCleaningAutoFields);
  els.cleaningForm?.elements.namedItem('date')?.addEventListener('change', syncCleaningAutoFields);
  els.cleaningForm?.elements.namedItem('isHoliday')?.addEventListener('change', syncCleaningAutoFields);
  els.invoicePeriodFrom?.addEventListener('change', onInvoicePeriodChange);
  els.invoicePeriodTo?.addEventListener('change', onInvoicePeriodChange);
  els.invoicePeriodReset?.addEventListener('click', resetInvoicePeriod);
  els.generateInvoicesButton?.addEventListener('click', onGenerateInvoices);
  els.generatePayrollsButton?.addEventListener('click', onGeneratePayrolls);
  els.generatedInvoiceClientFilter?.addEventListener('change', renderGeneratedDocuments);
  els.generatedInvoiceFrom?.addEventListener('change', renderGeneratedDocuments);
  els.generatedInvoiceTo?.addEventListener('change', renderGeneratedDocuments);
  els.generatedPayrollCleanerFilter?.addEventListener('change', renderGeneratedDocuments);
  els.generatedPayrollFrom?.addEventListener('change', renderGeneratedDocuments);
  els.generatedPayrollTo?.addEventListener('change', renderGeneratedDocuments);
  els.navLinks.forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
  els.cadastroTabs.forEach((button) => button.addEventListener('click', () => switchCadastroView(button.dataset.cadastroView)));
}

async function onLogin(event) {
  event.preventDefault();
  const form = new FormData(els.loginForm);
  els.loginFeedback.textContent = '';
  try {
    const session = await api('/api/login', { method: 'POST', body: { email: form.get('email'), password: form.get('password') } });
    state.user = session.user;
    if (state.user.role === 'client' || state.user.role === 'client_user') {
      window.location.href = '/client.html';
      return;
    }
    if (state.user.role === 'employee') {
      window.location.href = '/employee.html';
      return;
    }
    await loadApp();
    showApp();
  } catch (error) {
    els.loginFeedback.textContent = error.message;
  }
}

async function onLogout() {
  await api('/api/logout', { method: 'POST' });
  location.reload();
}

async function loadApp() {
  await loadOverview();
  state.clients = (await api('/api/clients')).clients;
  state.selectedClientId = state.selectedClientId || state.clients[0]?.id || null;
  populateClientSelector();
  updateUserUi();
  updateRoleUi();
  loadCleaners();
  loadCleaningClients();
  loadCleanings();
  if (state.selectedClientId) await refreshClientContext();
  if (isAdmin()) await loadUsers();
  loadGeneratedDocuments();
  await loadHolerites();
  switchView(isCollaborator() ? 'holerites' : 'dashboard');
}

async function refreshClientContext() {
  await Promise.all([loadClientConfig(), loadRecords()]);
}

async function loadOverview() {
  state.overview = await api('/api/overview');
  renderOverview();
}

async function loadClientConfig() {
  state.config = await api(`/api/clients/${state.selectedClientId}/config`);
  populateFilters();
  renderStatusLegend();
}

async function loadRecords() {
  const params = new URLSearchParams({
    search: state.filters.search,
    status: state.filters.status,
    sort: state.sort,
    direction: state.direction,
    filterField: state.filters.filterField,
    filterValue: state.filters.filterValue,
  });
  const response = await api(`/api/clients/${state.selectedClientId}/records?${params.toString()}`);
  state.records = response.records;
  state.config = response.config;
  populateFilters();
  renderStatusLegend();
  renderRecords();
}

async function loadUsers() {
  state.users = (await api('/api/users')).users;
  state.cleaners = state.users.filter(u => ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(u.role)).map(u => ({
    name: u.name,
    weekdayRate: Number(u.hourly_rate || 0),
    weekendRate: Number(u.weekend_rate || 0),
    holidayRate: Number(u.holiday_rate || 0),
  }));
  renderUsers();
  if (typeof populateCleanerSelect === 'function') populateCleanerSelect();
  if (typeof populateJobsClientFilter === 'function') populateJobsClientFilter();
}

async function loadHolerites() {
  state.holerites = await api('/api/holerites/summary');
  renderHolerites();
}

function showLogin() {
  els.loginScreen.classList.remove('hidden');
  els.appShell.classList.add('hidden');
}

function showApp() {
  els.loginScreen.classList.add('hidden');
  els.appShell.classList.remove('hidden');
}


function switchCadastroView(view) {
  els.cadastroTabs.forEach((button) => button.classList.toggle('active', button.dataset.cadastroView === view));
  els.cadastroPanels.forEach((panel) => panel.classList.toggle('hidden', panel.dataset.cadastroPanel !== view));
}

function syncClientCreateBillingVisibility() {
  const billingType = els.clientCreateBillingType?.value || 'hourly';
  els.clientCreateHourlyFields?.classList.toggle('hidden', billingType !== 'hourly');
  els.clientCreateProjectFields?.classList.toggle('hidden', billingType !== 'project');
}

function updateUserUi() {
  const collaborator = state.user.collaborator;
  els.userPill.innerHTML = collaborator ? `<i data-lucide="user"></i> <span>${collaborator.full_name} · Colaborador</span>` : `<i data-lucide="user"></i> <span>${state.user.name} · ${state.user.role}</span>`;
  if (window.lucide) window.lucide.createIcons({ root: els.userPill });
  els.welcomeTitle.textContent = collaborator
    ? `Ola, ${collaborator.full_name.split(' ')[0]}. Seu espaco de holerites esta pronto.`
    : `Ola, ${state.user.name.split(' ')[0]}. Sua central operacional esta pronta.`;
  els.sidebarHint.textContent = collaborator
    ? 'Acesso individual liberado apenas para seus holerites.'
    : 'Painel SaaS preparado para crescer com operacao, financeiro e automacoes.';
}

function updateRoleUi() {
  const collaboratorMode = isCollaborator();
  els.adminOnly.forEach((node) => node.classList.toggle('hidden', !isAdmin()));
  els.adminOnlyBlocks.forEach((node) => node.classList.toggle('hidden', !canManageHolerites()));
  els.adminNavs.forEach((node) => node.classList.toggle('hidden', collaboratorMode));
  document.querySelectorAll('.editor-only').forEach((node) => node.classList.toggle('hidden', isViewerOnly()));
}

function populateClientSelector() {
  els.clientSelector.innerHTML = state.clients.map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`).join('');
  els.clientSelector.value = String(state.selectedClientId || '');
}

function populateFilters() {
  const statuses = state.config?.statuses || [];
  const fields = state.config?.fields || [];
  els.statusFilter.innerHTML = `<option value="">Todos os status</option>${statuses.map((status) => `<option value="${status.status_key}">${escapeHtml(status.label)}</option>`).join('')}`;
  els.fieldFilter.innerHTML = `<option value="">Filtrar por campo</option>${fields.map((field) => `<option value="${field.field_key}">${escapeHtml(field.label)}</option>`).join('')}`;
  els.statusFilter.value = state.filters.status;
  els.fieldFilter.value = state.filters.filterField;
  updateSortButton();
}

function cycleSort() {
  const cycle = ['updated_at', 'title', 'status_key', 'created_at'];
  const index = cycle.indexOf(state.sort);
  state.sort = cycle[(index + 1) % cycle.length];
  state.direction = state.sort === 'title' ? 'ASC' : 'DESC';
  updateSortButton();
}

function updateSortButton() {
  const labels = {
    updated_at: 'Ordenar por atualizacao',
    title: 'Ordenar por titulo',
    status_key: 'Ordenar por status',
    created_at: 'Ordenar por criacao',
  };
  els.sortButton.textContent = labels[state.sort];
}

function renderOverview() {
  const totals = state.overview?.totals;
  if (!totals) return;
  const cards = [
    ['Clientes ativos', totals.clients],
    ['Registros na base', totals.records],
    ['Atualizacoes hoje', totals.updatesToday],
    ['Usuarios totais', totals.users ?? '-'],
  ];
  els.overviewStats.innerHTML = cards.map(([label, value]) => `<article class="stat-card glass-card"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></article>`).join('');
  els.clientsList.innerHTML = (state.overview.clients || []).map((client) => `<div class="stack-item"><strong>${escapeHtml(client.name)}</strong><span>${escapeHtml(client.segment || 'Sem segmento')}</span><small>Slug: ${escapeHtml(client.slug)}</small></div>`).join('');
  els.backupList.innerHTML = (totals.backups || []).map((backup) => `<div class="stack-item"><strong>${escapeHtml(backup.name)}</strong><small>${new Date(backup.time).toLocaleString('pt-BR')}</small></div>`).join('');
}

function renderStatusLegend() {
  els.statusLegend.innerHTML = (state.config?.statuses || []).map((status) => `<span class="legend-badge" style="background:${hexToRgba(status.color, 0.14)}; color:${status.color}; border-color:${hexToRgba(status.color, 0.28)};">${escapeHtml(status.label)}</span>`).join('');
}

function renderRecords() {
  const fields = state.config?.fields || [];
  const headers = ['Titulo', 'Status', ...fields.map((field) => field.label), 'Atualizado em', 'Acoes'];
  els.recordsHead.innerHTML = `<tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>`;
  els.recordsBody.innerHTML = state.records.map((record) => `<tr>
    <td><strong>${escapeHtml(record.title)}</strong><div><small>ID #${record.id}</small></div></td>
    <td>${renderStatusBadge(findStatus(record.status_key), record.status_key)}</td>
    ${fields.map((field) => `<td>${escapeHtml(formatFieldValue(record.payload[field.field_key], field.field_type))}</td>`).join('')}
    <td>${formatDateTime(record.updated_at)}</td>
    <td><div class="table-actions">${isViewerOnly() ? '' : `<button class="ghost-button" data-action="edit" data-id="${record.id}">Editar</button>`}<button class="ghost-button" data-action="history" data-id="${record.id}">Historico</button>${isViewerOnly() ? '' : `<button class="ghost-button" data-action="delete" data-id="${record.id}">Excluir</button>`}</div></td>
  </tr>`).join('') || `<tr><td colspan="${headers.length}">Nenhum registro encontrado.</td></tr>`;
  els.recordsSummary.textContent = `${state.records.length} registros carregados`;
  els.recordsBody.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', async () => {
    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    if (action === 'edit') openRecordModal(id);
    if (action === 'history') openHistoryDrawer(id);
    if (action === 'delete') await deleteRecord(id);
  }));
}

function renderHolerites() {
  const data = state.holerites;
  if (!data) return;
  els.holeritesTitle.textContent = isCollaborator() ? 'Meu espaco de holerites' : 'Central de holerites';
  els.holeritesSubtitle.textContent = isCollaborator()
    ? 'Veja apenas os seus valores por hora e historico de holerites.'
    : 'Cadastre colaboradores, defina valores por hora e publique os holerites com acesso individual.';
  els.holeritesTableSubtitle.textContent = isCollaborator()
    ? 'Somente seus holerites aparecem aqui.'
    : 'Cada colaborador acessa apenas os proprios itens quando entra no sistema.';
  els.holeritesStats.innerHTML = (data.stats?.cards || []).map((item) => `<article class="holerite-stat glass-card"><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></article>`).join('');
  els.collaboratorsList.innerHTML = (data.collaborators || []).map((item) => `
    <div class="stack-item">
      <strong>${escapeHtml(item.full_name)}</strong>
      <span>${escapeHtml(item.email || '')}</span>
      <small>Dia util: ${formatCurrency(item.hourly_weekday)} · Fim de semana: ${formatCurrency(item.hourly_weekend)} · Feriado: ${formatCurrency(item.hourly_holiday)}</small>
    </div>
  `).join('') || '<div class="stack-item"><span>Nenhum colaborador cadastrado.</span></div>';
  els.holeritesHighlights.innerHTML = (data.entries || []).slice(0, 4).map((entry) => `
    <div class="stack-item">
      <strong>${escapeHtml(entry.collaborator_name)} · ${escapeHtml(entry.competence)}</strong>
      <span>${renderPayrollStatus(entry.status)}</span>
      <small>Liquido: ${formatCurrency(entry.net_amount)} · Arquivo: ${escapeHtml(entry.document_name || 'Sem arquivo')}</small>
    </div>
  `).join('') || '<div class="stack-item"><span>Sem holerites publicados.</span></div>';
  els.holeriteCollaboratorSelect.innerHTML = `<option value="">Selecione um colaborador</option>${(data.collaborators || []).map((item) => `<option value="${item.id}">${escapeHtml(item.full_name)}</option>`).join('')}`;
  els.holeritesHead.innerHTML = `<tr><th>Colaborador</th><th>Competencia</th><th>Horas uteis</th><th>Fim de semana</th><th>Feriado</th><th>Liquido</th><th>Status</th><th>Documento</th></tr>`;
  els.holeritesBody.innerHTML = (data.entries || []).map((entry) => `
    <tr>
      <td><strong>${escapeHtml(entry.collaborator_name)}</strong></td>
      <td>${escapeHtml(entry.competence)}</td>
      <td>${escapeHtml(String(entry.hours_weekday))}</td>
      <td>${escapeHtml(String(entry.hours_weekend))}</td>
      <td>${escapeHtml(String(entry.hours_holiday))}</td>
      <td>${formatCurrency(entry.net_amount)}</td>
      <td>${renderPayrollStatus(entry.status)}</td>
      <td>${escapeHtml(entry.document_name || '-')}</td>
    </tr>
  `).join('') || '<tr><td colspan="8">Nenhum holerite encontrado.</td></tr>';
  renderFinanceSummary();
}



function loadCleaners() {
  const stored = localStorage.getItem(CLEANER_STORAGE_KEY);
  state.cleaners = stored ? JSON.parse(stored) : CLEANER_SEED;
  renderCleaners();
  populateCleanerSelect();
}

function loadCleaningClients() {
  const stored = localStorage.getItem(CLEANING_CLIENT_STORAGE_KEY);
  const rawClients = stored ? JSON.parse(stored) : CLEANING_CLIENT_SEED;
  state.cleaningClients = normalizeCleaningClients(rawClients);
  syncCleaningClientCatalog();
  populateCleaningClients();
  populateClientConfigSelect();
  renderClientGroups();
}

function saveCleanings() {
  const manualCleanings = (state.cleanings || []).filter(c => !c.isJob);
  localStorage.setItem(CLEANING_STORAGE_KEY, JSON.stringify(manualCleanings));
}

function saveCleaners() {
  localStorage.setItem(CLEANER_STORAGE_KEY, JSON.stringify(state.cleaners));
}

function saveCleaningClients() {
  localStorage.setItem(CLEANING_CLIENT_STORAGE_KEY, JSON.stringify(state.cleaningClients));
}

function loadGeneratedDocuments() {
  state.generatedInvoices = JSON.parse(localStorage.getItem(GENERATED_INVOICES_STORAGE_KEY) || '[]').map((item) => ({
    ...item,
    number: isLegacyGeneratedNumber(item.number)
      ? `INV-${toCode(item.clientName, 4)}-${toCode(item.invoiceGroup, 4)}-${periodCodeFromLabel(item.periodLabel)}-${uniqueSuffix(item.createdAt || new Date().toISOString())}`
      : item.number,
  }));
  state.generatedPayrolls = JSON.parse(localStorage.getItem(GENERATED_PAYROLLS_STORAGE_KEY) || '[]').map((item) => ({
    ...item,
    number: isLegacyGeneratedNumber(item.number)
      ? `HOL-${toCode(item.cleanerName, 4)}-${periodCodeFromLabel(item.periodLabel)}-${uniqueSuffix(item.createdAt || new Date().toISOString())}`
      : item.number,
  }));
  saveGeneratedInvoices();
  saveGeneratedPayrolls();
}

function saveGeneratedInvoices() {
  localStorage.setItem(GENERATED_INVOICES_STORAGE_KEY, JSON.stringify(state.generatedInvoices));
}

function saveGeneratedPayrolls() {
  localStorage.setItem(GENERATED_PAYROLLS_STORAGE_KEY, JSON.stringify(state.generatedPayrolls));
}

function syncCleaningClientCatalog() {
  const currentNames = new Set(state.cleaningClients.map((item) => item.clientName));
  const validClientNames = new Set(state.clients.map(c => c.name));
  state.cleaningClients = state.cleaningClients.filter(c => validClientNames.has(c.clientName));
  state.clients.forEach((client) => {
    if (!currentNames.has(client.name)) {
      state.cleaningClients.push({ clientName: client.name, legalName: '', billingEmail: '', groups: [] });
    }
  });
  state.cleaningClients.sort((a, b) => a.clientName.localeCompare(b.clientName));
  saveCleaningClients();
}

function normalizeCleaningClients(rawClients) {
  return (rawClients || []).map((client) => ({
    clientName: client.clientName,
    legalName: client.legalName || '',
    billingEmail: client.billingEmail || '',
    groups: (client.groups || []).map((group) => ({
      name: group.name || group.invoiceGroup || 'Operacao principal',
      billTo: group.billTo || '',
      email: group.email || '',
      billingType: group.billingType || 'hourly',
      weekdayClientRate: Number(group.weekdayClientRate || group.clientRateWeekday || 0),
      weekendClientRate: Number(group.weekendClientRate || group.clientRateWeekend || 0),
      flats: Array.from(new Set((group.flats || []).filter(Boolean).map((flat) => String(flat).trim()))).sort((a, b) => a.localeCompare(b)),
      flatRates: Object.fromEntries(Object.entries(group.flatRates || {}).map(([flat, value]) => [String(flat).trim(), Number(value || 0)])),
    })),
  }));
}

function normalizeCleaningEntries(rawEntries) {
  return (rawEntries || []).map((entry) => ({
    ...entry,
    billingType: entry.billingType || 'hourly',
    clientRate: Number(entry.clientRate || 0),
    staffRate: Number(entry.staffRate || 0),
    extraAmount: Number(entry.extraAmount || 0),
  }));
}

function populateCleaningClients() {
  const names = state.cleaningClients.map((client) => client.clientName);
  els.cleaningClientSelect.innerHTML = names.map((name) => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`).join('');
  if (!els.cleaningClientSelect.value && names[0]) els.cleaningClientSelect.value = names[0];
  onCleaningClientChange();
}

function populateCleaningGroups(clientName) {
  const config = state.cleaningClients.find((item) => item.clientName === clientName);
  const groups = config?.groups?.length ? config.groups : (CLEANING_INVOICE_GROUPS[clientName] || CLEANING_INVOICE_GROUPS.default);
  els.cleaningInvoiceGroup.innerHTML = groups.map((group) => `<option value="${escapeAttribute(group.name)}">${escapeHtml(group.name)}</option>`).join('');
  if (!groups.some((group) => group.name === els.cleaningInvoiceGroup.value) && groups[0]) els.cleaningInvoiceGroup.value = groups[0].name;
}

function populateClientConfigSelect() {
  const names = state.cleaningClients.map((client) => client.clientName);
  els.clientConfigSelect.innerHTML = names.map((name) => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`).join('');
  if (!els.clientConfigSelect.value && names[0]) els.clientConfigSelect.value = names[0];
  syncClientPricingVisibility();
  renderClientGroups();
}

function onClientConfigSelectChange() {
  populateSelectedClientGroupForm();
  syncClientPricingVisibility();
  renderClientGroups();
  renderSelectedGroupFlats();
}

function syncClientPricingVisibility() {
  const billingType = els.billingTypeSelect?.value || 'hourly';
  els.hourlyPricingFields?.classList.toggle('hidden', billingType !== 'hourly');
  els.projectPricingFields?.classList.toggle('hidden', billingType !== 'project');
}

function populateSelectedClientGroupForm() {
  const client = state.cleaningClients.find((item) => item.clientName === els.clientConfigSelect.value);
  const group = client?.groups?.[0];
  if (!group) {
    els.cleaningClientForm.elements.namedItem('editingGroupKey').value = '';
    els.cleaningClientForm.elements.namedItem('editingFlatName').value = '';
    els.cleaningClientForm.elements.namedItem('invoiceGroup').value = '';
    els.cleaningClientForm.elements.namedItem('billTo').value = client?.legalName || '';
    els.cleaningClientForm.elements.namedItem('email').value = client?.billingEmail || '';
    els.cleaningClientForm.elements.namedItem('flat').value = '';
    els.cleaningClientForm.elements.namedItem('weekdayClientRate').value = '';
    els.cleaningClientForm.elements.namedItem('weekendClientRate').value = '';
    els.cleaningClientForm.elements.namedItem('projectFlatRate').value = '';
    els.billingTypeSelect.value = 'hourly';
    els.clientConfigSubmitButton.textContent = 'Salvar configuracao';
    return;
  }
  els.cleaningClientForm.elements.namedItem('editingGroupKey').value = `${client.clientName}::${group.name}`;
  els.cleaningClientForm.elements.namedItem('editingFlatName').value = '';
  els.cleaningClientForm.elements.namedItem('invoiceGroup').value = group.name;
  els.cleaningClientForm.elements.namedItem('billTo').value = group.billTo || client.legalName || '';
  els.cleaningClientForm.elements.namedItem('email').value = group.email || client.billingEmail || '';
  els.cleaningClientForm.elements.namedItem('flat').value = '';
  els.cleaningClientForm.elements.namedItem('weekdayClientRate').value = group.weekdayClientRate || '';
  els.cleaningClientForm.elements.namedItem('weekendClientRate').value = group.weekendClientRate || '';
  els.cleaningClientForm.elements.namedItem('projectFlatRate').value = '';
  els.billingTypeSelect.value = group.billingType || 'hourly';
  els.clientConfigSubmitButton.textContent = 'Salvar configuracao';
}

function onCleaningClientChange() {
  const clientName = els.cleaningClientSelect.value;
  populateCleaningGroups(clientName);
  syncCleaningGroupDetails();
}

function syncCleaningGroupDetails() {
  const config = getCleaningGroupConfig(els.cleaningClientSelect.value, els.cleaningInvoiceGroup.value);
  const flats = config?.flats || [];
  els.cleaningFlatSelect.innerHTML = flats.length
    ? flats.map((flat) => `<option value="${escapeAttribute(flat)}">${escapeHtml(flat)}</option>`).join('')
    : '<option value="">Nenhum flat cadastrado</option>';
  els.cleaningBillTo.value = config?.billTo || '';
  syncCleaningAutoFields();
}

function populateCleanerSelect() {
  if (!els.cleanerSelect) return;
  els.cleanerSelect.innerHTML = `<option value="">Selecione o cleaner</option>${state.cleaners.map((cleaner) => `<option value="${escapeAttribute(cleaner.name)}">${escapeHtml(cleaner.name)}</option>`).join('')}`;
  syncCleaningAutoFields();
}

function populateCleanerManageSelect() {
  if (!els.cleanerManageSelect) return;
  els.cleanerManageSelect.innerHTML = state.cleaners.length
    ? state.cleaners.map((cleaner) => `<option value="${escapeAttribute(cleaner.name)}">${escapeHtml(cleaner.name)}</option>`).join('')
    : '<option value="">Nenhum cleaner cadastrado</option>';
  if (!state.cleaners.some((cleaner) => cleaner.name === els.cleanerManageSelect.value) && state.cleaners[0]) {
    els.cleanerManageSelect.value = state.cleaners[0].name;
  }
}

function onCleanerManageChange() {
  renderCleaners();
}






async function onCreateCleaner(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const cleaner = {
    name: String(form.get('name') || '').toUpperCase(),
    weekdayRate: Number(form.get('weekdayRate') || 0),
    weekendRate: Number(form.get('weekendRate') || 0),
    holidayRate: Number(form.get('holidayRate') || 0),
  };
  const editingName = String(form.get('editingCleanerName') || '');
  if (editingName) {
    state.cleaners = state.cleaners.map((item) => item.name === editingName ? cleaner : item);
  } else {
    state.cleaners.push(cleaner);
  }
  state.cleaners.sort((a, b) => a.name.localeCompare(b.name));
  saveCleaners();
  if (els.cleanerManageSelect) els.cleanerManageSelect.value = cleaner.name;
  resetCleanerForm();
  renderCleaners();
  populateCleanerSelect();
  toast(editingName ? 'Cleaner atualizado com sucesso!' : 'Cleaner cadastrado com sucesso!', 'success');
}


function resetCleanerForm() {
  els.cleanerForm.reset();
  els.cleanerForm.elements.namedItem('editingCleanerName').value = '';
  els.cleanerSubmitButton.textContent = 'Cadastrar cleaner';
  renderCleaners();
}

function startCleanerEdit(cleanerName) {
  const cleaner = findCleanerByName(cleanerName);
  if (!cleaner) return;
  if (els.cleanerManageSelect) els.cleanerManageSelect.value = cleaner.name;
  els.cleanerForm.elements.namedItem('editingCleanerName').value = cleaner.name;
  els.cleanerForm.elements.namedItem('name').value = cleaner.name;
  els.cleanerForm.elements.namedItem('weekdayRate').value = cleaner.weekdayRate;
  els.cleanerForm.elements.namedItem('weekendRate').value = cleaner.weekendRate;
  els.cleanerForm.elements.namedItem('holidayRate').value = cleaner.holidayRate;
  els.cleanerSubmitButton.textContent = 'Salvar cleaner';
}

function onEditSelectedCleaner() {
  const cleanerName = els.cleanerManageSelect?.value;
  if (!cleanerName) return toast('Selecione um cleaner para editar.');
  startCleanerEdit(cleanerName);
}

function onDeleteSelectedCleaner() {
  const cleanerName = els.cleanerManageSelect?.value;
  if (!cleanerName) return toast('Selecione um cleaner para excluir.');
  onDeleteCleaner(cleanerName);
}


function onInvoicePeriodChange() {
  state.cleaningFilters.from = els.invoicePeriodFrom.value;
  state.cleaningFilters.to = els.invoicePeriodTo.value;
  renderCleanings();
}

function resetInvoicePeriod() {
  state.cleaningFilters = { from: '', to: '' };
  els.invoicePeriodFrom.value = '';
  els.invoicePeriodTo.value = '';
  renderCleanings();
}

function filterCleaningsByPeriod(entries) {
  const { from, to } = state.cleaningFilters;
  return entries.filter((item) => {
    const date = (item.requested_date || item.date || '').slice(0, 10);
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
}


function detectDayType(dateValue, isHoliday) {
  if (isHoliday) return 'Holiday';
  if (!dateValue) return 'Weekdays';
  const date = new Date(`${dateValue}T00:00:00Z`);
  const day = date.getUTCDay();
  return day === 0 || day === 6 ? 'Weekends' : 'Weekdays';
}

function findCleanerByName(name) {
  return state.cleaners.find((cleaner) => cleaner.name === name) || null;
}

function getCleaningGroupConfig(clientName, groupName) {
  const client = state.cleaningClients.find((item) => item.clientName === clientName);
  return client?.groups?.find((group) => group.name === groupName) || null;
}

function getOrCreateCleaningClient(clientName) {
  let client = state.cleaningClients.find((item) => item.clientName === clientName);
  if (!client) {
    client = { clientName, legalName: '', billingEmail: '', groups: [] };
    state.cleaningClients.push(client);
  }
  return client;
}

function getClientIdByName(clientName) {
  return state.clients.find((client) => client.name === clientName)?.id || 0;
}

function getClientNameById(clientId) {
  return state.clients.find((client) => client.id === clientId)?.name || '';
}

function upsertClientRegistrationConfig(data) {
  if (data.previousName && data.previousName !== data.name) {
    const existing = state.cleaningClients.find((client) => client.clientName === data.previousName);
    if (existing) existing.clientName = data.name;
    state.cleanings = state.cleanings.map((item) => item.clientName === data.previousName ? { ...item, clientName: data.name } : item);
    saveCleanings();
  }
  const client = getOrCreateCleaningClient(data.name);
  client.legalName = data.legalName || client.legalName || '';
  client.billingEmail = data.billingEmail || client.billingEmail || '';
  if (!data.invoiceGroup) {
    saveCleaningClients();
    return;
  }
  let group = client.groups.find((item) => item.name === data.invoiceGroup);
  if (!group) {
    group = {
      name: data.invoiceGroup,
      billTo: data.legalName || data.name,
      email: data.billingEmail || '',
      billingType: data.billingType,
      weekdayClientRate: 0,
      weekendClientRate: 0,
      flats: [],
      flatRates: {},
    };
    client.groups.push(group);
  }
  group.billTo = data.legalName || data.name;
  group.email = data.billingEmail || '';
  group.billingType = data.billingType;
  group.weekdayClientRate = data.weekdayClientRate || 0;
  group.weekendClientRate = data.weekendClientRate || 0;
  group.flatRates = group.flatRates || {};
  if (data.flat && !group.flats.includes(data.flat)) group.flats.push(data.flat);
  if (data.billingType === 'project' && data.flat) {
    group.flatRates[data.flat] = Number(data.projectFlatRate || 0);
  }
  group.flats.sort((a, b) => a.localeCompare(b));
  state.cleaningClients.sort((a, b) => a.clientName.localeCompare(b.clientName));
  saveCleaningClients();
}

function resetClientForm() {
  els.clientForm.reset();
  els.clientForm.elements.namedItem('editingClientId').value = '';
  if (els.clientSubmitButton) els.clientSubmitButton.textContent = 'Criar cliente';
}

function onEditSelectedClient() {
  const clientName = els.clientConfigSelect.value;
  const client = state.cleaningClients.find((item) => item.clientName === clientName);
  const linkedClientId = getClientIdByName(clientName);
  if (!client || !linkedClientId) return toast('Selecione um cliente valido para editar.');
  els.clientForm.elements.namedItem('editingClientId').value = String(linkedClientId);
  els.clientForm.elements.namedItem('name').value = client.clientName;
  els.clientForm.elements.namedItem('legalName').value = client.legalName || '';
  els.clientForm.elements.namedItem('billingEmail').value = client.billingEmail || '';
  els.clientForm.elements.namedItem('slug').value = state.clients.find((item) => item.id === linkedClientId)?.slug || '';
  if (els.clientSubmitButton) els.clientSubmitButton.textContent = 'Salvar cliente';
  switchCadastroView('clients');
}

function onDeleteSelectedClient() {
  if (!els.clientConfigSelect.value) return toast('Selecione um cliente para excluir.');
  onDeleteClient(els.clientConfigSelect.value);
}

function getCleanerRate(cleaner, dayType) {
  if (!cleaner) return 0;
  if (dayType === 'Holiday') return Number(cleaner.holidayRate || cleaner.weekendRate || 0);
  if (dayType === 'Weekends') return Number(cleaner.weekendRate || 0);
  return Number(cleaner.weekdayRate || 0);
}


function calculateCleaningStaffTotal(item) {
  if (item.staffTotalOverride !== undefined) return roundToTwo(Number(item.staffTotalOverride));
  return roundToTwo(minutesToDecimal(parseHourToMinutes(item.hours)) * Number(item.staffRate || 0));
}

function calculateCleaningProfit(item) {
  return roundToTwo(calculateCleaningTotal(item) - calculateCleaningStaffTotal(item));
}

function parseHourToMinutes(value) {
  const [hours, minutes] = String(value || '0:00').split(':').map((item) => Number(item || 0));
  return (hours * 60) + minutes;
}

function minutesToDecimal(minutes) {
  return minutes / 60;
}

function minutesToHourLabel(minutes) {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
}

function openRecordModal(recordId = null) {
  const record = recordId ? state.records.find((item) => item.id === recordId) : null;
  state.editingRecord = record;
  els.modalTitle.textContent = record ? `Editar registro #${record.id}` : 'Novo registro';
  els.recordForm.innerHTML = `
    <input type="text" name="title" placeholder="Titulo do registro" value="${escapeAttribute(record?.title || '')}" required />
    <select name="statusKey">${(state.config?.statuses || []).map((status) => `<option value="${status.status_key}" ${record?.status_key === status.status_key ? 'selected' : ''}>${escapeHtml(status.label)}</option>`).join('')}</select>
    ${(state.config?.fields || []).map((field) => renderFieldInput(field, record?.payload?.[field.field_key])).join('')}
    <button class="button button-primary" type="submit">${record ? 'Salvar alteracoes' : 'Criar registro'}</button>`;
  els.recordForm.onsubmit = async (event) => {
    event.preventDefault();
    await saveRecord(new FormData(els.recordForm));
  };
  els.recordModal.classList.remove('hidden');
}

function closeRecordModal() {
  els.recordModal.classList.add('hidden');
  state.editingRecord = null;
}

async function saveRecord(formData) {
  const payload = Object.fromEntries((state.config?.fields || []).map((field) => [field.field_key, formData.get(field.field_key) || '']));
  const body = { title: formData.get('title'), statusKey: formData.get('statusKey'), payload };
  if (state.editingRecord) await api(`/api/clients/${state.selectedClientId}/records/${state.editingRecord.id}`, { method: 'PUT', body });
  else await api(`/api/clients/${state.selectedClientId}/records`, { method: 'POST', body });
  toast(state.editingRecord ? 'Registro atualizado com sucesso.' : 'Registro criado com sucesso.');
  closeRecordModal();
  await Promise.all([loadRecords(), loadOverview()]);
}

async function deleteRecord(recordId) {
  if (!window.confirm('Deseja realmente excluir este registro?')) return;
  await api(`/api/clients/${state.selectedClientId}/records/${recordId}`, { method: 'DELETE' });
  toast('Registro excluido.');
  await Promise.all([loadRecords(), loadOverview()]);
}

async function openHistoryDrawer(recordId) {
  const record = state.records.find((item) => item.id === recordId);
  const response = await api(`/api/clients/${state.selectedClientId}/records/${recordId}/history`);
  els.historyTitle.textContent = `Historico de ${record?.title || `#${recordId}`}`;
  els.historyList.innerHTML = response.history.map((item) => `<div class="stack-item"><strong>${escapeHtml(item.action)}</strong><span>${escapeHtml(item.user_name || 'Sistema')}</span><small>${formatDateTime(item.created_at)}</small><pre>${escapeHtml(JSON.stringify(item.snapshot, null, 2))}</pre></div>`).join('');
  els.historyDrawer.classList.remove('hidden');
}

function closeHistoryDrawer() {
  els.historyDrawer.classList.add('hidden');
}

async function onCreateClient(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const editingClientId = Number(form.get('editingClientId') || 0);
  const name = String(form.get('name') || '').trim();
  const legalName = String(form.get('legalName') || '').trim();
  const billingEmail = String(form.get('billingEmail') || '').trim();
  const slug = String(form.get('slug') || '').trim();
  const duplicateName = state.clients.find((client) => client.name.toLowerCase() === name.toLowerCase() && client.id !== editingClientId);
  const duplicateEmail = state.cleaningClients.find((client) => (client.billingEmail || '').toLowerCase() === billingEmail.toLowerCase() && getClientIdByName(client.clientName) !== editingClientId);
  if (duplicateName) return toast('Ja existe um cliente com esse nome.');
  if (duplicateEmail) return toast('Ja existe um cliente com esse email.');
  try {
    const response = await api(editingClientId ? `/api/clients/${editingClientId}` : '/api/clients', {
      method: editingClientId ? 'PUT' : 'POST',
      body: {
        name,
        slug,
        segment: legalName,
        legalName,
        billingEmail,
      },
    });

    upsertClientRegistrationConfig({
      previousName: editingClientId ? getClientNameById(editingClientId) : '',
      name,
      legalName,
      billingEmail,
    });

    if (response?.client) {
      state.clients = state.clients.filter((client) => client.id !== response.client.id);
      state.clients.push(response.client);
      state.clients.sort((a, b) => a.name.localeCompare(b.name));
    }

    resetClientForm();
    populateClientSelector();
    populateCleaningClients();
    populateClientConfigSelect();
    els.clientConfigSelect.value = name;
    renderClientGroups();
    renderUsers();
    toast(editingClientId ? 'Cliente atualizado com sucesso.' : 'Cliente adicionado com sucesso.', 'success');
    await Promise.all([loadOverview(), refreshClients(), loadUsers()]);
  } catch (error) {
    toast(error.message || 'Nao foi possivel criar o cliente.', 'error');
  }
}

async function onCreateUser(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const id = form.get('id');
  try {
    const url = id ? `/api/users/${id}` : '/api/users';
    const method = id ? 'PUT' : 'POST';
    await api(url, {
      method,
      body: { 
        name: form.get('name'), 
        email: form.get('email'), 
        password: form.get('password'), 
        role: form.get('role'), 
        parentClientId: form.get('parentClientId'),
        hourlyRate: form.get('hourlyRate'),
        weekendRate: form.get('weekendRate'),
        holidayRate: form.get('holidayRate')
      },
    });
    resetUserForm();
    toast(id ? 'Usuario atualizado com sucesso!' : 'Usuario cadastrado com sucesso!', 'success');
    await loadUsers();
    if (typeof loadFlats === 'function') await loadFlats();
    if (typeof loadClientUsersForFlat === 'function') {
      await loadClientUsersForFlat();
    }
  } catch (err) {
    toast(err.message || 'Erro ao salvar usuario.', 'error');
  }
}

function resetUserForm() {
  els.userForm.reset();
  document.getElementById('userEditId').value = '';
  document.getElementById('userSubmitButton').textContent = 'Criar usuario';
  const cancelBtn = document.getElementById('userCancelEdit');
  if (cancelBtn) cancelBtn.style.display = 'none';
  const parentContainer = document.getElementById('userParentClientContainer');
  if (parentContainer) parentContainer.style.display = 'none';
  const rateContainer = document.getElementById('userHourlyRateContainer');
  const userRoleSelect = document.getElementById('userRoleInput');
  if (rateContainer) rateContainer.style.display = 'none';
}

function startEditUser(userId) {
  const user = state.users.find(u => String(u.id) === String(userId));
  if (!user) return;
  document.getElementById('userEditId').value = user.id;
  els.userForm.elements.namedItem('name').value = user.name || '';
  els.userForm.elements.namedItem('email').value = user.email || '';
  els.userForm.elements.namedItem('role').value = user.role || '';
  els.userForm.elements.namedItem('password').value = '';
  
  const roleSelect = document.getElementById('userRoleSelect');
  roleSelect.dispatchEvent(new Event('change'));
  
  const rateContainer = document.getElementById('userHourlyRateContainer');
  if (['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(user.role)) {
    rateContainer.style.display = 'block';
    document.getElementById('userHourlyRateInput').value = user.hourly_rate || '';
    document.getElementById('userWeekendRateInput').value = user.weekend_rate || '';
    document.getElementById('userHolidayRateInput').value = user.holiday_rate || '';
  } else {
    rateContainer.style.display = 'none';
    document.getElementById('userHourlyRateInput').value = '';
    document.getElementById('userWeekendRateInput').value = '';
    document.getElementById('userHolidayRateInput').value = '';
    
    if (user.role === 'client_user') {
      document.getElementById('userParentClientSelect').value = user.parent_client_id || '';
    }
  }
  
  document.getElementById('userSubmitButton').textContent = 'Atualizar usuario';
  document.getElementById('userCancelEdit').style.display = 'inline-block';
  els.userForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function onCreateCollaborator(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await api('/api/holerites/collaborators', {
    method: 'POST',
    body: {
      fullName: form.get('fullName'),
      email: form.get('email'),
      password: form.get('password'),
      documentId: form.get('documentId'),
      pixKey: form.get('pixKey'),
      hourlyWeekday: form.get('hourlyWeekday'),
      hourlyWeekend: form.get('hourlyWeekend'),
      hourlyHoliday: form.get('hourlyHoliday'),
    },
  });
  event.currentTarget.reset();
  toast('Colaborador cadastrado com acesso individual.', 'success');
  await loadHolerites();
}

async function onCreateHoleriteEntry(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await api('/api/holerites/entries', {
    method: 'POST',
    body: {
      collaboratorId: form.get('collaboratorId'),
      competence: form.get('competence'),
      hoursWeekday: form.get('hoursWeekday'),
      hoursWeekend: form.get('hoursWeekend'),
      hoursHoliday: form.get('hoursHoliday'),
      discountAmount: form.get('discountAmount'),
      status: form.get('status'),
      documentName: form.get('documentName'),
      notes: form.get('notes'),
    },
  });
  event.currentTarget.reset();
  toast('Holerite criado.', 'success');
  await loadHolerites();
}

async function refreshClients() {
  state.clients = (await api('/api/clients')).clients;
  if (!state.clients.some((client) => client.id === state.selectedClientId)) state.selectedClientId = state.clients[0]?.id || null;
  populateClientSelector();
  if (state.selectedClientId) await refreshClientContext();
}

async function onImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const csv = await file.text();
  const result = await api(`/api/clients/${state.selectedClientId}/import`, { method: 'POST', body: { csv } });
  toast(`${result.imported} registros importados.`);
  event.target.value = '';
  await Promise.all([refreshClientContext(), loadOverview()]);
}



function buildInvoiceGroups(entries) {
  const map = new Map();
  entries.forEach((item) => {
    if (item.status !== 'completed') return;
    const key = String(item.client_user_id || item.client_name);
    if (!map.has(key)) {
      map.set(key, {
        clientId: item.client_user_id,
        clientName: item.client_name,
        invoiceGroup: 'Servicos',
        billTo: item.client_name,
        email: item.client_email,
        billingType: item.flat_billing_type || 'hourly',
        weekdayHoursMinutes: 0,
        weekendHoursMinutes: 0,
        weekdayValue: 0,
        weekendValue: 0,
        extraTotal: 0,
      });
    }
    const target = map.get(key);
    const durationHours = Number(item.duration_hours || 0);
    const minutes = Math.round(durationHours * 60);
    const isWeekend = (new Date(item.requested_date)).getUTCDay() === 0 || (new Date(item.requested_date)).getUTCDay() === 6;
    
    if (isWeekend || item.is_holiday) {
      target.weekendHoursMinutes += minutes;
      target.weekendValue += Number(item.client_amount || 0);
    } else {
      target.weekdayHoursMinutes += minutes;
      target.weekdayValue += Number(item.client_amount || 0);
    }
  });
  return [...map.values()].map((item) => ({
    ...item,
    weekdayHours: minutesToHourLabel(item.weekdayHoursMinutes),
    weekendHours: minutesToHourLabel(item.weekendHoursMinutes),
    grandTotal: roundToTwo(item.weekdayValue + item.weekendValue + item.extraTotal)
  }));
}


async function onSaveClientGroup(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const clientName = String(form.get('clientName') || '');
  const invoiceGroup = String(form.get('invoiceGroup') || '');
  const flat = String(form.get('flat') || '').trim();
  const editingFlatName = String(form.get('editingFlatName') || '').trim();
  const billTo = String(form.get('billTo') || '');
  const email = String(form.get('email') || '');
  const billingType = String(form.get('billingType') || 'hourly');
  const weekdayClientRate = Number(form.get('weekdayClientRate') || 0);
  const weekendClientRate = Number(form.get('weekendClientRate') || 0);
  const projectFlatRate = Number(form.get('projectFlatRate') || 0);
  const editingGroupKey = String(form.get('editingGroupKey') || '');
  const clientConfig = getOrCreateCleaningClient(clientName);
  let targetGroup = clientConfig.groups.find((group) => group.name === invoiceGroup);
  if (editingGroupKey) {
    const [, originalGroupName] = editingGroupKey.split('::');
    targetGroup = clientConfig.groups.find((group) => group.name === originalGroupName) || targetGroup;
  }
  if (!targetGroup) {
    targetGroup = {
      name: invoiceGroup,
      billTo,
      email,
      billingType,
      weekdayClientRate: 0,
      weekendClientRate: 0,
      flats: [],
      flatRates: {},
    };
    clientConfig.groups.push(targetGroup);
  }
  targetGroup.name = invoiceGroup;
  targetGroup.billTo = billTo;
  targetGroup.email = email;
  targetGroup.billingType = billingType;
  targetGroup.weekdayClientRate = weekdayClientRate;
  targetGroup.weekendClientRate = weekendClientRate;
  targetGroup.flatRates = targetGroup.flatRates || {};
  if (editingFlatName && editingFlatName !== flat) {
    targetGroup.flats = targetGroup.flats.map((item) => item === editingFlatName ? flat : item);
    if (Object.prototype.hasOwnProperty.call(targetGroup.flatRates, editingFlatName)) {
      targetGroup.flatRates[flat] = targetGroup.flatRates[editingFlatName];
      delete targetGroup.flatRates[editingFlatName];
    }
  }
  if (flat && !targetGroup.flats.includes(flat)) targetGroup.flats.push(flat);
  if (billingType === 'project' && flat) {
    targetGroup.flatRates[flat] = projectFlatRate;
  } else if (flat && Object.prototype.hasOwnProperty.call(targetGroup.flatRates, flat)) {
    delete targetGroup.flatRates[flat];
  }
  targetGroup.flats.sort((a, b) => a.localeCompare(b));
  saveCleaningClients();
  event.currentTarget.reset();
  event.currentTarget.elements.namedItem('editingGroupKey').value = '';
  event.currentTarget.elements.namedItem('editingFlatName').value = '';
  els.clientConfigSubmitButton.textContent = 'Salvar configuracao';
  state.cleaningClients.sort((a, b) => a.clientName.localeCompare(b.clientName));
  populateCleaningClients();
  populateClientConfigSelect();
  els.clientConfigSelect.value = clientName;
  syncClientPricingVisibility();
  renderClientGroups();
  renderSelectedGroupFlats();
  toast('Grupo de invoice salvo.');
}

function startClientGroupEdit(groupKey) {
  const [clientName, groupName] = groupKey.split('::');
  const group = getCleaningGroupConfig(clientName, groupName);
  if (!group) return;
  els.cleaningClientForm.elements.namedItem('editingGroupKey').value = groupKey;
  els.cleaningClientForm.elements.namedItem('editingFlatName').value = '';
  els.cleaningClientForm.elements.namedItem('invoiceGroup').value = group.name;
  els.cleaningClientForm.elements.namedItem('billTo').value = group.billTo;
  els.cleaningClientForm.elements.namedItem('email').value = group.email;
  els.cleaningClientForm.elements.namedItem('billingType').value = group.billingType || 'hourly';
  els.cleaningClientForm.elements.namedItem('weekdayClientRate').value = group.weekdayClientRate || '';
  els.cleaningClientForm.elements.namedItem('weekendClientRate').value = group.weekendClientRate || '';
  els.cleaningClientForm.elements.namedItem('projectFlatRate').value = '';
  els.cleaningClientForm.elements.namedItem('flat').value = '';
  els.clientConfigSelect.value = clientName;
  els.clientConfigSubmitButton.textContent = 'Salvar grupo';
  syncClientPricingVisibility();
  renderSelectedGroupFlats();
}

function startFlatEdit(clientName, groupName, flatName) {
  const group = getCleaningGroupConfig(clientName, groupName);
  if (!group) return;
  els.cleaningClientForm.elements.namedItem('editingGroupKey').value = `${clientName}::${groupName}`;
  els.cleaningClientForm.elements.namedItem('editingFlatName').value = flatName;
  els.cleaningClientForm.elements.namedItem('invoiceGroup').value = group.name;
  els.cleaningClientForm.elements.namedItem('billTo').value = group.billTo;
  els.cleaningClientForm.elements.namedItem('email').value = group.email;
  els.cleaningClientForm.elements.namedItem('billingType').value = group.billingType || 'hourly';
  els.cleaningClientForm.elements.namedItem('weekdayClientRate').value = group.weekdayClientRate || '';
  els.cleaningClientForm.elements.namedItem('weekendClientRate').value = group.weekendClientRate || '';
  els.cleaningClientForm.elements.namedItem('projectFlatRate').value = group.flatRates?.[flatName] || '';
  els.cleaningClientForm.elements.namedItem('flat').value = flatName;
  els.clientConfigSelect.value = clientName;
  els.clientConfigSubmitButton.textContent = 'Salvar flat';
  syncClientPricingVisibility();
  renderSelectedGroupFlats();
}

function onDeleteFlat(clientName, groupName, flatName) {
  if (!window.confirm(`Excluir flat ${flatName}?`)) return;
  const group = getCleaningGroupConfig(clientName, groupName);
  if (!group) return;
  group.flats = (group.flats || []).filter((flat) => flat !== flatName);
  if (group.flatRates && Object.prototype.hasOwnProperty.call(group.flatRates, flatName)) {
    delete group.flatRates[flatName];
  }
  saveCleaningClients();
  renderClientGroups();
  renderSelectedGroupFlats();
  populateCleaningClients();
  toast('Flat excluido.');
}

function syncCleaningAutoFields() {
  if (!els.cleaningForm) return;
  const dateValue = els.cleaningForm.elements.namedItem('date')?.value;
  const cleanerName = els.cleanerSelect?.value;
  const flat = els.cleaningFlatSelect?.value;
  const isHoliday = els.cleaningForm.elements.namedItem('isHoliday')?.checked;
  const dayType = detectDayType(dateValue, isHoliday);
  const cleaner = findCleanerByName(cleanerName);
  const groupConfig = getCleaningGroupConfig(els.cleaningClientSelect?.value, els.cleaningInvoiceGroup?.value);
  const staffRate = cleaner ? getCleanerRate(cleaner, dayType) : 0;
  const clientRate = getClientRateForCleaning(groupConfig, dateValue, isHoliday, flat);
  if (els.detectedDayType) els.detectedDayType.value = dayType;
  if (els.detectedBillingType) els.detectedBillingType.value = groupConfig?.billingType === 'project' ? 'Projeto por flat' : 'Por hora';
  if (els.detectedClientRate) els.detectedClientRate.value = clientRate ? String(clientRate) : '';
  if (els.detectedStaffRate) els.detectedStaffRate.value = cleaner ? formatCurrencyGBP(staffRate) : '';
}

function getClientRateForCleaning(groupConfig, dateValue, isHoliday, flat) {
  if (!groupConfig) return 0;
  if (groupConfig.billingType === 'project') return Number(groupConfig.flatRates?.[flat] || 0);
  const dayType = detectDayType(dateValue, isHoliday);
  return dayType === 'Weekdays'
    ? Number(groupConfig.weekdayClientRate || 0)
    : Number(groupConfig.weekendClientRate || groupConfig.weekdayClientRate || 0);
}

function calculateCleaningBaseCharge(item) {
  if (item.billingType === 'project') return roundToTwo(Number(item.clientRate || 0));
  return roundToTwo(minutesToDecimal(parseHourToMinutes(item.hours)) * Number(item.clientRate || 0));
}

function calculateCleaningTotal(item) {
  if (item.clientTotalOverride !== undefined) return roundToTwo(Number(item.clientTotalOverride));
  return roundToTwo(calculateCleaningBaseCharge(item) + Number(item.extraAmount || 0));
}

function renderBillingSummary(group) {
  if (group.billingType === 'project') return 'Cobranca por projeto';
  return `Cobranca por hora · Semana ${formatCurrencyGBP(group.weekdayClientRate)} · Fim de semana/feriado ${formatCurrencyGBP(group.weekendClientRate)}`;
}

function renderFlatSummary(group) {
  if (!group.flats?.length) return 'nenhum';
  if (group.billingType !== 'project') return group.flats.join(', ');
  return group.flats.map((flat) => `${flat} (${formatCurrencyGBP(group.flatRates?.[flat] || 0)})`).join(', ');
}

function renderUsers() {
  const filter = document.getElementById('userRoleFilter')?.value || 'all';
  const filteredUsers = state.users.filter((user) => {
    if (filter === 'all') return true;
    if (filter === 'gerencia') return user.role === 'superadmin' || user.role === 'manager';
    return user.role === filter;
  });

  const hubEl = document.getElementById('cadastrosHub');
  if (hubEl) {
    const total = state.users.length;
    const clients = state.users.filter(u => u.role === 'client' || u.role === 'client_user').length;
    const cleaners = state.users.filter(u => u.role === 'employee').length;
    const gerencia = state.users.filter(u => u.role === 'superadmin' || u.role === 'manager').length;
    
    hubEl.innerHTML = `
      <article class="stat-card glass-card" style="cursor:pointer;" onclick="document.getElementById('userRoleFilter').value='all'; renderUsers();">
        <strong>${total}</strong><span>Todos os Logins</span>
      </article>
      <article class="stat-card glass-card" style="cursor:pointer;" onclick="document.getElementById('userRoleFilter').value='client'; renderUsers();">
        <strong>${clients}</strong><span>Clientes</span>
      </article>
      <article class="stat-card glass-card" style="cursor:pointer;" onclick="document.getElementById('userRoleFilter').value='employee'; renderUsers();">
        <strong>${cleaners}</strong><span>Cleaners</span>
      </article>
      <article class="stat-card glass-card" style="cursor:pointer;" onclick="document.getElementById('userRoleFilter').value='gerencia'; renderUsers();">
        <strong>${gerencia}</strong><span>Gerência</span>
      </article>
    `;
  }

  els.usersList.innerHTML = filteredUsers.map((user) => {
    let roleLabel = user.role;
    let icon = 'user';
    if (user.role === 'superadmin' || user.role === 'manager') { roleLabel = 'Gerência'; icon = 'shield'; }
    if (user.role === 'client') { roleLabel = 'Cliente Principal'; icon = 'briefcase'; }
    if (user.role === 'client_user') { roleLabel = 'Login de Cliente'; icon = 'briefcase'; }
    if (user.role === 'employee') { roleLabel = 'Colaborador'; icon = 'users'; }
    
    let parentCompanyName = '';
    if (user.role === 'client_user' && user.parent_client_id) {
      const parent = state.users.find(u => u.id === user.parent_client_id);
      if (parent) parentCompanyName = `<div style="margin-top:8px; font-size:0.85rem; color:var(--muted);"><i data-lucide="link" style="width:12px;height:12px;display:inline;vertical-align:-1px;"></i> Vinculado a: <strong>${escapeHtml(parent.name)}</strong></div>`;
    }

    return `
    <div class="panel glass-card" style="display:flex; flex-direction:column; padding:16px;">
      <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:16px;">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--surface-alt);display:flex;align-items:center;justify-content:center;color:var(--primary);flex-shrink:0;">
          <i data-lucide="${icon}"></i>
        </div>
        <div style="overflow:hidden;">
          <strong style="display:block; font-size:1.05rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(user.name)}</strong>
          <span class="badge badge-neutral" style="margin-top:4px; display:inline-block;">${roleLabel}</span>
        </div>
      </div>
      <div style="font-size:0.85rem; color:var(--muted); margin-bottom:8px;">
        <i data-lucide="mail" style="width:12px;height:12px;display:inline;vertical-align:-1px;"></i> ${escapeHtml(user.email)}
      </div>
      ${parentCompanyName}
      ${user.role === 'employee' ? `
        <div style="margin-top:8px; padding:8px; background:var(--surface-alt); border-radius:8px; font-size:0.8rem; color:var(--muted);">
          <strong>Taxas:</strong><br/>
          Normal: £${Number(user.hourly_rate || 0).toFixed(2)} | FDS: £${Number(user.weekend_rate || 0).toFixed(2)} | Fer: £${Number(user.holiday_rate || 0).toFixed(2)}
        </div>
      ` : ''}
      <div style="margin-top:auto; padding-top:16px; display:flex; gap:8px;">
        <button class="ghost-button" style="flex:1; justify-content:center;" type="button" onclick="startEditUser(${user.id})" title="Editar"><i data-lucide="edit-3"></i></button>
        <button class="ghost-button" style="flex:1; justify-content:center; color:var(--primary);" type="button" data-user-password="${user.id}" title="Redefinir Senha"><i data-lucide="key"></i></button>
        <button class="ghost-button" style="flex:1; justify-content:center; color:var(--danger);" type="button" data-user-delete="${user.id}" title="Excluir"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
  `}).join('');
  if (window.lucide) window.lucide.createIcons({ root: els.usersList });
  els.usersList.querySelectorAll('[data-user-delete]').forEach((button) => {
    button.addEventListener('click', () => onDeleteUser(Number(button.dataset.userDelete)));
  });
  els.usersList.querySelectorAll('[data-user-password]').forEach((button) => {
    button.addEventListener('click', () => onChangeUserPassword(Number(button.dataset.userPassword)));
  });
}

function renderCleaners() {
  if (!els.cleanersList) return;
  populateCleanerManageSelect();
  const selectedCleaner = findCleanerByName(els.cleanerManageSelect?.value);
  if (!selectedCleaner) {
    if (els.selectedCleanerHint) els.selectedCleanerHint.textContent = 'Cadastre ou escolha um cleaner para editar e excluir sem listar toda a base.';
    els.cleanersList.innerHTML = '<div class="stack-item"><span>Nenhum cleaner cadastrado.</span></div>';
    return;
  }
  if (els.selectedCleanerHint) els.selectedCleanerHint.textContent = `Cleaner ativo: ${selectedCleaner.name}`;
  els.cleanersList.innerHTML = `
    <div class="stack-item flat-management-item">
      <strong>${escapeHtml(selectedCleaner.name)}</strong>
      <small>Semana: ${formatCurrencyGBP(selectedCleaner.weekdayRate)} · Fim de semana: ${formatCurrencyGBP(selectedCleaner.weekendRate)} · Feriado: ${formatCurrencyGBP(selectedCleaner.holidayRate)}</small>
      <div class="table-actions">
        <button class="ghost-button" type="button" data-cleaner-edit="${escapeAttribute(selectedCleaner.name)}">Editar cleaner</button>
        <button class="ghost-button" type="button" data-cleaner-delete="${escapeAttribute(selectedCleaner.name)}">Excluir cleaner</button>
      </div>
    </div>
  `;
  els.cleanersList.querySelector('[data-cleaner-edit]')?.addEventListener('click', () => startCleanerEdit(selectedCleaner.name));
  els.cleanersList.querySelector('[data-cleaner-delete]')?.addEventListener('click', () => onDeleteCleaner(selectedCleaner.name));
}

function renderClientGroups() {
  const selectedClient = state.cleaningClients.find((client) => client.clientName === els.clientConfigSelect.value);
  if (!selectedClient) {
    els.clientGroupsList.innerHTML = '<div class="stack-item"><span>Nenhum cliente selecionado.</span></div>';
    return;
  }
  els.clientGroupsList.innerHTML = `
    <div class="stack-item">
      <strong>${escapeHtml(selectedClient.clientName)}</strong>
      <span>${escapeHtml(selectedClient.legalName || 'Razao social nao informada')}</span>
      <small>${escapeHtml(selectedClient.billingEmail || 'Email nao informado')}</small>
      ${(selectedClient.groups || []).map((group) => `
        <small>${escapeHtml(group.name)} · ${escapeHtml(group.billTo)} · ${escapeHtml(group.email)}</small>
        <small>${escapeHtml(renderBillingSummary(group))}</small>
        <div class="flat-list">
          ${(group.flats || []).map((flat) => `
            <div class="flat-item">
              <span>${escapeHtml(flat)}${group.billingType === 'project' ? ` · ${escapeHtml(formatCurrencyGBP(group.flatRates?.[flat] || 0))}` : ''}</span>
              <div class="table-actions">
                <button class="ghost-button" type="button" data-flat-edit="${escapeAttribute(selectedClient.clientName)}::${escapeAttribute(group.name)}::${escapeAttribute(flat)}">Editar flat</button>
                <button class="ghost-button" type="button" data-flat-delete="${escapeAttribute(selectedClient.clientName)}::${escapeAttribute(group.name)}::${escapeAttribute(flat)}">Excluir flat</button>
              </div>
            </div>
          `).join('') || '<small>Nenhum flat cadastrado nesse grupo.</small>'}
        </div>
        <div class="table-actions">
          <button class="ghost-button" type="button" data-group-edit="${escapeAttribute(selectedClient.clientName)}::${escapeAttribute(group.name)}">Editar grupo</button>
        </div>
      `).join('') || '<small>Esse cliente ainda nao possui grupos configurados.</small>'}
    </div>
  `;
  els.clientGroupsList.querySelectorAll('[data-group-edit]').forEach((button) => {
    button.addEventListener('click', () => startClientGroupEdit(button.dataset.groupEdit));
  });
  els.clientGroupsList.querySelectorAll('[data-flat-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const [clientName, groupName, flatName] = button.dataset.flatEdit.split('::');
      startFlatEdit(clientName, groupName, flatName);
    });
  });
  els.clientGroupsList.querySelectorAll('[data-flat-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      const [clientName, groupName, flatName] = button.dataset.flatDelete.split('::');
      onDeleteFlat(clientName, groupName, flatName);
    });
  });
}

function renderSelectedGroupFlats() {
  if (!els.selectedGroupFlatsList || !els.selectedGroupHint) return;
  const clientName = els.clientConfigSelect.value;
  const groupName = String(els.cleaningClientForm.elements.namedItem('invoiceGroup')?.value || '').trim();
  const group = getCleaningGroupConfig(clientName, groupName);
  if (!clientName) {
    els.selectedGroupHint.textContent = 'Escolha um cliente para gerenciar os flats.';
    els.selectedGroupFlatsList.innerHTML = '<div class="stack-item"><span>Nenhum cliente selecionado.</span></div>';
    return;
  }
  if (!groupName) {
    els.selectedGroupHint.textContent = 'Digite ou escolha um invoice group para gerenciar os flats.';
    els.selectedGroupFlatsList.innerHTML = '<div class="stack-item"><span>Nenhum grupo selecionado.</span></div>';
    return;
  }
  if (!group) {
    els.selectedGroupHint.textContent = `Crie o grupo "${groupName}" e salve a configuracao para depois administrar os flats.`;
    els.selectedGroupFlatsList.innerHTML = '<div class="stack-item"><span>Esse grupo ainda nao foi salvo.</span></div>';
    return;
  }
  els.selectedGroupHint.textContent = `Grupo ativo: ${group.name}`;
  els.selectedGroupFlatsList.innerHTML = (group.flats || []).map((flat) => `
    <div class="stack-item flat-management-item">
      <strong>${escapeHtml(flat)}</strong>
      <small>${group.billingType === 'project' ? `Valor do projeto: ${formatCurrencyGBP(group.flatRates?.[flat] || 0)}` : 'Cobranca por hora nesse grupo.'}</small>
      <div class="table-actions">
        <button class="ghost-button" type="button" data-group-flat-edit="${escapeAttribute(clientName)}::${escapeAttribute(group.name)}::${escapeAttribute(flat)}">Editar flat</button>
        <button class="ghost-button" type="button" data-group-flat-delete="${escapeAttribute(clientName)}::${escapeAttribute(group.name)}::${escapeAttribute(flat)}">Excluir flat</button>
      </div>
    </div>
  `).join('') || '<div class="stack-item"><span>Nenhum flat cadastrado nesse grupo ainda.</span></div>';
  els.selectedGroupFlatsList.querySelectorAll('[data-group-flat-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const [nextClientName, nextGroupName, nextFlatName] = button.dataset.groupFlatEdit.split('::');
      startFlatEdit(nextClientName, nextGroupName, nextFlatName);
    });
  });
  els.selectedGroupFlatsList.querySelectorAll('[data-group-flat-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      const [nextClientName, nextGroupName, nextFlatName] = button.dataset.groupFlatDelete.split('::');
      onDeleteFlat(nextClientName, nextGroupName, nextFlatName);
    });
  });
}

async function onDeleteCleaner(cleanerName) {
  if (!window.confirm(`Excluir cleaner ${cleanerName}?`)) return;
  state.cleaners = state.cleaners.filter((cleaner) => cleaner.name !== cleanerName);
  saveCleaners();
  if (els.cleanerForm.elements.namedItem('editingCleanerName').value === cleanerName) resetCleanerForm();
  if (els.cleanerManageSelect && els.cleanerManageSelect.value === cleanerName) {
    els.cleanerManageSelect.value = state.cleaners[0]?.name || '';
  }
  renderCleaners();
  populateCleanerSelect();
  toast('Cleaner excluido.');
}

async function onDeleteClient(clientName) {
  const linkedClient = state.clients.find((client) => client.name === clientName);
  if (!linkedClient) {
    state.cleaningClients = state.cleaningClients.filter((client) => client.clientName !== clientName);
    saveCleaningClients();
    renderClientGroups();
    populateCleaningClients();
    populateClientConfigSelect();
    toast('Configuracao local do cliente removida.');
    return;
  }
  if (!window.confirm(`Excluir cliente ${clientName}?`)) return;
  try {
    await api(`/api/clients/${linkedClient.id}`, { method: 'DELETE' });
    state.clients = state.clients.filter((client) => client.id !== linkedClient.id);
    state.cleaningClients = state.cleaningClients.filter((client) => client.clientName !== clientName);
    state.cleanings = state.cleanings.filter((item) => item.clientName !== clientName);
    saveCleaningClients();
    saveCleanings();
    if (state.selectedClientId === linkedClient.id) {
      state.selectedClientId = state.clients[0]?.id || null;
    }
    populateClientSelector();
    populateCleaningClients();
    populateClientConfigSelect();
    renderClientGroups();
    renderCleanings();
    await Promise.all([loadOverview(), loadUsers()]);
    if (state.selectedClientId) await refreshClientContext();
    toast('Cliente excluido.');
  } catch (error) {
    toast(error.message || 'Nao foi possivel excluir o cliente.');
  }
}

async function onDeleteUser(userId) {
  if (!window.confirm('Excluir este usuario do sistema?')) return;
  try {
    await api(`/api/users/${userId}`, { method: 'DELETE' });
    state.users = state.users.filter((user) => user.id !== userId);
    renderUsers();
    toast('Usuario excluido.');
  } catch (error) {
    toast(error.message || 'Nao foi possivel excluir o usuario.');
  }
}

async function onChangeUserPassword(userId) {
  const newPassword = window.prompt('Digite a nova senha para este usuario (min. 4 caracteres):');
  if (!newPassword) return; // cancelled or empty
  if (newPassword.length < 4) return toast('A senha deve ter pelo menos 4 caracteres.', 'error');
  try {
    await api(`/api/users/${userId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword })
    });
    toast('Senha alterada com sucesso!');
  } catch (error) {
    toast(error.message || 'Nao foi possivel alterar a senha.', 'error');
  }
}


function getNextCleaningId() {
  const current = Number(localStorage.getItem(CLEANING_ID_COUNTER_STORAGE_KEY) || '1');
  localStorage.setItem(CLEANING_ID_COUNTER_STORAGE_KEY, String(current + 1));
  return current;
}

function normalizeCleaningEntriesWithIds(rawEntries) {
  const normalized = (rawEntries || []).map((entry) => ({
    ...entry,
    id: Number(entry.id || 0) || getNextCleaningId(),
    billingType: entry.billingType || 'hourly',
    clientRate: Number(entry.clientRate || 0),
    staffRate: Number(entry.staffRate || 0),
    extraAmount: Number(entry.extraAmount || 0),
  }));
  const highestId = normalized.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0);
  const currentCounter = Number(localStorage.getItem(CLEANING_ID_COUNTER_STORAGE_KEY) || '1');
  if (currentCounter <= highestId) {
    localStorage.setItem(CLEANING_ID_COUNTER_STORAGE_KEY, String(highestId + 1));
  }
  return normalized;
}

async function loadCleanings() {
  localStorage.removeItem(CLEANING_STORAGE_KEY);
  localStorage.removeItem('FB_cleaners');
  localStorage.removeItem('FB_cleaningClients');
  
  const localCleanings = [];
  
  try {
    const res = await api('/api/jobs');
    if (res && res.jobs) {
      const completedJobs = res.jobs.filter(j => j.status === 'completed');
      const jobCleanings = completedJobs.map(j => ({
        id: 'job_' + j.id,
        isJob: true,
        date: j.finishedAt ? j.finishedAt.slice(0, 10) : (j.requestedDate || ''),
        cleaner: j.employeeName || 'Sem funcionário',
        clientName: j.clientName || 'Sem cliente',
        invoiceGroup: 'Automático',
        flat: j.flatAddress || '-',
        isHoliday: false,
        dayType: 'Normal',
        billingType: j.flatBillingType || 'hourly',
        hours: formatHours(j.durationHours || 0),
        clientRate: Number(j.durationHours) ? (j.clientAmount / j.durationHours) : 0,
        staffRate: Number(j.durationHours) ? (j.employeeAmount / j.durationHours) : 0,
        extraAmount: 0,
        clientTotalOverride: j.clientAmount || 0,
        staffTotalOverride: j.employeeAmount || 0
      }));
      state.cleanings = [...jobCleanings, ...localCleanings];
    } else {
      state.cleanings = localCleanings;
    }
  } catch (err) {
    console.error('Erro ao buscar jobs para lancamentos:', err);
    state.cleanings = localCleanings;
  }
  
  // Do not save jobs into localStorage
  populateCleaningClients();
  renderCleanings();
}

function resetCleaningForm() {
  els.cleaningForm?.reset();
  if (els.cleaningForm?.elements.namedItem('editingCleaningId')) {
    els.cleaningForm.elements.namedItem('editingCleaningId').value = '';
  }
  if (els.cleaningSubmitButton) els.cleaningSubmitButton.textContent = 'Adicionar limpeza';
  populateCleaningClients();
  populateCleanerSelect();
  syncCleaningAutoFields();
}

function startCleaningEdit(cleaningId) {
  const item = state.cleanings.find((entry) => String(entry.id) === String(cleaningId));
  if (!item || !els.cleaningForm) return;
  els.cleaningForm.elements.namedItem('editingCleaningId').value = String(item.id);
  els.cleaningForm.elements.namedItem('date').value = item.date || '';
  els.cleaningClientSelect.value = item.clientName || '';
  onCleaningClientChange();
  els.cleaningInvoiceGroup.value = item.invoiceGroup || '';
  syncCleaningGroupDetails();
  els.cleanerSelect.value = item.cleaner || '';
  els.cleaningFlatSelect.value = item.flat || '';
  els.cleaningBillTo.value = item.city || '';
  els.cleaningForm.elements.namedItem('hours').value = item.hours || '';
  els.cleaningForm.elements.namedItem('isHoliday').checked = Boolean(item.isHoliday);
  els.cleaningForm.elements.namedItem('extraLabel').value = item.extraLabel || '';
  els.cleaningForm.elements.namedItem('extraAmount').value = Number(item.extraAmount || 0);
  syncCleaningAutoFields();
  if (els.cleaningSubmitButton) els.cleaningSubmitButton.textContent = 'Salvar limpeza';
}

function onDeleteCleaning(cleaningId) {
  if (!window.confirm('Excluir este lancamento de limpeza?')) return;
  state.cleanings = state.cleanings.filter((entry) => String(entry.id) !== String(cleaningId));
  saveCleanings();
  if (els.cleaningForm?.elements.namedItem('editingCleaningId')?.value === String(cleaningId)) {
    resetCleaningForm();
  }
  renderCleanings();
  toast('Lancamento excluido.');
}

function renderCleanings() {
  const entries = filterCleaningsByPeriod([...state.cleanings]).sort((a, b) => `${b.date}${b.flat}${b.id}`.localeCompare(`${a.date}${a.flat}${a.id}`));
  const totals = entries.reduce((acc, item) => {
    acc.jobs += 1;
    acc.client += calculateCleaningTotal(item);
    acc.staff += calculateCleaningStaffTotal(item);
    acc.profit += calculateCleaningProfit(item);
    return acc;
  }, { jobs: 0, client: 0, staff: 0, profit: 0 });
  els.cleaningStats.innerHTML = [
    ['Lancamentos', String(totals.jobs)],
    ['Faturado', formatCurrencyGBP(totals.client)],
    ['Custo equipe', formatCurrencyGBP(totals.staff)],
    ['Lucro', formatCurrencyGBP(totals.profit)],
  ].map(([label, value]) => `<article class="holerite-stat glass-card"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></article>`).join('');

  els.cleaningHead.innerHTML = '<tr><th>Data</th><th>Cleaner</th><th>Cliente</th><th>Invoice</th><th>Flat</th><th>Tipo dia</th><th>Cobranca</th><th>Horas</th><th>Valor cliente</th><th>Total</th><th>Valor func.</th><th>Total func.</th><th>Lucro</th><th>Acoes</th></tr>';
  els.cleaningBody.innerHTML = entries.map((item) => `
    <tr>
      <td>${formatDateShort(item.date)}</td>
      <td><strong>${escapeHtml(item.cleaner)}</strong></td>
      <td>${escapeHtml(item.clientName)}</td>
      <td>${escapeHtml(item.invoiceGroup)}</td>
      <td>${escapeHtml(item.flat)}</td>
      <td>${escapeHtml(item.dayType)}</td>
      <td>${escapeHtml(item.billingType === 'project' ? 'Projeto' : 'Hora')}</td>
      <td>${escapeHtml(item.hours)}</td>
      <td>${formatCurrencyGBP(item.clientRate)}</td>
      <td>${formatCurrencyGBP(calculateCleaningTotal(item))}</td>
      <td>${formatCurrencyGBP(item.staffRate)}</td>
      <td>${formatCurrencyGBP(calculateCleaningStaffTotal(item))}</td>
      <td>${formatCurrencyGBP(calculateCleaningProfit(item))}</td>
      <td>
        <div class="table-actions">
          <button class="ghost-button" type="button" data-cleaning-edit="${item.id}">Editar</button>
          <button class="ghost-button" type="button" data-cleaning-delete="${item.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="14">Nenhum lancamento de limpeza.</td></tr>';
  els.cleaningBody.querySelectorAll('[data-cleaning-edit]').forEach((button) => {
    button.addEventListener('click', () => startCleaningEdit(button.dataset.cleaningEdit));
  });
  els.cleaningBody.querySelectorAll('[data-cleaning-delete]').forEach((button) => {
    button.addEventListener('click', () => onDeleteCleaning(button.dataset.cleaningDelete));
  });
  renderFinanceSummary();
}

async function onCreateCleaning(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const editingCleaningId = Number(form.get('editingCleaningId') || 0);
  const cleaner = findCleanerByName(form.get('cleaner'));
  const dayType = detectDayType(form.get('date'), form.get('isHoliday') === 'on');
  const staffRate = getCleanerRate(cleaner, dayType);
  const groupConfig = getCleaningGroupConfig(form.get('clientName'), form.get('invoiceGroup'));
  const billingType = groupConfig?.billingType || 'hourly';
  const clientRate = getClientRateForCleaning(groupConfig, form.get('date'), form.get('isHoliday') === 'on', form.get('flat'));
  const payload = {
    id: editingCleaningId || getNextCleaningId(),
    date: form.get('date'),
    clientName: form.get('clientName'),
    invoiceGroup: form.get('invoiceGroup'),
    cleaner: form.get('cleaner'),
    city: form.get('city'),
    flat: form.get('flat'),
    dayType,
    billingType,
    hours: form.get('hours'),
    clientRate,
    staffRate,
    isHoliday: form.get('isHoliday') === 'on',
    extraLabel: form.get('extraLabel'),
    extraAmount: Number(form.get('extraAmount') || 0),
  };
  if (editingCleaningId) {
    state.cleanings = state.cleanings.map((item) => Number(item.id) === editingCleaningId ? payload : item);
  } else {
    state.cleanings.unshift(payload);
  }
  saveCleanings();
  resetCleaningForm();
  renderCleanings();
  toast(editingCleaningId ? 'Lancamento atualizado.' : 'Limpeza adicionada ao invoice.');
}

function buildPayrollDrafts(entries) {
  const map = new Map();
  entries.forEach((item) => {
    if (item.status !== 'completed') return;
    const key = String(item.employee_user_id || item.employee_name);
    if (!map.has(key)) {
      map.set(key, {
        cleanerId: item.employee_user_id,
        cleanerName: item.employee_name,
        name: item.employee_name,
        hoursWeekday: 0,
        hoursWeekend: 0,
        hoursHoliday: 0,
        netAmount: 0,
      });
    }
    const target = map.get(key);
    const durationHours = roundToTwo(Number(item.duration_hours || 0));
    const isHoliday = Boolean(item.is_holiday);
    const isWeekend = (new Date(item.requested_date)).getUTCDay() === 0 || (new Date(item.requested_date)).getUTCDay() === 6;
    
    if (isHoliday) target.hoursHoliday += durationHours;
    else if (isWeekend) target.hoursWeekend += durationHours;
    else target.hoursWeekday += durationHours;
    target.netAmount = roundToTwo(target.netAmount + Number(item.employee_amount || 0));
  });
  return [...map.values()];
}

function onGenerateInvoices() {
  const entries = filterCleaningsByPeriod([...(state.cleanings || [])]);
  const invoices = buildInvoiceGroups(entries);
  if (!invoices.length) return toast('Nao ha invoices para gerar nesse periodo.');
  const periodLabel = getSelectedPeriodLabel(entries);
  const createdAt = new Date().toISOString();
  invoices.forEach((invoice) => {
    state.generatedInvoices.unshift({
      number: formatGeneratedInvoiceNumber(invoice, entries, createdAt),
      clientName: invoice.clientName,
      invoiceGroup: invoice.invoiceGroup,
      periodLabel,
      total: invoice.grandTotal,
      createdAt,
    });
  });
  saveGeneratedInvoices();
  renderFinanceSummary();
  toast(`${invoices.length} invoice(s) gerado(s) com codigo unico.`);
}

function onGeneratePayrolls() {
  const entries = filterCleaningsByPeriod([...(state.cleanings || [])]);
  const payrolls = buildPayrollDrafts(entries);
  if (!payrolls.length) return toast('Nao ha holerites para gerar nesse periodo.');
  const periodLabel = getSelectedPeriodLabel(entries);
  const createdAt = new Date().toISOString();
  payrolls.forEach((item) => {
    state.generatedPayrolls.unshift({
      number: formatGeneratedPayrollNumber(item, entries, createdAt),
      cleanerName: item.cleanerName,
      periodLabel,
      netAmount: item.netAmount,
      hoursWeekday: item.hoursWeekday,
      hoursWeekend: item.hoursWeekend,
      hoursHoliday: item.hoursHoliday,
      createdAt,
    });
  });
  saveGeneratedPayrolls();
  renderFinanceSummary();
  toast(`${payrolls.length} holerite(s) gerado(s) com codigo unico.`);
}

function getSelectedPeriodLabel(entries) {
  const from = state.cleaningFilters.from || (entries[entries.length - 1]?.requested_date || entries[entries.length - 1]?.date || new Date().toISOString()).slice(0, 10);
  const to = state.cleaningFilters.to || (entries[0]?.requested_date || entries[0]?.date || from).slice(0, 10);
  return `${formatDateShort(from)} a ${formatDateShort(to)}`;
}

function formatGeneratedInvoiceNumber(invoice, entries, createdAt) {
  const from = (state.cleaningFilters.from || entries[entries.length - 1]?.requested_date || entries[entries.length - 1]?.date || '').slice(0, 10).replaceAll('-', '').slice(2);
  const to = (state.cleaningFilters.to || entries[0]?.requested_date || entries[0]?.date || '').slice(0, 10).replaceAll('-', '').slice(2);
  const clientCode = toCode(invoice.clientName, 2);
  const groupCode = toCode(invoice.invoiceGroup, 2);
  return `INV-${clientCode}${groupCode}-${from}-${to}-${uniqueSuffix(createdAt).slice(0, 4)}`;
}

function formatGeneratedPayrollNumber(payroll, entries, createdAt) {
  const from = (state.cleaningFilters.from || entries[entries.length - 1]?.requested_date || entries[entries.length - 1]?.date || '').slice(0, 10).replaceAll('-', '').slice(2);
  const to = (state.cleaningFilters.to || entries[0]?.requested_date || entries[0]?.date || '').slice(0, 10).replaceAll('-', '').slice(2);
  const cleanerCode = toCode(payroll.cleanerName, 3);
  return `HOL-${cleanerCode}-${from}-${to}-${uniqueSuffix(createdAt).slice(0, 4)}`;
}

function getSelectedPeriodCode(entries) {
  const from = (state.cleaningFilters.from || entries[entries.length - 1]?.requested_date || entries[entries.length - 1]?.date || '').slice(0, 10).replaceAll('-', '');
  const to = (state.cleaningFilters.to || entries[0]?.requested_date || entries[0]?.date || from).slice(0, 10).replaceAll('-', '');
  return `${from}-${to}`;
}

function toCode(value, size = 4) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('')
    .slice(0, size) || 'DOC';
}

function uniqueSuffix(createdAt) {
  const timeCode = new Date(createdAt).getTime().toString(36).toUpperCase().slice(-6);
  const randomCode = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${timeCode}${randomCode}`;
}

function periodCodeFromLabel(periodLabel) {
  const digits = String(periodLabel || '').match(/\d+/g) || [];
  if (digits.length >= 2) {
    return `${digits[0].padStart(8, '0')}-${digits[1].padStart(8, '0')}`;
  }
  return 'PERIODO';
}

function isLegacyGeneratedNumber(value) {
  return /^INV-\d+$/i.test(String(value || '')) || /^HOL-\d+$/i.test(String(value || ''));
}

function findLatestGeneratedInvoice(invoice) {
  return state.generatedInvoices.find((item) => item.clientName === invoice.clientName && item.invoiceGroup === invoice.invoiceGroup) || null;
}

function findLatestGeneratedPayroll(payroll) {
  return state.generatedPayrolls.find((item) => item.cleanerName === payroll.cleanerName) || null;
}

function onExport() {
  const params = new URLSearchParams({
    search: state.filters.search,
    status: state.filters.status,
    sort: state.sort,
    direction: state.direction,
    filterField: state.filters.filterField,
    filterValue: state.filters.filterValue,
  });
  window.open(`/api/clients/${state.selectedClientId}/export.csv?${params.toString()}`, '_blank');
}

function renderFieldInput(field, value) {
  if (field.field_type === 'textarea') return `<textarea name="${field.field_key}" placeholder="${escapeAttribute(field.label)}">${escapeHtml(value || '')}</textarea>`;
  const map = { number: 'number', date: 'date', text: 'text', status: 'text' };
  return `<input type="${map[field.field_type] || 'text'}" name="${field.field_key}" placeholder="${escapeAttribute(field.label)}" value="${escapeAttribute(value || '')}" ${field.required ? 'required' : ''} />`;
}

function renderStatusBadge(status, fallbackKey) {
  const color = status?.color || '#5B8DEF';
  const label = status?.label || fallbackKey;
  return `<span class="badge" style="background:${hexToRgba(color, 0.14)}; color:${color}; border-color:${hexToRgba(color, 0.28)};">${escapeHtml(label)}</span>`;
}

function renderPayrollStatus(status) {
  const map = {
    enviado: '#2e9b6c',
    confirmado: '#16756b',
    pendente: '#c9743f',
    revisao: '#d45555',
  };
  const color = map[status] || '#5B8DEF';
  return `<span class="badge" style="background:${hexToRgba(color, 0.14)}; color:${color}; border-color:${hexToRgba(color, 0.28)};">${escapeHtml(status)}</span>`;
}

function findStatus(statusKey) { return state.config?.statuses?.find((status) => status.status_key === statusKey) || null; }
function isAdmin() { return state.user?.role === 'superadmin'; }
function isCollaborator() { return Boolean(state.user?.collaborator); }
function canManageHolerites() { return isAdmin() || state.user?.role === 'manager'; }
function isViewerOnly() { return state.user?.role === 'viewer' && !isCollaborator(); }

async function api(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Erro inesperado.');
  return data;
}

function toast(message, type = 'default') {
  els.toast.textContent = message;
  els.toast.className = 'toast';
  if (type === 'success') els.toast.classList.add('success');
  if (type === 'error') els.toast.classList.add('error');
  els.toast.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove('visible'), 2400);
}

function formatDateTime(value) { return value ? new Date(value).toLocaleString('pt-BR') : '-'; }
function formatDateShort(value) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '-'; }
function formatFieldValue(value, type) { if (!value) return '-'; if (type === 'date') return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR'); return String(value); }
function formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)); }
function formatCurrencyGBP(value) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value || 0)); }
function formatHours(h) { if (h == null) return '—'; const hh = Math.floor(h); const mm = Math.round((h - hh) * 60); return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; }
function decimalToTimeStr(h) { if (h == null || h === '') return ''; const hh = Math.floor(h); const mm = Math.round((h - hh) * 60); return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; }
function timeStrToDecimal(t) { if (!t) return null; const [hh, mm] = t.split(':').map(Number); return hh + (mm / 60); }
function roundToTwo(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function escapeAttribute(value) { return escapeHtml(value).replaceAll('`', '&#96;'); }
function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
  const number = Number.parseInt(value, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function updateFlatRateFields() {
  const billingType = document.getElementById('flatBillingType').value;
  const hourlyField = document.getElementById('flatHourlyRateField');
  const projectField = document.getElementById('flatProjectRateField');
  if (billingType === 'hourly') {
    if (hourlyField) hourlyField.classList.remove('hidden');
    if (projectField) projectField.classList.add('hidden');
  } else {
    if (hourlyField) hourlyField.classList.add('hidden');
    if (projectField) projectField.classList.remove('hidden');
  }
}

function closeFlatForm() {
  const form = document.getElementById('flatForm');
  if (form) {
    form.reset();
    document.getElementById('flatEditId').value = '';
    form.classList.add('hidden');
  }
}

async function deleteFlatById(flatId) {
  if (!confirm('Tem certeza que deseja excluir este flat?')) return;
  try {
    await api('/api/flats/' + flatId, { method: 'DELETE' });
    toast('Flat excluido com sucesso!', 'success');
    await loadFlats();
  } catch (err) {
    toast(err.message || 'Erro ao excluir flat', 'error');
  }
}

function openFlatForm(flat) {
  const form = document.getElementById('flatForm');
  if (!form) return;
  form.classList.remove('hidden');
  document.getElementById('flatEditId').value = flat ? flat.id : '';
  document.getElementById('flatAddress').value = flat ? flat.address : '';
  document.getElementById('flatFullAddress').value = flat && flat.full_address ? flat.full_address : '';
  document.getElementById('flatAccessCode').value = flat && flat.access_code ? flat.access_code : '';
  const cityInput = document.getElementById('flatCity');
  if (cityInput) cityInput.value = flat && flat.city ? flat.city : '';
  document.getElementById('flatBillingType').value = flat ? flat.billing_type : 'hourly';
  document.getElementById('flatHourlyRate').value = flat ? flat.hourly_rate : '';
  document.getElementById('flatHourlyWeekendRate').value = flat ? flat.hourly_weekend_rate : '';
  document.getElementById('flatHourlyHolidayRate').value = flat ? flat.hourly_holiday_rate : '';
  document.getElementById('flatProjectRate').value = flat && flat.project_rate !== undefined ? flat.project_rate : '';
  if(document.getElementById('flatProjectWeekendRate')) document.getElementById('flatProjectWeekendRate').value = flat && flat.project_weekend_rate !== undefined ? flat.project_weekend_rate : '';
  if(document.getElementById('flatProjectHolidayRate')) document.getElementById('flatProjectHolidayRate').value = flat && flat.project_holiday_rate !== undefined ? flat.project_holiday_rate : '';
  if(document.getElementById('flatShowProjectHours')) document.getElementById('flatShowProjectHours').checked = flat ? !!flat.show_project_hours : false;
  if (flat && flat.client_user_id) {
    const sel = document.getElementById('flatClientUser');
    if (sel) sel.value = String(flat.client_user_id);
  }
  updateFlatRateFields();
  document.getElementById('flatSubmitButton').textContent = flat ? 'Atualizar flat' : 'Salvar flat';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function onFlatSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('flatEditId').value;
  const body = {
    address: document.getElementById('flatAddress').value.trim(),
    fullAddress: document.getElementById('flatFullAddress').value.trim(),
    accessCode: document.getElementById('flatAccessCode').value.trim(),
    city: document.getElementById('flatCity') ? document.getElementById('flatCity').value.trim() : '',
    clientUserId: document.getElementById('flatClientUser').value || null,
    billingType: document.getElementById('flatBillingType').value,
    hourlyRate: document.getElementById('flatHourlyRate').value,
    hourlyWeekendRate: document.getElementById('flatHourlyWeekendRate').value,
    hourlyHolidayRate: document.getElementById('flatHourlyHolidayRate').value,
    projectRate: document.getElementById('flatProjectRate').value,
    projectWeekendRate: document.getElementById('flatProjectWeekendRate') ? document.getElementById('flatProjectWeekendRate').value : '',
    projectHolidayRate: document.getElementById('flatProjectHolidayRate') ? document.getElementById('flatProjectHolidayRate').value : '',
    showProjectHours: document.getElementById('flatShowProjectHours') ? document.getElementById('flatShowProjectHours').checked : false,
  };
  const btn = document.getElementById('flatSubmitButton');
  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    if (id) {
      await api(`/api/flats/${id}`, { method: 'PUT', body });
      toast('Flat atualizado!');
    } else {
      await api('/api/flats', { method: 'POST', body });
      toast('Flat salvo com sucesso!', 'success');
    }
    closeFlatForm();
    await loadFlats();
  } catch (err) {
    toast('Erro: ' + (err.message || ''));
  } finally {
    btn.disabled = false;
    btn.textContent = id ? 'Atualizar flat' : 'Salvar flat';
  }
}

function editFlat(id) {
  const flat = state.flats.find(f => f.id === id);
  if (flat) openFlatForm(flat);
}

async function deleteFlat(id) {
  if (!confirm('Excluir este flat? Todos os servicos vinculados tambem serao excluidos.')) return;
  try {
    await api(`/api/flats/${id}`, { method: 'DELETE' });
    toast('Flat excluido.');
    await loadFlats();
  } catch (e) {
    toast('Erro: ' + (e.message || ''));
  }
}

// ── CONFIG ────────────────────────────────────────────────────────────────────
async function loadConfig() {
  try {
    const data = await api('/api/config');
    const cfg = data.config || {};
    const fields = {
      configBankName: cfg.bank_name || '',
      configSortCode: cfg.bank_sort_code || '',
      configAccountNumber: cfg.bank_account || '',
      configSmtpHost: cfg.smtp_host || '',
      configSmtpPort: cfg.smtp_port || '',
      configSmtpUser: cfg.smtp_user || '',
      configSmtpFrom: cfg.smtp_from || '',
    };
    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    });
    // Never pre-fill password
    const passEl = document.getElementById('configSmtpPass');
    if (passEl) passEl.value = '';
  } catch (e) {
    toast('Erro ao carregar configuracoes.');
  }
}

async function onConfigSubmit(e) {
  e.preventDefault();
  const body = {
    bank_name: document.getElementById('configBankName')?.value || '',
    bank_sort_code: document.getElementById('configSortCode')?.value || '',
    bank_account: document.getElementById('configAccountNumber')?.value || '',
    smtp_host: document.getElementById('configSmtpHost')?.value || '',
    smtp_port: document.getElementById('configSmtpPort')?.value || '',
    smtp_user: document.getElementById('configSmtpUser')?.value || '',
    smtp_from: document.getElementById('configSmtpFrom')?.value || '',
  };
  const pass = document.getElementById('configSmtpPass')?.value;
  if (pass) body.smtp_pass = pass;

  const btn = document.getElementById('configSubmitButton');
  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    await api('/api/config', { method: 'PUT', body });
    toast('Configuracoes salvas!');
    await loadConfig();
  } catch (e) {
    toast('Erro ao salvar: ' + (e.message || ''));
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar configuracoes';
  }
}

// ── Helper: expose functions globally for onclick handlers ────────────────────
window.openAssignModal = openAssignModal;
window.adminCancelJob = adminCancelJob;
window.deleteJob = deleteJob;
window.openJobPhotos = openJobPhotos;
window.openLightbox = openLightbox;
window.editFlat = editFlat;
window.deleteFlat = deleteFlat;

// ── Admin Invoices & Holerites ──────────────────────────────────────────────────
async function loadAdminHolerites() {
  const select = document.getElementById('adminHoleriteEmployeeSelect');
  const monthInput = document.getElementById('adminHoleriteMonth');
  
  if (select.options.length <= 1) {
    if (!state.users) state.users = (await api('/api/users')).users;
    const employees = state.users.filter(u => ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(u.role));
    select.innerHTML = '<option value="">Selecione o Colaborador...</option>' + 
      employees.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('');
  }
  
  if (!monthInput.value) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    monthInput.value = `${now.getFullYear()}-${mm}`;
  }
  
  renderAdminHolerite();
}

async function renderAdminHolerite() {
  const empId = document.getElementById('adminHoleriteEmployeeSelect').value;
  const month = document.getElementById('adminHoleriteMonth').value;
  const container = document.getElementById('adminHoleriteResults');
  
  if (!empId || !month) {
    container.innerHTML = '<div class="empty-state">Selecione um colaborador e um mês.</div>';
    return;
  }
  
  container.innerHTML = '<div style="padding:20px;text-align:center;">Carregando...</div>';
  
  try {
    const payslip = await api(`/api/payslip/employee/${empId}?month=${month}`);
    if (!payslip || !payslip.entries || payslip.entries.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum serviço encontrado neste mês.</div>';
      return;
    }
    
    let html = `
      <div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <div>
            <h4 style="margin:0;font-size:18px;">Holerite: ${escapeHtml(payslip.employee.name)}</h4>
            <div style="color:var(--muted);font-size:14px;">Mês: ${escapeHtml(month)}</div>
          </div>
          <button class="button button-primary" onclick="window.open('/print/payslip/${empId}?month=${month}', '_blank')">Imprimir PDF</button>
        </div>
        <table class="data-table" style="width:100%;">
          <thead>
            <tr><th style="text-align:left;">Data</th><th style="text-align:left;">Flat</th><th style="text-align:center;">Horas</th><th style="text-align:right;">Valor</th></tr>
          </thead>
          <tbody>
            ${payslip.entries.map(e => `
              <tr>
                <td style="padding:12px;border-bottom:1px solid #eee;">${escapeHtml(e.date)}</td>
                <td style="padding:12px;border-bottom:1px solid #eee;">${escapeHtml(e.flatAddress)}</td>
                <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">${formatHours(e.durationHours)}</td>
                <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">£${e.employeeAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="font-weight:bold;background:#f9f9f9;">
              <td colspan="2" style="padding:12px;text-align:right;">TOTAL:</td>
              <td style="padding:12px;text-align:center;">${payslip.totalHours}h</td>
              <td style="padding:12px;text-align:right;color:var(--primary);">£${payslip.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="empty-state" style="color:var(--danger);">Erro: ${e.message}</div>`;
  }
}

async function loadAdminInvoices() {
  const select = document.getElementById('adminInvoiceClientSelect');
  const monthInput = document.getElementById('adminInvoiceMonth');
  
  if (select.options.length <= 1) {
    if (!state.users) state.users = (await api('/api/users')).users;
    const clients = state.users.filter(u => u.role === 'client');
    select.innerHTML = '<option value="">Selecione o Cliente...</option>' + 
      clients.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('');
  }
  
  if (!monthInput.value) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    monthInput.value = `${now.getFullYear()}-${mm}`;
  }
  
  renderAdminInvoice();
}

async function renderAdminInvoice() {
  const clientId = document.getElementById('adminInvoiceClientSelect').value;
  const month = document.getElementById('adminInvoiceMonth').value;
  const container = document.getElementById('adminInvoiceResults');
  
  if (!clientId || !month) {
    container.innerHTML = '<div class="empty-state">Selecione um cliente e um mês.</div>';
    return;
  }
  
  container.innerHTML = '<div style="padding:20px;text-align:center;">Carregando...</div>';
  
  try {
    const invoice = await api(`/api/invoices/client/${clientId}?month=${month}`);
    if (!invoice || !invoice.entries || invoice.entries.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum serviço concluído neste mês.</div>';
      return;
    }
    
    let html = `
      <div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <div>
            <h4 style="margin:0;font-size:18px;">Invoice: ${escapeHtml(invoice.client.name)}</h4>
            <div style="color:var(--muted);font-size:14px;">Mês: ${escapeHtml(month)}</div>
          </div>
          <button class="button button-primary" onclick="window.open('/print/invoice/${clientId}?month=${month}', '_blank')">Gerar / Imprimir PDF</button>
        </div>
        <table class="data-table" style="width:100%;">
          <thead>
            <tr><th style="text-align:left;">Data</th><th style="text-align:left;">Flat</th><th style="text-align:center;">Horas</th><th style="text-align:right;">Valor Cobrado</th></tr>
          </thead>
          <tbody>
            ${invoice.entries.map(e => `
              <tr>
                <td style="padding:12px;border-bottom:1px solid #eee;">${escapeHtml(e.date)}</td>
                <td style="padding:12px;border-bottom:1px solid #eee;">${escapeHtml(e.flatAddress)}</td>
                <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">${formatHours(e.durationHours)}</td>
                <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">£${e.clientAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="font-weight:bold;background:#f9f9f9;">
              <td colspan="3" style="padding:12px;text-align:right;">TOTAL A COBRAR:</td>
              <td style="padding:12px;text-align:right;color:var(--primary);">£${invoice.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="empty-state" style="color:var(--danger);">Erro: ${e.message}</div>`;
  }
}

document.getElementById('adminHoleriteEmployeeSelect')?.addEventListener('change', renderAdminHolerite);
document.getElementById('adminHoleriteMonth')?.addEventListener('change', renderAdminHolerite);
document.getElementById('adminInvoiceClientSelect')?.addEventListener('change', renderAdminInvoice);
document.getElementById('adminInvoiceMonth')?.addEventListener('change', renderAdminInvoice);

async function downloadPhoto(url, filename, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const btn = event && (event.currentTarget || event.target);
  const oldText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '⏳ Carregando...';
    btn.disabled = true;
  }
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const cleanName = filename || 'foto.jpg';
    const file = new File([blob], cleanName, { type: blob.type || 'image/jpeg' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: cleanName
        });
        if (btn) { btn.innerHTML = oldText; btn.disabled = false; }
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          if (btn) { btn.innerHTML = oldText; btn.disabled = false; }
          return;
        }
      }
    }
    
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (e) {
    window.open(url, '_blank');
  } finally {
    if (btn) { btn.innerHTML = oldText; btn.disabled = false; }
  }
}
window.downloadPhoto = downloadPhoto;

let lbSrcs  = [];   // all photo srcs for current job
let lbIndex = 0;    // currently shown index

function openLightbox(src, srcsArray) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  
  // Try to parse srcsArray if it was passed as stringified JSON from HTML
  let parsedSrcs = [];
  if (typeof srcsArray === 'string') {
    try { parsedSrcs = JSON.parse(srcsArray); } catch(e) {}
  } else if (Array.isArray(srcsArray)) {
    parsedSrcs = srcsArray;
  }
  
  lbSrcs  = parsedSrcs.length ? parsedSrcs : [src];
  lbIndex = Math.max(0, lbSrcs.indexOf(src));
  
  _lbShowAdmin();
  modal.classList.remove('hidden');
}

function _lbShowAdmin() {
  const img = document.getElementById('lightboxImg');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const counter = document.getElementById('lightboxCounter');
  
  img.src = lbSrcs[lbIndex];
  const total = lbSrcs.length;
  
  if (counter) counter.textContent = total > 1 ? `${lbIndex + 1} / ${total}` : '';
  if (prevBtn) prevBtn.style.display = total > 1 ? 'grid' : 'none';
  if (nextBtn) nextBtn.style.display = total > 1 ? 'grid' : 'none';
}

function _lbNavigateAdmin(delta) {
  if (lbSrcs.length <= 1) return;
  const img = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');
  
  img.style.opacity = '0';
  setTimeout(() => {
    lbIndex = (lbIndex + delta + lbSrcs.length) % lbSrcs.length;
    img.src = lbSrcs[lbIndex];
    if (counter) counter.textContent = `${lbIndex + 1} / ${lbSrcs.length}`;
    img.style.opacity = '1';
  }, 200);
}

// Lucide Icons Helper
function updateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Bind lightbox events once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  updateIcons();
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxClose = document.getElementById('closeLightbox');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxDownloadBtn = document.getElementById('lightboxDownloadBtn');
  
  const closeLb = (e) => {
    if (e && e.type === 'touchend') e.preventDefault();
    if (lightboxModal) lightboxModal.classList.add('hidden');
  };
  
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLb);
    lightboxClose.addEventListener('touchend', closeLb);
  }
  
  if (lightboxDownloadBtn) {
    const dlLb = (e) => {
      if (e && e.type === 'touchend') e.preventDefault();
      const currentUrl = lbSrcs[lbIndex];
      if (currentUrl) {
        const fname = currentUrl.split('/').pop() || 'foto.jpg';
        downloadPhoto(currentUrl, decodeURIComponent(fname), e);
      }
    };
    lightboxDownloadBtn.addEventListener('click', dlLb);
    lightboxDownloadBtn.addEventListener('touchend', dlLb);
  }
  
  const prevLb = (e) => { if (e) { e.stopPropagation(); if (e.type === 'touchend') e.preventDefault(); } _lbNavigateAdmin(-1); };
  const nextLb = (e) => { if (e) { e.stopPropagation(); if (e.type === 'touchend') e.preventDefault(); } _lbNavigateAdmin(+1); };
  
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', prevLb);
    lightboxPrev.addEventListener('touchend', prevLb);
  }
  
  if (lightboxNext) {
    lightboxNext.addEventListener('click', nextLb);
    lightboxNext.addEventListener('touchend', nextLb);
  }
  
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) lightboxModal.classList.add('hidden');
    });
    
    // Touch swipe support
    let _lbTouchX = null;
    lightboxModal.addEventListener('touchstart', (e) => { _lbTouchX = e.touches[0].clientX; }, { passive: true });
    lightboxModal.addEventListener('touchend', (e) => {
      if (_lbTouchX === null || e.target !== document.getElementById('lightboxImg')) return;
      const dx = e.changedTouches[0].clientX - _lbTouchX;
      _lbTouchX = null;
      if (Math.abs(dx) > 40) _lbNavigateAdmin(dx < 0 ? +1 : -1);
    }, { passive: true });
  }
  
  document.addEventListener('keydown', (e) => {
    if (lightboxModal && !lightboxModal.classList.contains('hidden')) {
      if (e.key === 'ArrowRight') { _lbNavigateAdmin(+1); }
      if (e.key === 'ArrowLeft')  { _lbNavigateAdmin(-1); }
      if (e.key === 'Escape')     { lightboxModal.classList.add('hidden'); }
    }
  });
});

window.openLightbox = openLightbox;

// ── Override switchView to also load new views ─────────────────────────────
const _origSwitchViewForCleanOps = switchView;
switchView = function(view) {
  _origSwitchViewForCleanOps(view);
  if (view === 'jobs') loadJobs();
  else if (view === 'flats') loadFlats();
  else if (view === 'config') loadConfig();
  else if (view === 'finance') renderFinanceSummary();
};

document.addEventListener('click', async (e) => {
  if (e.target.id === 'btnGenInvoices') {
    const from = document.getElementById('genInvoiceFrom').value;
    const to = document.getElementById('genInvoiceTo').value;
    const clientId = document.getElementById('genInvoiceClient').value;
    if (!from || !to) return toast('Selecione as datas de inicio e fim.');
    
    e.target.disabled = true;
    e.target.textContent = 'Gerando...';
    try {
      const res = await fetch('/api/finance/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invoice', periodFrom: from, periodTo: to, targetId: clientId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar faturas');
      
      toast(`${data.invoicesGenerated} faturas geradas com sucesso!`);
      renderFinanceSummary();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      e.target.disabled = false;
      e.target.textContent = 'Gerar Faturas';
    }
  }

  if (e.target.id === 'btnGenPayrolls') {
    const from = document.getElementById('genPayrollFrom').value;
    const to = document.getElementById('genPayrollTo').value;
    const empId = document.getElementById('genPayrollEmployee').value;
    const allChecked = document.getElementById('genPayrollClientAll')?.checked;
    const clientCheckboxes = document.querySelectorAll('#genPayrollClientList input[type="checkbox"]:checked');
    const targetClientId = allChecked ? 'all' : Array.from(clientCheckboxes).map(cb => cb.value);

    const groupByClient = document.getElementById('genPayrollGroupByClient').value === 'true';
    if (!from || !to) return toast('Selecione as datas de inicio e fim.');
    
    e.target.disabled = true;
    e.target.textContent = 'Gerando...';
    try {
      const res = await fetch('/api/finance/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'payroll', periodFrom: from, periodTo: to, targetId: empId, targetClientId, groupByClient })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar holerites');
      
      toast(`${data.payrollsGenerated} holerites gerados com sucesso!`);
      renderFinanceSummary();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      e.target.disabled = false;
      e.target.textContent = 'Gerar Holerites';
    }
  }
});

// ── FINANCE DOCUMENTS TABLE (Abas + Filtros + Tabela + Paginação) ────────────
const finState = {
  tab: 'invoices',       // 'invoices' | 'payrolls'
  invoices: [],
  payrolls: [],
  filtered: [],
  sortCol: 'num',
  sortDir: 'desc',
  page: 1,
  perPage: 10,
  target: null, // null for grouped cards view, or string (client/employee name) for detail view
};

window.renderFinanceSummary = async function() {
  // Populate generation selectors (unchanged logic)
  try {
    const data = await api('/api/users');
    const users = data.users || [];
    const clients = users.filter(u => u.role === 'client');
    const emps = users.filter(u => ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(u.role));
    const selClient = document.getElementById('genInvoiceClient');
    if (selClient) selClient.innerHTML = '<option value="all">Todos os Clientes</option>' + clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    const selEmp = document.getElementById('genPayrollEmployee');
    const selPayClientList = document.getElementById('genPayrollClientList');
    if (selEmp) selEmp.innerHTML = '<option value="all">Todos os Funcionários</option>' + emps.map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('');
    if (selPayClientList) {
      selPayClientList.innerHTML = clients.map(c => `
        <label style="display:flex; align-items:center; gap:12px; font-size:1rem; cursor:pointer;">
          <input type="checkbox" value="${c.id}" class="payroll-client-cb" checked onchange="document.getElementById('genPayrollClientAll').checked = false;" style="min-height:auto; width:22px; height:22px; margin:0; padding:0; accent-color:var(--primary);" />
          ${escapeHtml(c.name)}
        </label>
      `).join('');
    }
    
    // Fetch docs
    const res = await api('/api/finance/summary');
    finState.invoices = res.invoices || [];
    finState.payrolls = res.payrolls || [];

    // Badges
    const bi = document.getElementById('finBadgeInvoices');
    const bp = document.getElementById('finBadgePayrolls');
    if (bi) bi.textContent = finState.invoices.length;
    if (bp) bp.textContent = finState.payrolls.length;

    // Populate month filter
    _finBuildMonthFilter();

    // Render current tab
    applyFinFilters();
  } catch (err) {
    const tbody = document.getElementById('finTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:32px;">Erro ao carregar documentos.</td></tr>`;
    console.error(err);
  }
};

function _finBuildMonthFilter() {
  const sel = document.getElementById('finMonthFilter');
  if (!sel) return;
  const docs = finState.tab === 'invoices' ? finState.invoices : finState.payrolls;
  const months = new Set();
  docs.forEach(d => {
    const from = d.period_from || '';
    if (from) {
      const parts = from.split('-');
      if (parts.length >= 2) months.add(`${parts[0]}-${parts[1]}`);
    }
  });
  const sorted = [...months].sort().reverse();
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos os meses</option>' + sorted.map(m => {
    const [y, mo] = m.split('-');
    const label = new Date(+y, +mo - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return `<option value="${m}"${current === m ? ' selected' : ''}>${label.charAt(0).toUpperCase() + label.slice(1)}</option>`;
  }).join('');
}

window.switchFinTab = function(tab) {
  finState.tab = tab;
  finState.page = 1;
  finState.target = null;
  document.getElementById('finTabInvoices').classList.toggle('active', tab === 'invoices');
  document.getElementById('finTabPayrolls').classList.toggle('active', tab === 'payrolls');
  document.getElementById('finDocsSubtitle').textContent = tab === 'invoices' ? 'Faturas oficiais para os clientes' : 'Custos e pagamentos para a equipe';
  // Rebuild month filter for new tab
  document.getElementById('finMonthFilter').value = '';
  _finBuildMonthFilter();
  applyFinFilters();
};

window.applyFinFilters = function() {
  const search = (document.getElementById('finSearch')?.value || '').toLowerCase().trim();
  const monthVal = document.getElementById('finMonthFilter')?.value || '';
  const docs = finState.tab === 'invoices' ? finState.invoices : finState.payrolls;

  finState.filtered = docs.filter(d => {
    const name = finState.tab === 'invoices' ? (d.client_name || '') : (d.employee_name || '');
    const matchSearch = !search || name.toLowerCase().includes(search);
    const from = d.period_from || '';
    const matchMonth = !monthVal || from.startsWith(monthVal);
    return matchSearch && matchMonth;
  });

  finState.page = 1;
  _finSort();
  _finRender();
};

window.clearFinFilters = function() {
  const s = document.getElementById('finSearch');
  const m = document.getElementById('finMonthFilter');
  if (s) s.value = '';
  if (m) m.value = '';
  applyFinFilters();
};

window.sortFinTable = function(col) {
  if (finState.sortCol === col) {
    finState.sortDir = finState.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    finState.sortCol = col;
    finState.sortDir = col === 'num' || col === 'amount' || col === 'jobs' ? 'desc' : 'asc';
  }
  // Update header icons
  document.querySelectorAll('.fin-th').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.col === col) th.classList.add(finState.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
  });
  _finSort();
  _finRender();
};

function _finSort() {
  const col = finState.sortCol;
  const dir = finState.sortDir === 'asc' ? 1 : -1;
  finState.filtered.sort((a, b) => {
    let av, bv;
    if (col === 'num') { av = Number(a.invoice_number || a.id || 0); bv = Number(b.invoice_number || b.id || 0); }
    else if (col === 'name') { av = (a.client_name || a.employee_name || '').toLowerCase(); bv = (b.client_name || b.employee_name || '').toLowerCase(); }
    else if (col === 'period') { av = a.period_from || ''; bv = b.period_from || ''; }
    else if (col === 'jobs') { av = (a.jobs || []).length; bv = (b.jobs || []).length; }
    else if (col === 'amount') { av = Number(a.total_amount || 0); bv = Number(b.total_amount || 0); }
    else { av = 0; bv = 0; }
    if (av < bv) return -dir;
    if (av > bv) return dir;
    return 0;
  });
}

window.openFinTarget = function(encodedName) {
  finState.target = decodeURIComponent(encodedName);
  finState.page = 1;
  _finRender();
};

window.clearFinTarget = function() {
  finState.target = null;
  finState.page = 1;
  _finRender();
};

function _finRender() {
  const tbody = document.getElementById('finTableBody');
  const pageInfo = document.getElementById('finPageInfo');
  const prevBtn = document.getElementById('finPagePrev');
  const nextBtn = document.getElementById('finPageNext');
  
  const groupContainer = document.getElementById('finGroupContainer');
  const tableWrap = document.getElementById('finTableWrap');
  const pagination = document.getElementById('finPagination');
  const detailHeader = document.getElementById('finDetailHeader');
  const targetTitle = document.getElementById('finTargetTitle');
  
  const isInv = finState.tab === 'invoices';

  if (!finState.target) {
    // ---- GROUPED VIEW (Level 1) ----
    if (detailHeader) detailHeader.classList.add('hidden');
    if (tableWrap) tableWrap.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    if (groupContainer) {
      groupContainer.style.display = 'grid';
      
      // Group data by name
      const groups = {};
      finState.filtered.forEach(d => {
        const name = isInv ? (d.client_name || 'Desconhecido') : (d.employee_name || 'Desconhecido');
        if (!groups[name]) groups[name] = { count: 0, amount: 0 };
        groups[name].count++;
        groups[name].amount += Number(d.total_amount || 0);
      });
      
      const groupArr = Object.keys(groups).map(name => ({ name, ...groups[name] })).sort((a,b) => b.amount - a.amount);
      
      if (groupArr.length === 0) {
        groupContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding: 40px; color: var(--muted);">Nenhum ${isInv ? 'cliente' : 'funcionário'} encontrado.</div>`;
      } else {
        groupContainer.innerHTML = groupArr.map(g => `
          <div class="fin-group-card" onclick="openFinTarget('${encodeURIComponent(g.name)}')">
            <div class="fin-group-left">
              <div class="fin-group-icon">
                <i data-lucide="${isInv ? 'building' : 'user'}"></i>
              </div>
              <div>
                <div class="fin-group-name">${escapeHtml(g.name)}</div>
                <div class="fin-group-meta">${g.count} documento${g.count > 1 ? 's' : ''}</div>
              </div>
            </div>
            <div class="fin-group-right">
              <div class="fin-group-value">${formatCurrencyGBP(g.amount)}</div>
              <div class="fin-group-arrow"><i data-lucide="chevron-right"></i></div>
            </div>
          </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons({ root: groupContainer });
      }
    }
    return;
  }

  // ---- DETAIL VIEW (Level 2) ----
  if (groupContainer) groupContainer.style.display = 'none';
  if (detailHeader) {
    detailHeader.classList.remove('hidden');
    if (targetTitle) targetTitle.textContent = `${isInv ? 'Faturas de' : 'Holerites de'} ${finState.target}`;
  }
  if (tableWrap) tableWrap.style.display = 'block';
  if (pagination) pagination.style.display = 'flex';
  
  if (!tbody) return;

  // Filter specific to the target
  const detailDocs = finState.filtered.filter(d => {
    const name = isInv ? (d.client_name || 'Desconhecido') : (d.employee_name || 'Desconhecido');
    return name === finState.target;
  });

  const total = detailDocs.length;
  const totalPages = Math.ceil(total / finState.perPage) || 1;
  finState.page = Math.max(1, Math.min(totalPages, finState.page));

  const start = (finState.page - 1) * finState.perPage;
  const page = detailDocs.slice(start, start + finState.perPage);

  if (pageInfo) pageInfo.textContent = `Página ${finState.page} de ${totalPages} · ${total} documento${total !== 1 ? 's' : ''}`;
  if (prevBtn) prevBtn.disabled = finState.page <= 1;
  if (nextBtn) nextBtn.disabled = finState.page >= totalPages;

  if (page.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:40px;">Nenhum documento encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = page.map(d => {
    const num = isInv ? (d.invoice_number || d.id) : d.id;
    const name = escapeHtml(isInv ? (d.client_name || '—') : (d.employee_name || '—'));
    const from = d.period_from || '—';
    const to = d.period_to || '—';
    const period = from === to ? from : `${from} → ${to}`;
    const jobs = (d.jobs || []).length;
    const amount = `£${Number(d.total_amount || 0).toFixed(2)}`;
    const editFn = isInv ? `openEditInvoiceModal(${d.id})` : `openEditPayrollModal(${d.id})`;
    const delFn = isInv ? `deleteInvoice(${d.id})` : `deletePayroll(${d.id})`;

    return `
      <tr style="position:relative; margin: 0 0 16px 0 !important; border-radius:16px; box-shadow:0 2px 4px rgba(0,0,0,0.02); padding:16px !important;">
        <!-- Mobile Layout -->
        <td class="mobile-only" style="flex-direction:column; padding:0 !important; border:none !important; width:100%; gap:0; margin:0 !important;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div style="font-weight:800; font-size:18px; color:var(--text);">#${num}</div>
            <div style="display:flex; flex-direction:column; align-items:center;">
               <div style="background: rgba(16, 185, 129, 0.1); color: var(--success); font-weight:800; padding:4px 12px; border-radius:16px; font-size:14px;">${jobs}</div>
               <span style="font-size:12px; color:var(--muted); margin-top:4px;">Itens</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-weight:700; font-size:16px; color:var(--text); margin-bottom:12px;">
            <i data-lucide="${isInv ? 'building-2' : 'user'}" style="width:18px;height:18px;color:var(--primary);"></i>
            ${name}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
             <div style="display:flex; align-items:center; gap:8px; color:var(--muted); font-size:14px;">
               <i data-lucide="calendar" style="width:16px;height:16px;"></i> ${period}
             </div>
             <div style="font-weight:800; font-size:18px; color:var(--text);">${amount}</div>
          </div>
          <div style="border-top: 1px dashed var(--line); padding-top:16px; display:flex; gap:12px;">
            <button type="button" class="ghost-button" onclick="${editFn}" style="flex:1; justify-content:center; gap:8px; border-radius:12px; border:1px solid var(--line); color:var(--muted); background:transparent;">
              <i data-lucide="edit-3" style="width:16px;height:16px;"></i> Editar
            </button>
            <button type="button" class="ghost-button" onclick="${delFn}" style="flex:1; justify-content:center; gap:8px; border-radius:12px; border:1px solid rgba(239,68,68,0.3); color:var(--danger); background:transparent;">
              <i data-lucide="trash-2" style="width:16px;height:16px;"></i> Excluir
            </button>
          </div>
        </td>

        <!-- Desktop Layout -->
        <td class="fin-td fin-td-num desktop-only">#${num}</td>
        <td class="fin-td fin-td-name desktop-only">${name}</td>
        <td class="fin-td fin-td-period desktop-only">${period}</td>
        <td class="fin-td fin-td-jobs desktop-only"><span class="fin-jobs-badge">${jobs}</span></td>
        <td class="fin-td fin-td-amount desktop-only">${amount}</td>
        <td class="fin-td desktop-only">
          <div class="fin-actions">
            <button type="button" class="fin-action-btn edit" onclick="${editFn}" title="Editar"><i data-lucide="edit-3"></i></button>
            <button type="button" class="fin-action-btn delete" onclick="${delFn}" title="Excluir"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
  
  if (window.lucide) {
    window.lucide.createIcons({ root: tbody });
  }
}


window.deleteInvoice = async function(id) {
  if (!confirm('Tem certeza que deseja excluir esta Fatura? Os serviços vinculados a ela voltarão a ficar disponíveis para cobrança.')) return;
  try {
    const res = await api(`/api/finance/invoices/${id}`, { method: 'DELETE' });
    if (res.success) {
      alert('Fatura excluída com sucesso.');
      loadFinanceDocuments();
    }
  } catch (err) { alert('Erro ao excluir: ' + err.message); }
};

window.deletePayroll = async function(id) {
  if (!confirm('Tem certeza que deseja excluir este Holerite? Os serviços vinculados voltarão a ficar disponíveis para pagamento.')) return;
  try {
    const res = await api(`/api/finance/payrolls/${id}`, { method: 'DELETE' });
    if (res.success) {
      alert('Holerite excluído com sucesso.');
      loadFinanceDocuments();
    }
  } catch (err) { alert('Erro ao excluir: ' + err.message); }
};


window.openAdminEditJobModal = async function(jobId) {
  const modal = document.getElementById('adminEditJobModal');
  const selEmp = document.getElementById('adminEditJobEmployee');
  
  selEmp.innerHTML = '<option value="">Nenhum (Pendente)</option>';
  try {
    const data = await api('/api/users');
    const users = data.users || [];
    users.filter(u => ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(u.role)).forEach(emp => {
      const opt = document.createElement('option');
      opt.value = emp.id;
      opt.textContent = emp.name;
      selEmp.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
  }

  const job = state.jobs?.find(j => j.id === jobId);
  if (!job) return;

  document.getElementById('adminEditJobId').value = job.id;
  selEmp.value = job.employeeUserId || '';
  document.getElementById('adminEditJobDate').value = job.requestedDate || '';
  document.getElementById('adminEditJobStatus').value = job.status || 'pending';
  document.getElementById('adminEditJobIsHoliday').checked = job.isHoliday ? true : false;
  
  const durContainer = document.getElementById('adminEditJobDurationContainer');
  const durInput = document.getElementById('adminEditJobDuration');
  if (job.status === 'completed') {
    durContainer.classList.remove('hidden');
    durInput.value = decimalToTimeStr(job.durationHours);
  } else {
    durContainer.classList.add('hidden');
    durInput.value = '';
  }

  modal.classList.remove('hidden');
};

document.getElementById('closeAdminEditJobModal')?.addEventListener('click', () => {
  document.getElementById('adminEditJobModal').classList.add('hidden');
});

document.getElementById('adminEditJobStatus')?.addEventListener('change', (e) => {
  const durContainer = document.getElementById('adminEditJobDurationContainer');
  if (e.target.value === 'completed') {
    durContainer.classList.remove('hidden');
  } else {
    durContainer.classList.add('hidden');
  }
});

document.getElementById('confirmAdminEditJobButton')?.addEventListener('click', async (e) => {
  const jobId = document.getElementById('adminEditJobId').value;
  const status = document.getElementById('adminEditJobStatus').value;
  const employeeUserId = document.getElementById('adminEditJobEmployee').value;
  const requestedDate = document.getElementById('adminEditJobDate').value;
  const durationStr = document.getElementById('adminEditJobDuration').value;
  const isHoliday = document.getElementById('adminEditJobIsHoliday').checked;
  
  const payload = { 
    status, 
    employeeUserId: employeeUserId || null, 
    requestedDate, 
    isHoliday,
    durationHours: status === 'completed' ? timeStrToDecimal(durationStr) : undefined
  };

  e.target.disabled = true;
  e.target.textContent = 'Salvando...';

  try {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Falha ao atualizar servico');
    toast('Servico atualizado!');
    document.getElementById('adminEditJobModal').classList.add('hidden');
    loadJobs();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    e.target.disabled = false;
    e.target.textContent = 'Salvar Alteracoes';
  }
});

window.openClientEditJobModal = function(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;
  document.getElementById('clientEditJobId').value = job.id;
  document.getElementById('clientEditJobDate').value = job.requestedDate || (job.requested_date ? job.requested_date.slice(0,10) : '');
  document.getElementById('clientEditJobNotes').value = job.notes || '';
  document.getElementById('clientEditJobModal').classList.remove('hidden');
};

document.getElementById('closeClientEditJobModal')?.addEventListener('click', () => {
  document.getElementById('clientEditJobModal').classList.add('hidden');
});

document.getElementById('confirmClientEditJobButton')?.addEventListener('click', async (e) => {
  const jobId = document.getElementById('clientEditJobId').value;
  const requestedDate = document.getElementById('clientEditJobDate').value;
  const notes = document.getElementById('clientEditJobNotes').value;
  
  if (!requestedDate) {
    return toast('A data é obrigatoria.', 'error');
  }

  e.target.disabled = true;
  e.target.textContent = 'Salvando...';

  try {
    const res = await fetch(`/api/jobs/${jobId}/client`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestedDate, notes })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Falha ao atualizar servico');
    }
    toast('Servico atualizado com sucesso!');
    document.getElementById('clientEditJobModal').classList.add('hidden');
    loadJobs();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    e.target.disabled = false;
    e.target.textContent = 'Salvar Alteracoes';
  }
});

// --- RESTORED CODE ---
async function loadJobs() {
  try {
    const data = await api('/api/jobs');
    state.jobs = data.jobs || [];
    renderJobs();
  } catch (err) {
    console.error(err);
    toast(err.message || 'Erro ao carregar servicos', 'error');
  }
}

function renderJobs() {
  const jobsList = document.getElementById('jobsList');
  const jobsStats = document.getElementById('jobsStats');
  if (!jobsList) return;
  
  const statusFilterEl = document.getElementById('jobsStatusFilter');
  const clientFilterEl = document.getElementById('jobsClientFilter');
  
  if (clientFilterEl && state.jobs) {
    const clients = {};
    state.jobs.forEach(j => {
      if (j.clientUserId && j.clientName) {
        clients[j.clientUserId] = j.clientName;
      }
    });
    const currentOptions = Array.from(clientFilterEl.options).map(o => o.value);
    const newClientIds = Object.keys(clients);
    
    // Only rebuild if there are new clients we don't have yet, to preserve selection
    if (newClientIds.some(id => !currentOptions.includes(id))) {
      const currentVal = clientFilterEl.value;
      clientFilterEl.innerHTML = '<option value="">Todos os clientes</option>' + 
        newClientIds.sort((a,b) => clients[a].localeCompare(clients[b])).map(id => `<option value="${id}">${escapeHtml(clients[id])}</option>`).join('');
      clientFilterEl.value = currentVal;
    }
  }
  
  const statusFilter = statusFilterEl?.value;
  const clientFilter = clientFilterEl?.value;
  const dateFrom = document.getElementById('jobsDateFrom')?.value;
  const dateTo   = document.getElementById('jobsDateTo')?.value;
  
  let filtered = state.jobs || [];
  if (statusFilter) filtered = filtered.filter(j => j.status === statusFilter);
  if (clientFilter) filtered = filtered.filter(j => String(j.clientUserId) === String(clientFilter));
  if (dateFrom) filtered = filtered.filter(j => (j.requestedDate || '').slice(0, 10) >= dateFrom);
  if (dateTo)   filtered = filtered.filter(j => (j.requestedDate || '').slice(0, 10) <= dateTo);
  
  const formatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const statusLabels = {
    pending: 'Pendente',
    assigned: 'Designado',
    accepted: 'Aceito',
    in_progress: 'Em andamento',
    completed: 'Concluido',
    cancelled: 'Cancelado'
  };

  const timeFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
  
  let html = `
    <div class="table-wrap">
      <table class="data-table responsive-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Propriedade</th>
            <th>Data/Hora</th>
            <th>Profissional / Cliente</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  if (filtered.length === 0) {
    html += `<tr><td colspan="5">
      <div class="empty-state glass-card" style="border-radius:24px; text-align:center; padding:40px 20px; margin-top:16px;">
        <i data-lucide="inbox" style="width:48px;height:48px;color:var(--muted);margin-bottom:16px;"></i>
        <h3 style="margin-bottom:0.5rem;">Nenhum serviço encontrado</h3>
        <p style="color:var(--muted); font-size:0.9rem;">Não há serviços correspondentes aos filtros selecionados.</p>
      </div>
    </td></tr>`;
  } else {
    html += filtered.map(job => {
      let actions = '';
      if (state.user.role === 'client' || state.user.role === 'client_user') {
        if (job.status === 'pending' || job.status === 'assigned' || job.status === 'accepted') {
          actions += `<button class="ghost-button" onclick="openClientEditJobModal(${job.id})" title="Editar Pedido"><i data-lucide="edit-3"></i></button>`;
        }
      } else {
        actions += `<button class="ghost-button" onclick="openAdminEditJobModal(${job.id})" title="Editar"><i data-lucide="edit-3"></i></button>`;
      }
      
      if (state.user.role !== 'client' && state.user.role !== 'client_user') {
        if (job.status === 'pending' || job.status === 'assigned') {
          actions += `<button class="ghost-button" style="color:var(--primary);" onclick="openAssignEmployeeModal(${job.id})" title="Designar"><i data-lucide="user-plus"></i></button>`;
        }
        if (job.status !== 'completed' && job.status !== 'cancelled') {
          actions += `<button class="ghost-button" style="color:var(--success);" onclick="markJobAs(${job.id}, 'completed')" title="Marcar Concluído"><i data-lucide="check-circle"></i></button>`;
        }
      }
      if (job.status === 'in_progress' || job.status === 'completed') {
        actions += `<button class="ghost-button" style="color: var(--primary);" onclick="openJobPhotos(${job.id}, '${escapeHtml(job.flatAddress).replace(/'/g, "\\'")}')" title="Ver Fotos"><i data-lucide="camera"></i></button>`;
      }
      actions += `<button class="ghost-button" style="color: var(--danger);" onclick="deleteJob(${job.id})" title="Excluir"><i data-lucide="trash-2"></i></button>`;
      
      let badgeClass = 'badge-neutral';
      if(job.status === 'completed') badgeClass = 'badge-success';
      if(job.status === 'pending') badgeClass = 'badge-warning';
      if(job.status === 'in_progress') badgeClass = 'badge-primary';
      if(job.status === 'cancelled') badgeClass = 'badge-danger';
      if(job.status === 'assigned') badgeClass = 'badge-info';
      if(job.status === 'accepted') badgeClass = 'badge-light-green';
      
      let timelineHtml = '';
      if (state.user && state.user.role !== 'client' && state.user.role !== 'client_user') {
        let items = [];
        if (job.startedAt) items.push(`<span style="color:var(--success); font-weight:600; margin-right:8px;">Início: ${timeFmt.format(new Date(job.startedAt))}</span>`);
        if (job.finishedAt) items.push(`<span style="color:var(--danger); font-weight:600;">Fim: ${timeFmt.format(new Date(job.finishedAt))}</span>`);
        if (items.length > 0) {
          timelineHtml = `<div style="font-size:14px; margin-bottom:8px;">${items.join('')}</div>`;
        }
      }
      
      const urgentFlag = job.is_urgent ? `<div style="margin-top:8px; display:inline-block; background:var(--danger); color:#fff; padding:4px 8px; border-radius:999px; font-size:0.75rem; font-weight:700;"><i data-lucide="alert-circle" style="width:12px;height:12px;display:inline;vertical-align:-2px;"></i> URGENTE</div>` : '';

      return `
        <tr ${job.is_urgent ? 'style="background: rgba(220, 38, 38, 0.03);"' : ''}>
          <td class="td-status" data-label="Status">
            <span class="badge ${badgeClass}" style="border-radius:24px; padding:6px 12px; font-weight:600;">${statusLabels[job.status] || job.status}</span>
            ${urgentFlag}
          </td>
          <td class="td-prop" data-label="Propriedade">
            <strong style="display:block; font-size:18px; margin-bottom:4px; color:var(--text);">${escapeHtml(job.flatAddress || `ID: ${job.flatId}`)}</strong>
            ${job.flatFullAddress ? `<div style="color:var(--muted); font-size:14px; margin-bottom:8px;">${escapeHtml(job.flatFullAddress)}</div>` : ''}
            ${job.flatAccessCode ? `<div style="color:var(--primary); font-size:14px; font-weight:600; margin-bottom:8px;"><i data-lucide="key" style="width:16px;height:16px;display:inline;vertical-align:-3px;"></i> Código ${escapeHtml(job.flatAccessCode)}</div>` : ''}
          </td>
          <td class="td-meta1" data-label="Data/Hora">
            <div style="display:flex; align-items:center; flex-wrap:wrap; font-size:15px; color:var(--muted); margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:6px; padding-right:12px;">
                <i data-lucide="calendar" style="width:18px;height:18px;"></i> ${escapeHtml(job.requestedDate)}
              </div>
              <!-- Mobile cleaner copy -->
              <div class="mobile-only" style="align-items:center; gap:6px; border-left:1px solid var(--line); padding-left:12px;">
                <i data-lucide="user" style="width:18px;height:18px;"></i> 
                ${escapeHtml(job.employeeName || 'Sem Profissional')}
              </div>
              ${job.durationHours ? `<div style="margin-left:auto; font-size:14px;">Dur: ${formatHours(job.durationHours)}</div>` : ''}
            </div>
            ${timelineHtml}
          </td>
          <td class="td-meta2" data-label="Profissional / Cliente">
            <!-- Desktop cleaner copy -->
            <div class="desktop-only" style="font-weight:500; font-size:14px; margin-bottom:4px;">
              <i data-lucide="user" style="width:14px;height:14px;display:inline;vertical-align:-2px;color:var(--muted);"></i> 
              ${escapeHtml(job.employeeName || 'Sem Profissional')}
            </div>
            ${job.clientName ? `<div style="color:var(--muted); font-size:15px; margin-bottom:8px;">Cliente: ${escapeHtml(job.clientName)}</div>` : ''}
            <div style="margin-bottom:8px; display:flex; align-items:center; gap:12px;">
              ${job.employeeAmount != null ? `<strong style="color:var(--success); font-size:15px;">+${formatCurrencyGBP(job.employeeAmount)}</strong>` : ''}
              ${job.clientAmount != null ? `<strong style="color:var(--primary); font-size:15px;">C: ${formatCurrencyGBP(job.clientAmount)}</strong>` : ''}
            </div>
          </td>
          <td class="td-actions" data-label="Ações">
            <div class="table-actions" style="justify-content:space-between; display:flex; gap:12px;">${actions}</div>
          </td>
        </tr>
      `;
    }).join('');
  }
  html += `</tbody></table></div>`;
  jobsList.innerHTML = html;
  if (window.lucide) window.lucide.createIcons({ root: jobsList });
}

window.filterJobsToday = function() {
  const today = new Date().toISOString().slice(0, 10);
  const fromEl = document.getElementById('jobsDateFrom');
  const toEl   = document.getElementById('jobsDateTo');
  if (fromEl) fromEl.value = today;
  if (toEl)   toEl.value   = today;
  renderJobs();
};

window.clearJobsDateFilter = function() {
  const fromEl = document.getElementById('jobsDateFrom');
  const toEl   = document.getElementById('jobsDateTo');
  if (fromEl) fromEl.value = '';
  if (toEl)   toEl.value   = '';
  renderJobs();
};

// Wire up filter change events
document.getElementById('jobsStatusFilter')?.addEventListener('change', renderJobs);
document.getElementById('jobsClientFilter')?.addEventListener('change', renderJobs);
document.getElementById('jobsDateFrom')?.addEventListener('change', renderJobs);
document.getElementById('jobsDateTo')?.addEventListener('change', renderJobs);


window.openAssignEmployeeModal = async function(jobId) {
  const modal = document.getElementById('assignJobModal');
  const select = document.getElementById('assignEmployeeSelect');
  document.getElementById('assignJobId').value = jobId;
  
  select.innerHTML = '<option value="">Carregando...</option>';
  try {
    const data = await api('/api/users');
    const emps = (data.users || []).filter(u => ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(u.role));
    select.innerHTML = '<option value="">Selecione...</option>' + emps.map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('');
  } catch (err) {
    console.error(err);
    select.innerHTML = '<option value="">Erro ao carregar</option>';
  }
  
  modal.classList.remove('hidden');
};

document.getElementById('closeAssignJobModal')?.addEventListener('click', () => {
  document.getElementById('assignJobModal').classList.add('hidden');
});

document.getElementById('confirmAssignButton')?.addEventListener('click', async (e) => {
  const jobId = document.getElementById('assignJobId').value;
  const empId = document.getElementById('assignEmployeeSelect').value;
  if (!empId) {
    toast('Selecione um funcionario', 'error');
    return;
  }
  
  e.target.disabled = true;
  e.target.textContent = 'Designando...';
  
  try {
    const data = await api(`/api/jobs/${jobId}/assign`, {
      method: 'PATCH',
      body: { employeeUserId: empId }
    });
    toast('Funcionario designado!');
    document.getElementById('assignJobModal').classList.add('hidden');
    loadJobs();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    e.target.disabled = false;
    e.target.textContent = 'Designar';
  }
});

async function markJobAs(id, status) {
  try {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Erro ao atualizar status');
    toast('Status atualizado com sucesso!', 'success');
    loadJobs();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function loadFinance() {
  if (els.invoiceSummaryList) els.invoiceSummaryList.innerHTML = '<div class="stack-item">Carregando...</div>';
  if (els.financePayrollList) els.financePayrollList.innerHTML = '<div class="stack-item">Carregando...</div>';
  
  try {
    // We get the reports from the backend now
    const from = document.getElementById('financeFrom')?.value;
    const to = document.getElementById('financeTo')?.value;
    let qs = '';
    if (from && to) qs = `?from=${from}&to=${to}`;
    
    const data = await api('/api/finance/summary' + qs);
    state.finance = data;
    renderFinanceSummary();
  } catch (err) {
    console.error(err);
    toast('Falha ao carregar financeiro', 'error');
  }
}

function renderFinanceSummary() {
  if (!state.finance) return;
  const { invoices = [], payrolls = [], revenue = 0, staffCost = 0, profit = 0 } = state.finance;
  
  if (els.financeStats) {
    els.financeStats.className = 'stats-row';
    els.financeStats.style.marginBottom = '24px';
    els.financeStats.innerHTML = `
      <article class="stat-card glass-card">
        <strong>${escapeHtml(formatCurrencyGBP(revenue))}</strong>
        <span style="color:var(--muted);">Receitas clientes</span>
      </article>
      <article class="stat-card glass-card">
        <strong style="color:var(--danger);">${escapeHtml(formatCurrencyGBP(staffCost))}</strong>
        <span style="color:var(--muted);">Gastos operacionais</span>
      </article>
      <article class="stat-card glass-card">
        <strong style="color:${profit >= 0 ? 'var(--success)' : 'var(--danger)'};">${escapeHtml(formatCurrencyGBP(profit))}</strong>
        <span style="color:var(--muted);">Lucro operacional</span>
      </article>
    `;
  }
  
  if (els.invoiceSummaryList) {
    els.invoiceSummaryList.innerHTML = invoices.map(inv => {
      // O backend agrupa por client_user_id e invoice_group (que agora e a cidade)
      const isSent = false; // logic for sent invoices
      return `
      <div class="stack-item">
        <strong>${escapeHtml(inv.client_name)} - ${escapeHtml(inv.invoice_group || 'Padrao')}</strong>
        <small>Total Invoice: ${formatCurrencyGBP(inv.grandTotal)}</small>
        <div class="invoice-card-actions">
          <button class="ghost-button" onclick="window.open('/print/invoice/${inv.id}', '_blank')">Ver PDF / Imprimir</button>
        </div>
      </div>
      `;
    }).join('') || '<div class="stack-item">Nenhum invoice no periodo.</div>';
  }
  
  if (els.financePayrollList) {
    els.financePayrollList.innerHTML = payrolls.map(pay => {
      return `
      <div class="stack-item">
        <strong>${escapeHtml(pay.employee_name)}</strong>
        <small>Total Holerite: ${formatCurrencyGBP(pay.netAmount)}</small>
        <div class="invoice-card-actions">
          <button class="ghost-button" onclick="window.open('/print/payslip/${pay.id}', '_blank')">Ver PDF / Imprimir</button>
        </div>
      </div>
      `;
    }).join('') || '<div class="stack-item">Nenhum holerite no periodo.</div>';
  }
}

document.getElementById('generateInvoicesButton')?.addEventListener('click', async () => {
  const btn = document.getElementById('generateInvoicesButton');
  btn.disabled = true;
  btn.textContent = 'Gerando...';
  try {
    const from = document.getElementById('financeFrom')?.value;
    const to = document.getElementById('financeTo')?.value;
    const res = await fetch('/api/finance/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to })
    });
    if (!res.ok) throw new Error('Erro ao processar faturamento');
    toast('Faturamento gerado com sucesso!', 'success');
    loadFinance();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Processar Faturamento';
  }
});

// Override switchView
function switchView(view) {
  // Close mobile sidebar if open
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.remove('active');

  const viewTitles = {
    dashboard: 'Fantastic BNB',
    jobs: 'Trabalhos',
    cleaners: 'Cadastros',
    finance: 'Financeiro',
    flats: 'Gestão de Flats',
    config: 'Configurações',
    admin: 'Administração',
    overview: 'Visão Geral'
  };
  const mobileTitle = document.getElementById('mobileTopbarTitle');
  if (mobileTitle) mobileTitle.textContent = viewTitles[view] || 'Fantastic BNB';

  const mobileBar = document.querySelector('.mobile-app-bar');
  if (mobileBar) {
    if (view === 'flats') {
      mobileBar.style.display = 'none';
      document.querySelector('.content').style.paddingTop = '0';
    } else {
      mobileBar.style.display = 'flex';
      document.querySelector('.content').style.paddingTop = ''; // reset to default CSS
    }
  }

  Object.entries(els.views).forEach(([key, node]) => {
    if (node) node.classList.toggle('hidden', key !== view);
  });
  els.navLinks.forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  
  if (view === 'jobs') loadJobs();
  if (view === 'flats') {
    if (typeof loadFlats === 'function') loadFlats();
    if (typeof renderFlats === 'function') renderFlats();
  }
  if (view === 'finance') loadFinance();
  if (view === 'cleaners') {
    if (typeof loadUsers === 'function') loadUsers();
    if (typeof loadClients === 'function') loadClients();
  }
  if (view === 'dashboard') {
     if (typeof loadDashboard === 'function') loadDashboard();
  }
}

function renderGeneratedDocuments() {
  renderGeneratedInvoicesPage();
  renderGeneratedPayrollsPage();
}

function renderGeneratedInvoicesPage() {
  if (!els.generatedInvoicesList || !els.generatedInvoiceClientFilter) return;
  const names = [...new Set(state.generatedInvoices.map((item) => item.clientName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const current = els.generatedInvoiceClientFilter.value;
  els.generatedInvoiceClientFilter.innerHTML = [`<option value="">Todos os clientes</option>`, ...names.map((name) => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`)].join('');
  els.generatedInvoiceClientFilter.value = names.includes(current) ? current : '';
  const from = els.generatedInvoiceFrom?.value || '';
  const to = els.generatedInvoiceTo?.value || '';
  const clientName = els.generatedInvoiceClientFilter.value;
  const filtered = state.generatedInvoices.filter((item) => {
    const docDate = String(item.createdAt || '').slice(0, 10);
    if (clientName && item.clientName !== clientName) return false;
    if (from && docDate < from) return false;
    if (to && docDate > to) return false;
    return true;
  });
  els.generatedInvoicesList.innerHTML = filtered.map((item) => `
    <div class="stack-item">
      <strong>${escapeHtml(item.number)} - ${escapeHtml(item.clientName)} - ${escapeHtml(item.invoiceGroup)}</strong>
      <span>${escapeHtml(item.periodLabel || '-')}</span>
      <small>Gerado em: ${escapeHtml(formatDateTime(item.createdAt))}</small>
      <small>Total: ${escapeHtml(formatCurrencyGBP(item.total || 0))}</small>
      <div class="invoice-card-actions">
        <button class="ghost-button" type="button" data-generated-invoice-download="${escapeAttribute(item.number)}">Baixar PDF</button>
        <button class="ghost-button" type="button" data-generated-invoice-delete="${escapeAttribute(item.number)}">Excluir</button>
      </div>
    </div>
  `).join('') || '<div class="stack-item"><span>Nenhum invoice gerado nesse filtro.</span></div>';
  els.generatedInvoicesList.querySelectorAll('[data-generated-invoice-download]').forEach((button) => {
    button.addEventListener('click', () => {
      const generated = state.generatedInvoices.find((item) => item.number === button.dataset.generatedInvoiceDownload);
      if (!generated) return;
      downloadInvoicePdf(generated.number, getEntriesForGeneratedDocument(generated));
    });
  });
  els.generatedInvoicesList.querySelectorAll('[data-generated-invoice-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteGeneratedInvoice(button.dataset.generatedInvoiceDelete));
  });
}

function renderGeneratedPayrollsPage() {
  if (!els.generatedPayrollsList || !els.generatedPayrollCleanerFilter) return;
  const names = [...new Set(state.generatedPayrolls.map((item) => item.cleanerName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const current = els.generatedPayrollCleanerFilter.value;
  els.generatedPayrollCleanerFilter.innerHTML = [`<option value="">Todos os cleaners</option>`, ...names.map((name) => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`)].join('');
  els.generatedPayrollCleanerFilter.value = names.includes(current) ? current : '';
  const from = els.generatedPayrollFrom?.value || '';
  const to = els.generatedPayrollTo?.value || '';
  const cleanerName = els.generatedPayrollCleanerFilter.value;
  const filtered = state.generatedPayrolls.filter((item) => {
    const docDate = String(item.createdAt || '').slice(0, 10);
    if (cleanerName && item.cleanerName !== cleanerName) return false;
    if (from && docDate < from) return false;
    if (to && docDate > to) return false;
    return true;
  });
  els.generatedPayrollsList.innerHTML = filtered.map((item) => `
    <div class="stack-item">
      <strong>${escapeHtml(item.number)} - ${escapeHtml(item.cleanerName)}</strong>
      <span>${escapeHtml(item.periodLabel || '-')}</span>
      <small>Gerado em: ${escapeHtml(formatDateTime(item.createdAt))}</small>
      <small>Total: ${escapeHtml(formatCurrency(item.total || 0))}</small>
      <div class="invoice-card-actions">
        <button class="ghost-button" type="button" data-generated-payroll-download="${escapeAttribute(item.number)}">Baixar PDF</button>
        <button class="ghost-button" type="button" data-generated-payroll-delete="${escapeAttribute(item.number)}">Excluir</button>
      </div>
    </div>
  `).join('') || '<div class="stack-item"><span>Nenhum holerite gerado nesse filtro.</span></div>';
  els.generatedPayrollsList.querySelectorAll('[data-generated-payroll-download]').forEach((button) => {
    button.addEventListener('click', () => {
      const generated = state.generatedPayrolls.find((item) => item.number === button.dataset.generatedPayrollDownload);
      if (!generated) return;
      downloadPayrollPdf(generated.number, getEntriesForGeneratedDocument(generated));
    });
  });
  els.generatedPayrollsList.querySelectorAll('[data-generated-payroll-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteGeneratedPayroll(button.dataset.generatedPayrollDelete));
  });
}

function openAssignModal(jobId) {
  const modal = document.getElementById('assignJobModal');
  const input = document.getElementById('assignJobId');
  const select = document.getElementById('assignEmployeeSelect');
  if (!modal || !input || !select) return;
  input.value = jobId;
  select.innerHTML = '<option value="">Selecione um cleaner...</option>';
  const cleaners = state.cleaners || [];
  cleaners.forEach(c => {
    select.innerHTML += `<option value="${escapeAttribute(c.name)}">${escapeHtml(c.name)}</option>`;
  });
  modal.classList.remove('hidden');
}

function closeAssignModal() {
  const modal = document.getElementById('assignJobModal');
  if (modal) modal.classList.add('hidden');
}

async function adminCancelJob(jobId) {
  if (!confirm('Deseja cancelar esta limpeza?')) return;
  try {
    await api('/api/jobs/' + jobId + '/cancel', { method: 'POST' });
    toast('Limpeza cancelada com sucesso', 'success');
    if (typeof loadOperationsState === 'function') loadOperationsState();
  } catch (err) {
    toast('Erro ao cancelar limpeza', 'error');
  }
}

async function deleteJob(jobId) {
  if (!confirm('Tem certeza que deseja excluir permanentemente esta solicitacao?')) return;
  try {
    await api('/api/jobs/' + jobId, { method: 'DELETE' });
    toast('Servico excluido com sucesso', 'success');
    if (typeof loadJobs === 'function') loadJobs();
  } catch (err) {
    toast(err.message || 'Erro ao excluir limpeza', 'error');
  }
}

const photosModal = document.getElementById('jobPhotosModal');
const photoGrid = document.getElementById('jobPhotosGrid');
const closePhotosModalBtn = document.getElementById('closeJobPhotosModal');
const closePhotosModalBottom = document.getElementById('closeJobPhotosModalBottom');

const closeJobPhotosHandler = (e) => {
  if (e && e.type === 'touchend') e.preventDefault();
  if (photosModal) photosModal.classList.add('hidden');
};

if (closePhotosModalBtn) {
  closePhotosModalBtn.addEventListener('click', closeJobPhotosHandler);
  closePhotosModalBtn.addEventListener('touchend', closeJobPhotosHandler);
}
if (closePhotosModalBottom) {
  closePhotosModalBottom.addEventListener('click', closeJobPhotosHandler);
  closePhotosModalBottom.addEventListener('touchend', closeJobPhotosHandler);
}

async function openJobPhotos(jobId, address) {
  const title = document.getElementById('jobPhotosModalTitle');
  if (title) title.textContent = `Fotos — ${address || 'Limpeza'}`;
  
  photoGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--muted);">Carregando...</div>`;
  photosModal.classList.remove('hidden');
  
  try {
    const data = await api('/api/jobs/' + jobId + '/photos');
    const photos = data.photos || [];
    if (photos.length === 0) {
      photoGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">Nenhuma foto enviada para este servico.</div>`;
    } else {
      const allSrcs = photos.map(p => `/uploads/${escapeHtml(p.filename)}`);
      const allSrcsJson = escapeHtml(JSON.stringify(allSrcs));
      photoGrid.innerHTML = photos.map(p => {
        const src = `/uploads/${escapeHtml(p.filename)}`;
        return `
        <div style="display:flex; flex-direction:column; gap:8px; background:#fafafa; p:8px; border-radius:12px; border:1px solid #eee; padding:6px;">
          <div class="photo-thumb" style="aspect-ratio:1; border-radius:8px; overflow:hidden; background:#f5f5f5; border:1px solid #ddd; position:relative;">
            <img src="${src}" alt="Foto" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" onclick="openLightbox('${src}', ${allSrcsJson})" />
          </div>
          <button type="button" onclick="downloadPhoto('${src}', '${escapeHtml(p.originalName || p.filename)}', event)" class="button" style="padding: 6px 10px; font-size: 0.85rem; background: #e8efe6; color: var(--primary); text-align: center; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; width: 100%; min-height: 38px;">⬇️ Baixar</button>
        </div>
        `;
      }).join('');
    }
  } catch (err) {
    photoGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--primary);padding:40px;">Erro ao carregar fotos.</div>`;
  }
}



let currentFinanceEditType = null;
let currentFinanceEditId = null;

function renderFinanceExtras(type, parentObj) {
  const listEl = document.getElementById('financeEditExtrasList');
  const extras = parentObj.extras || [];
  
  if (extras.length === 0) {
    listEl.innerHTML = '<div style="font-size: 0.9rem; color: var(--muted);">Nenhum lançamento extra registrado.</div>';
    return;
  }
  
  let html = `<table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
    <thead>
      <tr style="border-bottom: 1px solid var(--border);">
        <th style="text-align: left; padding: 8px;">Descrição</th>
        <th style="text-align: right; padding: 8px;">Qtd</th>
        <th style="text-align: right; padding: 8px;">Valor Unit.</th>
        <th style="text-align: right; padding: 8px;">Total</th>
        <th style="text-align: right; padding: 8px;">Ação</th>
      </tr>
    </thead>
    <tbody>`;
    
  extras.forEach((e, idx) => {
    html += `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 8px;">${escapeHtml(e.description)}</td>
        <td style="padding: 8px; text-align: right;">${e.quantity}</td>
        <td style="padding: 8px; text-align: right;">£${Number(e.unitPrice).toFixed(2)}</td>
        <td style="padding: 8px; text-align: right;">£${Number(e.total).toFixed(2)}</td>
        <td style="padding: 8px; text-align: right;">
          <button class="icon-button" onclick="removeFinanceExtra('${type}', ${parentObj.id}, ${idx})" style="color: var(--danger);">Excluir</button>
        </td>
      </tr>
    `;
  });
  html += `</tbody></table>`;
  listEl.innerHTML = html;
}

async function addFinanceExtra() {
  if (!currentFinanceEditType || !currentFinanceEditId) return;
  const desc = document.getElementById('financeExtraDesc').value;
  const qtd = document.getElementById('financeExtraQtd').value;
  const unit = document.getElementById('financeExtraUnit').value;
  const total = document.getElementById('financeExtraTotal').value;
  
  if (!desc || !qtd || !unit) return toast('Preencha todos os campos do extra', 'error');
  
  try {
    document.getElementById('btnFinanceAddExtra').textContent = '...';
    document.getElementById('btnFinanceAddExtra').disabled = true;
    
    const url = currentFinanceEditType === 'invoice' 
      ? `/api/finance/invoices/${currentFinanceEditId}/extras`
      : `/api/finance/payrolls/${currentFinanceEditId}/extras`;
      
    const res = await api(url, {
      method: 'POST',
      body: { description: desc, quantity: qtd, unitPrice: unit, total }
    });
    
    // Atualiza memoria local
    if (currentFinanceEditType === 'invoice') {
      const inv = state.finance.invoices.find(i => i.id === currentFinanceEditId);
      inv.extras = res.extras;
      inv.total_amount = res.newTotal;
      renderFinanceExtras('invoice', inv);
    } else {
      const pay = state.finance.payrolls.find(p => p.id === currentFinanceEditId);
      pay.extras = res.extras;
      pay.total_amount = res.newTotal;
      renderFinanceExtras('payroll', pay);
    }
    
    renderFinanceSummary();
    
    // Limpar campos
    document.getElementById('financeExtraDesc').value = '';
    document.getElementById('financeExtraQtd').value = '1';
    document.getElementById('financeExtraUnit').value = '0.00';
    document.getElementById('financeExtraTotal').value = '0.00';
    toast('Lançamento adicionado', 'success');
  } catch(err) {
    toast('Erro: ' + err.message, 'error');
  } finally {
    document.getElementById('btnFinanceAddExtra').textContent = 'Adicionar';
    document.getElementById('btnFinanceAddExtra').disabled = false;
  }
}

async function removeFinanceExtra(type, parentId, index) {
  if (!confirm('Excluir este lançamento extra?')) return;
  try {
    const url = type === 'invoice' 
      ? `/api/finance/invoices/${parentId}/extras/${index}`
      : `/api/finance/payrolls/${parentId}/extras/${index}`;
      
    const res = await api(url, { method: 'DELETE' });
    
    // Atualiza memoria local
    if (type === 'invoice') {
      const inv = state.finance.invoices.find(i => i.id === parentId);
      inv.extras = res.extras;
      inv.total_amount = res.newTotal;
      renderFinanceExtras('invoice', inv);
    } else {
      const pay = state.finance.payrolls.find(p => p.id === parentId);
      pay.extras = res.extras;
      pay.total_amount = res.newTotal;
      renderFinanceExtras('payroll', pay);
    }
    
    renderFinanceSummary();
    toast('Removido', 'success');
  } catch(err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function fixInvoice(id) {
  if (!confirm('Deseja recalcular todos os serviços desta fatura para corrigir possíveis erros de dízima? Isso forçará o arredondamento dos minutos e re-aplicará as tarifas do flat.')) return;
  try {
    const res = await api('/api/finance/fix-invoice/' + id);
    toast(res.message || 'Invoice corrigido com sucesso', 'success');
    renderFinanceSummary();
    setTimeout(() => openEditInvoiceModal(id), 500);
  } catch(e) {
    toast('Erro ao recalcular: ' + e.message, 'error');
  }
}

function openEditInvoiceModal(id) {
  const invoice = state.finance.invoices.find(i => i.id === id);
  if (!invoice) return;
  document.getElementById('financeEditTitle').textContent = `Editar Fatura #${invoice.invoice_number || id} - ${invoice.client_name}`;
  document.getElementById('financeEditPrintContainer').innerHTML = `
    <button class="ghost-button" style="padding:4px 8px;font-size:0.85rem;margin-right:8px;color:#d97706;border-color:#d97706;" onclick="fixInvoice(${id})">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
      Recalcular Valores
    </button>
    <button class="ghost-button" style="padding:4px 8px;font-size:0.85rem;" onclick="window.open('/print/invoice/${id}', '_blank')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Baixar PDF</button>
  `;
  
  const invNumberContainer = document.getElementById('financeInvoiceNumberContainer');
  if (invNumberContainer) {
    invNumberContainer.style.display = 'flex';
    document.getElementById('financeEditInvoiceNumber').value = invoice.invoice_number || '';
    
    let overrides = {};
    try {
      if (invoice.extras_json) {
        const parsed = JSON.parse(invoice.extras_json);
        if (Array.isArray(parsed)) {
          const overridesItem = parsed.find(item => item.type === '__manualOverrides');
          if (overridesItem) overrides = overridesItem.data || {};
        }
      }
    } catch(e) {}
    
    document.getElementById('financeEditManualWeekdaysHours').value = overrides.manualWeekdaysHours || '';
    document.getElementById('financeEditManualWeekdaysAmount').value = overrides.manualWeekdaysAmount || '';
    document.getElementById('financeEditManualWeekendsHours').value = overrides.manualWeekendsHours || '';
    document.getElementById('financeEditManualWeekendsAmount').value = overrides.manualWeekendsAmount || '';
    
    invNumberContainer.dataset.invoiceId = id;
  }
  
  let html = `<table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
    <thead>
      <tr style="border-bottom: 1px solid var(--border);">
        <th style="text-align: left; padding: 8px;">ID</th>
        <th style="text-align: left; padding: 8px;">Flat / Servico</th>
        <th style="text-align: left; padding: 8px;">Data</th>
        <th style="text-align: right; padding: 8px;">Valor (£)</th>
        <th style="text-align: right; padding: 8px;">Horas</th>
        <th style="text-align: right; padding: 8px;">Ação</th>
      </tr>
    </thead>
    <tbody>`;
    
  (invoice.jobs || []).forEach(j => {
    const hourlyRate = (j.duration_hours && Number(j.duration_hours) > 0) ? (Number(j.client_amount) / Number(j.duration_hours)) : 0;
    html += `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 8px;">${j.id}</td>
        <td style="padding: 8px;">${escapeHtml(j.flat_address || j.flat_id || 'Avulso')}</td>
        <td style="padding: 8px;">${(j.requested_date || j.finished_at || '-').slice(0, 10)}</td>
        <td style="padding: 8px; text-align: right;">
          <input type="number" id="fin_client_amt_${j.id}" value="${Number(j.client_amount || 0).toFixed(2)}" step="0.01" style="width: 100px; padding: 4px;" />
        </td>
        <td style="padding: 8px; text-align: right;">
          <input type="number" id="fin_client_hrs_${j.id}" value="${Number(j.duration_hours || 0).toFixed(2)}" step="0.25" style="width: 80px; padding: 4px;" oninput="document.getElementById('fin_client_amt_${j.id}').value = (this.value * ${hourlyRate}).toFixed(2)" />
        </td>
        <td style="padding: 8px; text-align: right;">
          <button class="button button-primary button-sm" onclick="saveFinanceJob('invoice', ${invoice.id}, ${j.id})">Salvar</button>
        </td>
      </tr>
    `;
  });
  html += `</tbody></table>`;
  document.getElementById('financeEditJobsList').innerHTML = html;
  
  currentFinanceEditType = 'invoice';
  currentFinanceEditId = invoice.id;
  renderFinanceExtras('invoice', invoice);
  
  document.getElementById('financeEditModal').classList.remove('hidden');
}

function openEditPayrollModal(id) {
  const payroll = state.finance.payrolls.find(p => p.id === id);
  if (!payroll) return;
  document.getElementById('financeEditTitle').textContent = `Editar Holerite #${id} - ${payroll.employee_name}`;
  document.getElementById('financeEditPrintContainer').innerHTML = `<button class="ghost-button" style="padding:4px 8px;font-size:0.85rem;" onclick="window.open('/print/payslip/${id}', '_blank')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Baixar PDF</button>`;
  
  const invNumberContainer = document.getElementById('financeInvoiceNumberContainer');
  if (invNumberContainer) invNumberContainer.style.display = 'none';
  
  let html = `<table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
    <thead>
      <tr style="border-bottom: 1px solid var(--border);">
        <th style="text-align: left; padding: 8px;">ID</th>
        <th style="text-align: left; padding: 8px;">Flat / Servico</th>
        <th style="text-align: left; padding: 8px;">Data</th>
        <th style="text-align: right; padding: 8px;">Pagamento (£)</th>
        <th style="text-align: right; padding: 8px;">Horas</th>
        <th style="text-align: right; padding: 8px;">Ação</th>
      </tr>
    </thead>
    <tbody>`;
    
  (payroll.jobs || []).forEach(j => {
    const hourlyRate = (j.duration_hours && Number(j.duration_hours) > 0) ? (Number(j.employee_amount) / Number(j.duration_hours)) : 0;
    html += `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 8px;">${j.id}</td>
        <td style="padding: 8px;">${escapeHtml(j.flat_address || j.flat_id || 'Avulso')}</td>
        <td style="padding: 8px;">${(j.requested_date || j.finished_at || '-').slice(0, 10)}</td>
        <td style="padding: 8px; text-align: right;">
          <input type="number" id="fin_emp_amt_${j.id}" value="${Number(j.employee_amount || 0).toFixed(2)}" step="0.01" style="width: 100px; padding: 4px;" />
        </td>
        <td style="padding: 8px; text-align: right;">
          <input type="number" id="fin_emp_hrs_${j.id}" value="${Number(j.duration_hours || 0).toFixed(2)}" step="0.25" style="width: 80px; padding: 4px;" oninput="document.getElementById('fin_emp_amt_${j.id}').value = (this.value * ${hourlyRate}).toFixed(2)" />
        </td>
        <td style="padding: 8px; text-align: right;">
          <button class="button button-primary button-sm" onclick="saveFinanceJob('payroll', ${payroll.id}, ${j.id})">Salvar</button>
        </td>
      </tr>
    `;
  });
  html += `</tbody></table>`;
  document.getElementById('financeEditJobsList').innerHTML = html;
  
  currentFinanceEditType = 'payroll';
  currentFinanceEditId = payroll.id;
  renderFinanceExtras('payroll', payroll);
  
  document.getElementById('financeEditModal').classList.remove('hidden');
}

async function saveFinanceInvoiceNumber() {
  const container = document.getElementById('financeInvoiceNumberContainer');
  const invoiceId = Number(container.dataset.invoiceId);
  const invoiceNumber = document.getElementById('financeEditInvoiceNumber').value.trim();
  
  const manualWeekdaysHours = document.getElementById('financeEditManualWeekdaysHours')?.value.trim();
  const manualWeekdaysAmount = document.getElementById('financeEditManualWeekdaysAmount')?.value.trim();
  const manualWeekendsHours = document.getElementById('financeEditManualWeekendsHours')?.value.trim();
  const manualWeekendsAmount = document.getElementById('financeEditManualWeekendsAmount')?.value.trim();
  
  if (!invoiceId) return;
  
  try {
    await api(`/api/finance/invoices/${invoiceId}/number`, {
      method: 'PATCH',
      body: { invoiceNumber, manualWeekdaysHours, manualWeekdaysAmount, manualWeekendsHours, manualWeekendsAmount }
    });
    toast('Fatura atualizada com sucesso', 'success');
    
    const inv = state.finance.invoices.find(i => i.id === invoiceId);
    if (inv) inv.invoice_number = invoiceNumber || null;
    
    renderFinanceSummary();
    openEditInvoiceModal(invoiceId);
  } catch(e) {
    toast('Erro: ' + e.message, 'error');
  }
}

async function saveFinanceJob(type, parentId, jobId) {
  try {
    let payload = {};
    if (type === 'invoice') {
      payload.clientAmount = document.getElementById('fin_client_amt_' + jobId).value;
      payload.durationHours = document.getElementById('fin_client_hrs_' + jobId).value;
    } else {
      payload.employeeAmount = document.getElementById('fin_emp_amt_' + jobId).value;
      payload.durationHours = document.getElementById('fin_emp_hrs_' + jobId).value;
    }
    
    const url = type === 'invoice' 
      ? `/api/finance/invoices/${parentId}/jobs/${jobId}`
      : `/api/finance/payrolls/${parentId}/jobs/${jobId}`;
      
    const res = await api(url, { method: 'PATCH', body: payload });
    toast('Lançamento atualizado com sucesso', 'success');
    
    // Atualiza memoria local
    if (type === 'invoice') {
      const inv = state.finance.invoices.find(i => i.id === parentId);
      const j = inv.jobs.find(x => x.id === jobId);
      j.client_amount = payload.clientAmount;
      j.duration_hours = payload.durationHours;
      inv.total_amount = res.newTotal;
    } else {
      const pay = state.finance.payrolls.find(p => p.id === parentId);
      const j = pay.jobs.find(x => x.id === jobId);
      j.employee_amount = payload.employeeAmount;
      j.duration_hours = payload.durationHours;
      pay.total_amount = res.newTotal;
    }
    
    // Recarrega render local (fora do modal)
    renderFinanceSummary();
    
    // Recarrega modal visual
    if (type === 'invoice') openEditInvoiceModal(parentId);
    else openEditPayrollModal(parentId);
    
  } catch (err) {
    toast('Erro ao atualizar: ' + err.message, 'error');
  }
}

// ── FLATS ────────────────────────────────────────────────────────────────────
async function loadFlats() {
  try {
    const data = await api('/api/flats');
    state.flats = data.flats || [];
    if (typeof renderFlats === 'function') renderFlats();
    if (typeof loadClientUsersForFlat === 'function') await loadClientUsersForFlat();
  } catch (err) {
    console.error('loadFlats Error', err);
  }
}

function renderFlats() {
  const clientsList = document.getElementById('flatsClientsList');
  const detailView = document.getElementById('flatsDetailView');
  const detailList = document.getElementById('flatsList');
  
  if (!clientsList || !detailView || !detailList) return;
  
  if (!state.flats || !state.flats.length) {
    clientsList.innerHTML = '<div style="opacity:0.5;padding:24px;">Nenhum flat cadastrado.</div>';
    clientsList.classList.remove('hidden');
    detailView.classList.add('hidden');
    return;
  }
  
  if (state.selectedFlatClientView !== undefined && state.selectedFlatClientView !== null) {
    clientsList.classList.add('hidden');
    detailView.classList.remove('hidden');
    
    const clientId = state.selectedFlatClientView === 'unassigned' ? null : state.selectedFlatClientView;
    const clientFlats = state.flats.filter(f => f.client_user_id === clientId);
    
    const clientNameStr = clientId === null ? 'Flats sem cliente vinculado' : (clientFlats[0] ? clientFlats[0].client_name : 'Flats do cliente');
    document.getElementById('flatsDetailClientName').textContent = clientNameStr;
    
    if (!clientFlats.length) {
      detailList.innerHTML = '<div style="opacity:0.5;padding:24px;">Nenhum flat para este cliente.</div>';
    } else {
      detailList.innerHTML = clientFlats.map(f => {
        const isActive = f.active === 1;
        return `
          <div class="glass-card" style="padding:16px;border-left:4px solid ${isActive ? 'var(--primary)' : 'var(--muted)'};opacity:${isActive ? 1 : 0.6}">
            <div style="font-weight:600;margin-bottom:8px;">${escapeHtml(f.address)}</div>
            ${f.full_address ? `<div style="font-size:0.875rem;color:var(--muted);margin-bottom:4px;">📍 ${escapeHtml(f.full_address)}</div>` : ''}
            ${f.access_code ? `<div style="font-size:0.875rem;color:var(--primary);margin-bottom:8px;">🔑 ${escapeHtml(f.access_code)}</div>` : ''}
            <div style="font-size:0.875rem;color:var(--muted);margin-bottom:12px;">
              Cobrança: ${f.billing_type === 'hourly' ? 'Por hora (£' + f.hourly_rate + ')' : 'Projeto fixo (£' + f.project_rate + ')'}
              ${f.city ? '<br/>Cidade: ' + escapeHtml(f.city) : ''}
            </div>
            <div class="toolbar-actions" style="margin-top:12px;">
              <button class="button button-secondary" onclick='openFlatForm(${JSON.stringify(f).replace(/'/g, "&#39;")})'>Editar</button>
              <button class="button button-danger" style="background:var(--danger);border:none;color:#fff;padding:8px 16px;border-radius:4px;" onclick='deleteFlatById(${f.id})'>Excluir</button>
            </div>
          </div>
        `;
      }).join('');
    }
  } else {
    clientsList.classList.remove('hidden');
    detailView.classList.add('hidden');
    
    const grouped = {};
    const unassigned = [];
    state.flats.forEach(f => {
      if (!f.client_user_id) {
        unassigned.push(f);
      } else {
        if (!grouped[f.client_user_id]) grouped[f.client_user_id] = { name: f.client_name || 'Desconhecido', flats: [] };
        grouped[f.client_user_id].flats.push(f);
      }
    });
    
    let html = '';
    Object.keys(grouped).forEach(clientId => {
      const g = grouped[clientId];
      html += `
        <div class="glass-card" style="padding:16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="state.selectedFlatClientView = ${clientId}; renderFlats();">
          <div>
            <div style="font-weight:600;">${escapeHtml(g.name)}</div>
            <div style="font-size:0.85rem; color:var(--muted);">${g.flats.length} flat(s)</div>
          </div>
          <div style="font-weight:bold; color:var(--primary);">Ver flats &rarr;</div>
        </div>
      `;
    });
    if (unassigned.length > 0) {
      html += `
        <div class="glass-card" style="padding:16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; opacity: 0.8;" onclick="state.selectedFlatClientView = 'unassigned'; renderFlats();">
          <div>
            <div style="font-weight:600;">Sem cliente vinculado</div>
            <div style="font-size:0.85rem; color:var(--muted);">${unassigned.length} flat(s)</div>
          </div>
          <div style="font-weight:bold; color:var(--primary);">Ver flats &rarr;</div>
        </div>
      `;
    }
    clientsList.innerHTML = html;
  }
}

async function loadClientUsersForFlat() {
  try {
    const data = await api('/api/users');
    const clientUsers = (data.users || []).filter(u => u.role === 'client');
    const sel = document.getElementById('flatClientUser');
    if (sel) {
      sel.innerHTML = '<option value="">Sem cliente</option>' + clientUsers.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('');
    }
  } catch (err) {
    console.error('Error loading client users:', err);
  }
}

// ── DASHBOARD LOGIC ──────────────────────────────────────────────────────────

async function loadDashboard() {
  const container = document.getElementById('dashboardStats');
  if (container) container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);width:100%;">Carregando dashboard...</div>';
  try {
    const data = await api('/api/dashboard/stats');
    state.dashboardJobs = data.jobs || [];
    renderDashboard();
  } catch (err) {
    console.error(err);
    toast('Falha ao carregar dados do dashboard.', 'error');
  }
}

function renderDashboard() {
  if (!state.dashboardJobs) return;
  const jobs = state.dashboardJobs;

  const clientFilter = document.getElementById('dashboardClientFilter')?.value || 'all';
  const dateFrom = document.getElementById('dashboardDateFrom')?.value;
  const dateTo = document.getElementById('dashboardDateTo')?.value;

  let filteredJobs = jobs;
  if (clientFilter !== 'all') {
    filteredJobs = jobs.filter(j => j.client_user_id == clientFilter);
  }
  if (dateFrom) {
    filteredJobs = filteredJobs.filter(j => (j.finished_at || j.requested_date || '').slice(0, 10) >= dateFrom);
  }
  if (dateTo) {
    filteredJobs = filteredJobs.filter(j => (j.finished_at || j.requested_date || '').slice(0, 10) <= dateTo);
  }

  // Stats
  let totalRevenue = 0;
  let totalCost = 0;
  
  // Breakdowns
  const clientData = {};
  const cleanerData = {};
  const trendData = {};

  let minDate = '9999-99-99';
  let maxDate = '0000-00-00';
  filteredJobs.forEach(j => {
    const d = (j.finished_at || j.requested_date || '').substring(0, 10);
    if (d && d.length === 10) {
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    }
  });
  let trendType = 'monthly';
  const trendSelect = document.getElementById('dashboardTrendType');
  if (trendSelect) trendType = trendSelect.value;

  filteredJobs.forEach(j => {
    const revenue = j.client_amount || 0;
    const cost = j.employee_amount || 0;
    const profit = revenue - cost;

    totalRevenue += revenue;
    totalCost += cost;

    // Client Breakdown
    if (j.client_user_id) {
      if (!clientData[j.client_user_id]) clientData[j.client_user_id] = { name: j.client_name || 'Desconhecido', revenue: 0, cost: 0 };
      clientData[j.client_user_id].revenue += revenue;
      clientData[j.client_user_id].cost += cost;
    }

    // Cleaner Breakdown
    if (j.employee_user_id) {
      if (!cleanerData[j.employee_user_id]) cleanerData[j.employee_user_id] = { name: j.employee_name || 'Desconhecido', cost: 0 };
      cleanerData[j.employee_user_id].cost += cost;
    }

    // Trend
    const d = j.finished_at || j.requested_date;
    if (d) {
      let periodKey;
      if (trendType === 'daily') periodKey = d.substring(0, 10);
      else if (trendType === 'yearly') periodKey = d.substring(0, 4);
      else periodKey = d.substring(0, 7); // monthly (default)
      
      if (!trendData[periodKey]) trendData[periodKey] = { revenue: 0, cost: 0 };
      trendData[periodKey].revenue += revenue;
      trendData[periodKey].cost += cost;
    }
  });

  const totalProfit = totalRevenue - totalCost;

  const statsEl = document.getElementById('dashboardStats');
  if (statsEl) {
    const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';
    statsEl.innerHTML = `
      <div class="dash-stat-card">
        <div class="dash-stat-header">
          <div class="dash-stat-icon"><i data-lucide="bar-chart-3"></i></div>
          <div>
            <div class="dash-stat-title">Faturamento Bruto</div>
            <div class="dash-stat-value">${formatCurrencyGBP(totalRevenue)}</div>
          </div>
        </div>
        <div class="trend-up"><i data-lucide="trending-up"></i> +12.4%</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-header">
          <div class="dash-stat-icon"><i data-lucide="users"></i></div>
          <div>
            <div class="dash-stat-title">Gastos com Equipe</div>
            <div class="dash-stat-value">${formatCurrencyGBP(totalCost)}</div>
          </div>
        </div>
        <div class="trend-up"><i data-lucide="trending-up"></i> +8.2%</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-header">
          <div class="dash-stat-icon"><i data-lucide="wallet"></i></div>
          <div>
            <div class="dash-stat-title">Lucro Bruto</div>
            <div class="dash-stat-value">${formatCurrencyGBP(totalProfit)}</div>
          </div>
        </div>
        <div class="trend-up"><i data-lucide="trending-up"></i> +18.7%</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-header">
          <div class="dash-stat-icon"><i data-lucide="pie-chart"></i></div>
          <div>
            <div class="dash-stat-title">Margem</div>
            <div class="dash-stat-value">${margin}%</div>
          </div>
        </div>
        <div class="trend-up"><i data-lucide="trending-up"></i> +2.1%</div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: statsEl });
  }

  const clientListEl = document.getElementById('dashboardClientBreakdown');
  if (clientListEl) {
    const clientsArr = Object.values(clientData).sort((a,b) => b.revenue - a.revenue);
    clientListEl.innerHTML = clientsArr.map(c => `
      <div class="client-summary-item">
        <div class="client-summary-left">
          <div class="client-icon-box"><i data-lucide="building"></i></div>
          <div class="client-name">${escapeHtml(c.name)}</div>
        </div>
        <div class="client-summary-right">
          ${formatCurrencyGBP(c.revenue)} <i data-lucide="chevron-right"></i>
        </div>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons({ root: clientListEl });
    if (!clientListEl.innerHTML) clientListEl.innerHTML = '<div class="stack-item" style="text-align:center;">Sem dados de clientes no periodo.</div>';
  }

  const cleanerListEl = document.getElementById('dashboardCleanerBreakdown');
  if (cleanerListEl) {
    const cleanersArr = Object.values(cleanerData).sort((a,b) => b.cost - a.cost);
    cleanerListEl.innerHTML = cleanersArr.map(c => `
      <div class="stack-item" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--surface-alt);display:flex;align-items:center;justify-content:center;color:var(--primary);"><i data-lucide="briefcase"></i></div>
          <strong style="display:block;">${escapeHtml(c.name)}</strong>
        </div>
        <div style="font-weight:600;">${formatCurrencyGBP(c.cost)}</div>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons({ root: cleanerListEl });
    if (!cleanerListEl.innerHTML) cleanerListEl.innerHTML = '<div class="stack-item" style="text-align:center;">Sem dados de cleaners no periodo.</div>';
  }

  const trendListEl = document.getElementById('dashboardTrendBreakdown');
  if (trendListEl) {
    const monthsArr = Object.keys(trendData).sort().reverse();
    trendListEl.innerHTML = monthsArr.map(m => {
      const d = trendData[m];
      const p = d.revenue - d.cost;
      const margin = d.revenue > 0 ? Math.round((p / d.revenue) * 100) : 0;
      return `
      <div class="stack-item" style="display:flex; justify-content:space-between; align-items:center;">
        <strong>${escapeHtml(m)}</strong>
        <div style="text-align:right;">
          <div>Receita: ${formatCurrencyGBP(d.revenue)} | Margem: ${margin}%</div>
          <small style="color:${p >= 0 ? 'var(--primary)' : 'var(--danger)'}">Lucro: ${formatCurrencyGBP(p)}</small>
        </div>
      </div>
      `;
    }).join('') || '<div class="stack-item">Sem dados consolidados no periodo.</div>';
  }

  // Draw Chart
  const ctx = document.getElementById('dashboardTrendChart');
  if (ctx && window.Chart) {
    if (window.dashboardChartInstance) {
      window.dashboardChartInstance.destroy();
    }
    
    const monthsArrAsc = Object.keys(trendData).sort(); // chronological for chart
    const labels = monthsArrAsc.map(d => {
      if (d.length === 10) return d.split('-').reverse().join('/'); // daily: DD/MM/YYYY
      if (d.length === 7) return d.split('-').reverse().join('/');  // monthly: MM/YYYY
      return d; // yearly: YYYY
    });
    const revenueData = monthsArrAsc.map(m => trendData[m].revenue);
    const costData = monthsArrAsc.map(m => trendData[m].cost);
    const profitData = monthsArrAsc.map(m => trendData[m].revenue - trendData[m].cost);
    
    window.dashboardChartInstance = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Lucro',
            data: profitData,
            type: 'line',
            borderColor: '#10b981', // Green
            backgroundColor: '#10b981',
            borderWidth: 3,
            tension: 0.3,
            pointBackgroundColor: '#10b981',
            pointRadius: 5,
            yAxisID: 'y'
          },
          {
            label: 'Faturamento',
            data: revenueData,
            backgroundColor: '#f97316', // Orange
            borderColor: '#f97316',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Despesas (Equipe)',
            data: costData,
            backgroundColor: '#f87171', // Light red
            borderColor: '#f87171',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { callback: function(value) { return '£' + value; } } }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }

  // Populate Filter
  const filterEl = document.getElementById('dashboardClientFilter');
  if (filterEl && state.users) {
    const currentVal = filterEl.value || 'all';
    const allClients = state.users.filter(u => u.role === 'client').sort((a,b) => a.name.localeCompare(b.name));
    
    const usersHash = allClients.map(c => c.id).join(',');
    
    // Only rebuild if the clients list has actually changed
    if (filterEl.dataset.usersHash !== usersHash) {
      filterEl.innerHTML = '<option value="all">Visão Geral da Operação</option>' + allClients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
      filterEl.value = currentVal;
      filterEl.dataset.usersHash = usersHash;
    }
    
    // attach event
    if (!filterEl.dataset.bound) {
      filterEl.addEventListener('change', renderDashboard);
      filterEl.dataset.bound = 'true';
    }
  }

  const presetEl = document.getElementById('dashboardDatePreset');
  if (presetEl && !presetEl.dataset.bound) {
    presetEl.addEventListener('change', (e) => {
      const fromEl = document.getElementById('dashboardDateFrom');
      const toEl   = document.getElementById('dashboardDateTo');
      const val = e.target.value;
      
      const now = new Date();
      if (val === 'this_month') {
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        if (fromEl) fromEl.value = `${y}-${m}-01`;
        if (toEl) {
          const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
          toEl.value = `${y}-${m}-${lastDay}`;
        }
      } else if (val === 'last_month') {
        const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const m = now.getMonth() === 0 ? 12 : now.getMonth();
        const strM = String(m).padStart(2, '0');
        if (fromEl) fromEl.value = `${y}-${strM}-01`;
        if (toEl) {
          const lastDay = new Date(y, m, 0).getDate();
          toEl.value = `${y}-${strM}-${lastDay}`;
        }
      } else if (val === 'this_year') {
        const y = now.getFullYear();
        if (fromEl) fromEl.value = `${y}-01-01`;
        if (toEl) toEl.value = `${y}-12-31`;
      } else if (val === 'all') {
        if (fromEl) fromEl.value = '';
        if (toEl) toEl.value = '';
      }
      renderDashboard();
    });
    presetEl.dataset.bound = 'true';
    
    // Set initial value to 'this_month' on load if empty
    if (!document.getElementById('dashboardDateFrom').value) {
      presetEl.value = 'this_month';
      presetEl.dispatchEvent(new Event('change'));
    }
  }

  // Fallback for direct changes to from/to inputs if they are revealed
  const dateFromEl = document.getElementById('dashboardDateFrom');
  if (dateFromEl && !dateFromEl.dataset.bound) {
    dateFromEl.addEventListener('change', renderDashboard);
    dateFromEl.dataset.bound = 'true';
  }

  const dateToEl = document.getElementById('dashboardDateTo');
  if (dateToEl && !dateToEl.dataset.bound) {
    dateToEl.addEventListener('change', renderDashboard);
    dateToEl.dataset.bound = 'true';
  }
}

// Remove old functions filterDashboardToday and clearDashboardDateFilter if they were here


// ── MANUAL JOB ───────────────────────────────────────────

async function openManualJobForFinance() {
  try {
    const isInvoice = currentFinanceEditType === 'invoice';
    let targetInvoice = null;
    let targetPayroll = null;
    
    if (isInvoice) {
      targetInvoice = state.finance.invoices.find(i => i.id === currentFinanceEditId);
      if (!targetInvoice) throw new Error("targetInvoice não encontrado");
    } else {
      targetPayroll = state.finance.payrolls.find(p => p.id === currentFinanceEditId);
      if (!targetPayroll) throw new Error("targetPayroll não encontrado");
    }
    
    // Assegura que flats e users foram carregados
    if (!state.flats || state.flats.length === 0) {
      toast("Carregando Flats...");
      if (typeof loadFlats === 'function') await loadFlats();
    }
    if (!state.users || state.users.length === 0) {
      if (typeof loadUsers === 'function') await loadUsers();
    }
    
    document.getElementById('manualJobEmployeeField').classList.toggle('hidden', !isInvoice);
    
    // Populate Flat dropdown
    const flatSel = document.getElementById('manualJobFlat');
    if (!flatSel) throw new Error("Select de Flat não encontrado no HTML");

    if (isInvoice) {
      const clientId = targetInvoice.client_user_id;
      const clientFlats = (state.flats || []).filter(f => f.client_user_id === clientId);
      flatSel.innerHTML = clientFlats.map(f => `<option value="${f.id}">${escapeHtml(f.address)}</option>`).join('') || '<option value="">Nenhum flat deste cliente</option>';
    } else {
      // all flats with client names
      flatSel.innerHTML = '<option value="">Selecione o Flat</option>' + (state.flats || []).map(f => {
         const clientName = f.client_name || 'Desconhecido';
         return `<option value="${f.id}">${escapeHtml(f.address)} (${escapeHtml(clientName)})</option>`;
      }).join('');
    }

    // Populate Employee dropdown
    if (isInvoice) {
      const empSel = document.getElementById('manualJobEmployee');
      if (!empSel) throw new Error("Select de Employee não encontrado no HTML");
      const employees = (state.users || []).filter(u => ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(u.role));
      empSel.innerHTML = employees.map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('') || '<option value="">Nenhum funcionário</option>';
    }

    document.getElementById('manualJobDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('manualJobHours').value = '';
    document.getElementById('manualJobHoliday').checked = false;

    document.getElementById('manualJobModal').classList.remove('hidden');
  } catch(e) {
    console.error(e);
    toast('Erro: ' + e.message, 'error');
  }
}

function closeManualJobModal() {
  document.getElementById('manualJobModal').classList.add('hidden');
}

// --- Admin Request Job (CleanOps) ---
async function openAdminRequestJobModal() {
  if (!state.flats || state.flats.length === 0) {
    if (typeof loadFlats === 'function') await loadFlats();
  }
  
  const modal = document.getElementById('adminRequestJobModal');
  const clientSelect = document.getElementById('adminReqJobClient');
  const employeeSelect = document.getElementById('adminReqJobEmployee');
  
  // Load Clients
  const clients = state.users.filter(u => u.role === 'client');
  clientSelect.innerHTML = `<option value="">Selecione um cliente</option>` + clients.map(c => `<option value="${c.id}">${escapeHtml(c.name || c.email)}</option>`).join('');
  
  // Load Employees
  const employees = state.users.filter(u => ['employee', 'admin', 'superadmin', 'manager', 'analyst'].includes(u.role));
  employeeSelect.innerHTML = `<option value="">Deixar pendente (Sem funcionario)</option>` + employees.map(e => `<option value="${e.id}">${escapeHtml(e.name || e.email)}</option>`).join('');
  
  document.getElementById('adminReqJobFlat').innerHTML = '<option value="">Selecione um cliente primeiro</option>';
  document.getElementById('adminReqJobDate').value = '';
  document.getElementById('adminReqJobNotes').value = '';
  document.getElementById('adminReqJobIsHoliday').checked = false;
  
  modal.classList.remove('hidden');
}

function closeAdminRequestJobModal() {
  document.getElementById('adminRequestJobModal').classList.add('hidden');
}

function updateAdminReqJobFlats() {
  const clientId = Number(document.getElementById('adminReqJobClient').value);
  const flatSelect = document.getElementById('adminReqJobFlat');
  if (!clientId) {
    flatSelect.innerHTML = '<option value="">Selecione um cliente primeiro</option>';
    return;
  }
  const clientFlats = state.flats.filter(f => f.client_user_id === clientId && f.active);
  if (clientFlats.length === 0) {
    flatSelect.innerHTML = '<option value="">Nenhum flat ativo encontrado</option>';
    return;
  }
  flatSelect.innerHTML = clientFlats.map(f => `<option value="${f.id}">${escapeHtml(f.address)}</option>`).join('');
}

async function submitAdminRequestJob(e) {
  e.preventDefault();
  const btn = document.getElementById('adminReqJobSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  
  try {
    const payload = {
      clientId: document.getElementById('adminReqJobClient').value,
      flatId: document.getElementById('adminReqJobFlat').value,
      requestedDate: document.getElementById('adminReqJobDate').value,
      employeeUserId: document.getElementById('adminReqJobEmployee').value || null,
      notes: document.getElementById('adminReqJobNotes').value,
      isHoliday: document.getElementById('adminReqJobIsHoliday').checked
    };
    
    await api('/api/jobs', { method: 'POST', body: payload });
    toast('Servico solicitado com sucesso!', 'success');
    closeAdminRequestJobModal();
    if (typeof loadJobs === 'function') loadJobs();
  } catch (err) {
    toast(err.message || 'Erro ao criar solicitacao', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar Solicitacao';
  }
}

async function submitManualJob(e) {
  e.preventDefault();
  
  const isInvoice = currentFinanceEditType === 'invoice';
  let targetPayroll = null;
  
  if (!isInvoice) {
    targetPayroll = state.finance.payrolls.find(p => p.id === currentFinanceEditId);
  }
  
  let flatId = document.getElementById('manualJobFlat').value;
  let employeeUserId = isInvoice ? document.getElementById('manualJobEmployee').value : targetPayroll.employee_user_id;
  let date = document.getElementById('manualJobDate').value;
  let timeStr = document.getElementById('manualJobHours').value;
  let isHoliday = document.getElementById('manualJobHoliday').checked;
  
  if (!flatId || !employeeUserId || !date || !timeStr) return toast('Preencha os campos obrigatorios');
  
  let [hh, mm] = timeStr.split(':').map(Number);
  let hours = hh + (mm / 60);
  
  document.getElementById('manualJobSubmit').disabled = true;
  document.getElementById('manualJobSubmit').textContent = 'Processando...';

  try {
    const payload = {
      flatId,
      employeeUserId,
      requestedDate: date,
      durationHours: hours,
      isHoliday,
      invoiceId: isInvoice ? currentFinanceEditId : null,
      payrollId: !isInvoice ? currentFinanceEditId : null
    };

    const res = await api('/api/jobs/manual', { method: 'POST', body: payload });
    toast('Servico manual criado com sucesso!', 'success');
    closeManualJobModal();
    
    // Recarregar tudo
    await loadFinance();
    if (isInvoice) {
      openEditInvoiceModal(currentFinanceEditId);
    } else {
      openEditPayrollModal(currentFinanceEditId);
    }
  } catch (err) {
    toast('Erro: ' + (err.message || ''), 'error');
  } finally {
    document.getElementById('manualJobSubmit').disabled = false;
    document.getElementById('manualJobSubmit').textContent = 'Criar e Anexar Servico';
  }
}

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────
function openChangePasswordModal() {
  document.getElementById('changePasswordForm').reset();
  document.getElementById('changePasswordModal').classList.remove('hidden');
}
function closeChangePasswordModal() {
  document.getElementById('changePasswordModal').classList.add('hidden');
}
async function submitChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('cpCurrent').value;
  const newPassword = document.getElementById('cpNew').value;
  const confirmPassword = document.getElementById('cpConfirm').value;
  
  if (newPassword !== confirmPassword) return toast('A nova senha e a confirmacao nao coincidem', 'error');
  if (newPassword.length < 6) return toast('A nova senha deve ter no minimo 6 caracteres', 'error');
  
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
    
    toast('Senha alterada com sucesso!', 'success');
    closeChangePasswordModal();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Senha';
  }
}

function toggleAllPayrollClients(cb) {
  document.querySelectorAll('.payroll-client-cb').forEach(el => el.checked = cb.checked);
}

// ── VOICE ASSISTANT (WEB SPEECH API) ───────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// 1. Ditar observações
let dictationRecognition = null;
function startDictationForNotes() {
  if (!SpeechRecognition) return toast('Seu navegador não suporta reconhecimento de voz.', 'error');
  if (dictationRecognition) {
    dictationRecognition.stop();
    return;
  }
  const btn = document.getElementById('btnDictateNotes');
  const originalText = btn.innerHTML;
  btn.innerHTML = '🔴 Ouvindo...';
  btn.style.color = 'red';
  
  dictationRecognition = new SpeechRecognition();
  dictationRecognition.lang = 'pt-BR';
  dictationRecognition.interimResults = false;
  
  dictationRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const notesEl = document.getElementById('adminReqJobNotes');
    notesEl.value = notesEl.value ? notesEl.value + ' ' + transcript : transcript;
    toast('Texto capturado com sucesso!', 'success');
  };
  
  dictationRecognition.onerror = (e) => {
    if (e.error !== 'aborted') toast('Erro na gravação: ' + e.error, 'error');
  };
  
  dictationRecognition.onend = () => {
    btn.innerHTML = originalText;
    btn.style.color = '#333';
    dictationRecognition = null;
  };
  
  dictationRecognition.start();
}
window.startDictationForNotes = startDictationForNotes;

// 2. Assistente Inteligente (Auto-Fill)
let smartRecognition = null;
function startSmartVoiceAssistant() {
  if (!SpeechRecognition) return toast('Seu navegador não suporta reconhecimento de voz.', 'error');
  if (smartRecognition) return;
  
  const modal = document.getElementById('voiceAssistantModal');
  const statusEl = document.getElementById('voiceAssistantStatus');
  const transcriptEl = document.getElementById('voiceAssistantTranscript');
  const rippleEl = document.getElementById('voiceAssistantRipple');

  if (!modal) return toast('Modal de voz não encontrado. Recarregue a página.', 'error');

  modal.classList.remove('hidden');
  if (statusEl) statusEl.textContent = 'Ouvindo... Pode falar!';
  if (transcriptEl) transcriptEl.innerHTML = 'Diga algo como:<br><em style="color:var(--primary)">"Nova limpeza amanhã no flat 102 para a Maria"</em>';
  if (rippleEl) rippleEl.style.animation = 'pulseVoice 1.5s infinite';

  smartRecognition = new SpeechRecognition();
  smartRecognition.lang = 'pt-BR';
  smartRecognition.interimResults = true;
  
  let finalTranscript = '';
  
  smartRecognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    transcriptEl.innerHTML = `<strong>${finalTranscript || interimTranscript}</strong>`;
  };
  
  smartRecognition.onerror = (e) => {
    if (e.error !== 'aborted') {
      statusEl.textContent = 'Erro: ' + e.error;
      setTimeout(stopVoiceAssistant, 2000);
    }
  };
  
  smartRecognition.onend = () => {
    rippleEl.style.animation = 'none';
    if (!finalTranscript) {
      statusEl.textContent = 'Não entendi. Cancelando...';
      setTimeout(stopVoiceAssistant, 1500);
      return;
    }
    statusEl.textContent = 'Processando...';
    processSmartVoiceCommand(finalTranscript);
  };
  
  smartRecognition.start();
}
window.startSmartVoiceAssistant = startSmartVoiceAssistant;

function stopVoiceAssistant() {
  if (smartRecognition) {
    smartRecognition.stop();
    smartRecognition = null;
  }
  const modal = document.getElementById('voiceAssistantModal');
  if (modal) modal.classList.add('hidden');
}
window.stopVoiceAssistant = stopVoiceAssistant;

// Helper de distancia (Fuzzy Match) para erros fonéticos da API de Voz
function levenshtein(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b.charAt(i-1) === a.charAt(j-1) 
        ? m[i-1][j-1] 
        : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
    }
  }
  return m[b.length][a.length];
}

function processSmartVoiceCommand(text) {
  const originalText = text;
  // Remove acentos e joga pra minúsculo
  const lowerText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const spokenWords = lowerText.replace(/[^a-z0-9\s]/g, '').split(' ').filter(p => p.length > 2);
  const today = new Date();
  let requestedDate = '';
  
  // 1. Date Parsing
  if (lowerText.includes('hoje')) {
    requestedDate = today.toISOString().split('T')[0];
  } else if (lowerText.includes('depois de amanha')) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + 2);
    requestedDate = dt.toISOString().split('T')[0];
  } else if (lowerText.includes('amanha')) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + 1);
    requestedDate = dt.toISOString().split('T')[0];
  } else {
    // Check for "dia X"
    const matchDia = lowerText.match(/dia (\d{1,2})/);
    if (matchDia) {
      let d = parseInt(matchDia[1]);
      let m = today.getMonth();
      let y = today.getFullYear();
      
      const matchMes = lowerText.match(/dia \d{1,2} d[eo] (\w+)/);
      if (matchMes) {
        const meses = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        let idx = meses.indexOf(matchMes[1]);
        if (idx !== -1) m = idx;
      } else {
        // Se não falou o mês, mas o dia é menor que o atual, assume mês que vem
        if (d < today.getDate()) {
          m++;
          if (m > 11) { m = 0; y++; }
        }
      }
      
      const dObj = new Date(y, m, d);
      // Se a data já passou, joga pro ano que vem
      if (dObj < today && matchMes) {
        dObj.setFullYear(y + 1);
      }
      requestedDate = dObj.toISOString().split('T')[0];
    } else {
      // Check for days of the week (proxima segunda, etc)
      const weekDays = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      let foundDay = -1;
      for (let i = 0; i < weekDays.length; i++) {
        if (lowerText.match(new RegExp('\\b' + weekDays[i] + '\\b'))) {
          foundDay = i;
          break;
        }
      }
      if (foundDay !== -1) {
        let dt = new Date(today);
        dt.setDate(dt.getDate() + 1);
        while (dt.getDay() !== foundDay) {
          dt.setDate(dt.getDate() + 1);
        }
        if (lowerText.includes('proxima')) {
           const diff = Math.ceil((dt - today) / (1000 * 60 * 60 * 24));
           if (diff < 7) dt.setDate(dt.getDate() + 7);
        }
        requestedDate = dt.toISOString().split('T')[0];
      }
    }
  }
  
  // 2. Employee Parsing
  let foundEmployeeId = '';
  let foundEmployeeName = '';
  const employees = state.users.filter(u => u.role === 'employee' && u.active);
  for (const emp of employees) {
    const empNameNorm = emp.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const first = empNameNorm.split(' ')[0];
    
    if (lowerText.match(new RegExp('\\b' + first + '\\b')) || lowerText.includes(empNameNorm)) {
      foundEmployeeId = emp.id;
      foundEmployeeName = emp.name;
      break;
    } else {
      let bestDist = 99;
      for (const sw of spokenWords) {
          const d = levenshtein(first, sw);
          if (d < bestDist) bestDist = d;
      }
      // Fuzzy match tolerance
      if (bestDist <= (first.length > 5 ? 2 : 1)) {
          foundEmployeeId = emp.id;
          foundEmployeeName = emp.name;
          break;
      }
    }
  }
  
  // 3. Flat & Client Parsing (Fuzzy Scoring System)
  let bestFlatMatch = null;
  let bestFlatScore = 0;
  
  for (const flat of state.flats) {
    if (!flat.active) continue;
    
    let score = 0;
    const addrLow = flat.address.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Verifica número do flat exato
    const matchNum = addrLow.match(/\b(\d+)\b/);
    if (matchNum && lowerText.match(new RegExp('\\b' + matchNum[1] + '\\b'))) {
      score += 5;
    }
    
    // Verifica palavras longas do endereço (rua, prédio)
    const words = addrLow.replace(/[^a-z0-9\s]/g, '').split(' ').filter(p => isNaN(parseInt(p)) && p.length > 3);
    for (const w of words) {
      if (lowerText.includes(w)) {
        score += 2; // Exato match
      } else {
        let bestDist = 99;
        for (const sw of spokenWords) {
            const d = levenshtein(w, sw);
            if (d < bestDist) bestDist = d;
        }
        if (bestDist <= (w.length > 5 ? 2 : 1)) {
            score += 1.5; // Fuzzy match
        }
      }
    }
    
    // Verifica se falou o nome do cliente associado ao flat
    const client = state.users.find(u => u.id === flat.client_user_id);
    if (client) {
        const clientFirst = client.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ')[0];
        if (lowerText.match(new RegExp('\\b' + clientFirst + '\\b'))) {
            score += 3; // Exato match
        } else {
            let bestDist = 99;
            for (const sw of spokenWords) {
                const d = levenshtein(clientFirst, sw);
                if (d < bestDist) bestDist = d;
            }
            if (bestDist <= (clientFirst.length > 5 ? 2 : 1)) {
                score += 2; // Fuzzy match
            }
        }
    }
    
    if (score > bestFlatScore) {
      bestFlatScore = score;
      bestFlatMatch = flat;
    }
  }
  
  let foundFlatId = '';
  let foundClientId = '';
  let foundFlatName = '';
  
  // Exige um score mínimo de 2 para não dar falso positivo
  if (bestFlatMatch && bestFlatScore >= 2) {
      foundFlatId = bestFlatMatch.id;
      foundClientId = bestFlatMatch.client_user_id;
      foundFlatName = bestFlatMatch.address;
  }
  
  stopVoiceAssistant();
  openAdminRequestJobModal();
  
  setTimeout(() => {
    // Client & Flat
    if (foundClientId) {
      const clientEl = document.getElementById('adminReqJobClient');
      if (clientEl) {
          clientEl.value = foundClientId;
          updateAdminReqJobFlats();
          setTimeout(() => {
            const flatEl = document.getElementById('adminReqJobFlat');
            if (foundFlatId && flatEl) {
                flatEl.value = foundFlatId;
            }
          }, 150);
      }
    }
    
    // Date
    if (requestedDate) {
        const dateEl = document.getElementById('adminReqJobDate');
        if (dateEl) dateEl.value = requestedDate;
    }
    
    // Employee
    if (foundEmployeeId) {
        const empEl = document.getElementById('adminReqJobEmployee');
        if (empEl) empEl.value = foundEmployeeId;
    }
    
    // Notes
    const notesEl = document.getElementById('adminReqJobNotes');
    if (notesEl) {
        notesEl.value = `[Voz] ${originalText}`;
    }
    
    // Feedback
    let msg = 'Comando interpretado!\n';
    if (foundFlatName) msg += `📍 Flat: ${foundFlatName}\n`;
    if (requestedDate) msg += `📅 Data: ${requestedDate}\n`;
    if (foundEmployeeName) msg += `🧹 Func: ${foundEmployeeName}\n`;
    msg += `(Ouvido: "${originalText}")`;
    toast(msg, 'success');
  }, 350);
}

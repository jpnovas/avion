// js/app.js - inicialización y navegación entre vistas
// Listeners: se adjuntan una sola vez al DOMContentLoaded

var store = new Store();
var currentView = 'dashboard';

function showView(viewName) {
  document.querySelectorAll('.view-section').forEach(function(s) { s.classList.add('hidden'); });
  var view = document.getElementById('view-' + viewName);
  if (view) view.classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active-nav'); });
  var activeLink = document.querySelector('.nav-link[data-view="' + viewName + '"]');
  if (activeLink) activeLink.classList.add('active-nav');

  currentView = viewName;
  if (viewName === 'clients') initClientsView(store);
  else if (viewName === 'jobs') initJobsView(store);
  else if (viewName === 'account') initAccountView(store);
  else renderDashboard();
}

function renderDashboard() {
  var data = store.getData();
  var jobs = data.jobs || [];
  var payments = data.payments || [];
  var clients = data.clients || [];
  var totalDebito = sumJobs(jobs);
  var totalCredito = sumPayments(payments);

  setText('stat-clients', clients.length);
  setText('stat-jobs', jobs.length);
  setText('stat-billed', formatCurrency(totalDebito));
  setText('stat-saldo', formatCurrency(totalDebito - totalCredito));

  renderDashboardRecentJobs(jobs);
}

function renderDashboardRecentJobs(jobs) {
  var wrap = document.getElementById('dashboard-recent-jobs');
  if (!wrap) return;
  var sorted = jobs.slice().sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).slice(0, 5);
  var columns = [
    { key: 'date', label: 'Fecha', render: function(r) { return formatDate(r.date); } },
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto', render: function(r) { return formatCurrency(r.amount); } }
  ];
  var actions = [{ label: 'Ver', icon: 'fa-eye', tone: '' }];
  wrap.innerHTML = renderTable(sorted, columns, actions);
}

function sumJobs(jobs) {
  return jobs.reduce(function(s, j) { return s + (parseFloat(j.amount) || 0); }, 0);
}

function sumPayments(payments) {
  return payments.reduce(function(s, p) { return s + (parseFloat(p.amount) || 0); }, 0);
}

function clientName(store, clientId) {
  var c = store.getClients().find(function(cl) { return String(cl.id) === String(clientId); });
  return c ? c.name : 'Cliente eliminado';
}

function openJobDetail(store, jobId) {
  var job = store.getJobs().find(function(j) { return String(j.id) === String(jobId); });
  if (!job) return;
  setText('job-detail-id', String(job.id));
  setText('job-detail-client', clientName(store, job.clientId));
  setText('job-detail-date', formatDate(job.date));
  setText('job-detail-desc', job.description || '—');
  setText('job-detail-amount', formatCurrency(job.amount));
  setText('job-detail-location', job.location || '—');

  var statusEl = document.getElementById('job-detail-status');
  statusEl.className = 'badge ' + (job.status === 'pagado' ? 'badge-pagado' : 'badge-pendiente');
  statusEl.textContent = job.status === 'pagado' ? 'Pagado' : 'Pendiente';

  renderJobDetailMap(job.mapLink);

  var markBtn = document.getElementById('job-detail-mark-paid');
  markBtn.dataset.id = job.id;
  markBtn.disabled = job.status === 'pagado';
  if (job.status === 'pagado') {
    markBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Ya Pagado';
  } else {
    markBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Marcar como Pagado';
  }
  openModal('modal-job');
}

function renderJobDetailMap(mapLink) {
  var wrap = document.getElementById('job-detail-map-wrap');
  var iframe = document.getElementById('job-detail-map');
  var link = document.getElementById('job-detail-map-link');
  if (mapLink) {
    iframe.src = mapLink.indexOf('google.com/maps/embed') !== -1
      ? mapLink
      : 'https://www.google.com/maps/embed?q=' + encodeURIComponent(mapLink);
    link.href = mapLink;
    link.classList.remove('hidden');
    wrap.classList.remove('hidden');
  } else {
    iframe.src = '';
    link.classList.add('hidden');
    wrap.classList.add('hidden');
  }
}

function handleRoute() {
  var hash = window.location.hash.slice(2) || 'dashboard';
  showView(hash);
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

window.addEventListener('hashchange', handleRoute);

window.addEventListener('DOMContentLoaded', function() {
  var yr = document.getElementById('footer-year');
  if (yr) yr.textContent = new Date().getFullYear();

  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.hash = '/' + this.dataset.view;
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(function(btn) {
    btn.addEventListener('click', function() { closeModal(btn.dataset.closeModal); });
  });

  // Adjuntar listeners una sola vez — initJobsView, initClientsView, initAccountView
  // usan guard interno para no duplicar.
  initClientsView(store);
  initJobsView(store);
  initAccountView(store);

  // Delegación para abrir detalle desde dashboard y tablas
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action="Ver"]');
    if (!btn) return;
    var rowId = btn.dataset.id;
    if (!rowId) return;
    openJobDetail(store, rowId);
  });

  const markPaid = document.getElementById('job-detail-mark-paid');
  if (markPaid) {
    markPaid.addEventListener('click', function() {
      var id = this.dataset.id;
      var job = store.getJobs().find(function(j) { return String(j.id) === String(id); });
      if (!job) return;
      store.updateJob(Object.assign({}, job, { status: 'pagado' }));
      toast('Trabajo marcado como pagado', 'success');
      closeModal('modal-job');
    });
  }

  handleRoute();
  // Refrescar dashboard en vivo cuando cambian los datos
  store.subscribe(function() { if (currentView === 'dashboard') renderDashboard(); });
});

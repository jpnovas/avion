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
  else if (viewName === 'kanban') initKanbanView(store);
  else renderDashboard();
}

function renderDashboard() {
  var data = store.getData();
  var jobs = data.jobs || [];
  var payments = data.payments || [];
  var clients = data.clients || [];
  var totalDebito = sumJobs(jobs);
  var totalCredito = sumPayments(payments);
  var jobsPagados = jobs.filter(function(j) { return j.status === 'pagado'; }).length;
  var jobsPendientes = jobs.length - jobsPagados;

  setText('stat-clients', clients.length);
  setText('stat-jobs', jobs.length);
  setText('stat-billed', formatCurrency(totalDebito));
  setText('stat-saldo', formatCurrency(totalDebito - totalCredito));
  setText('stat-pagados', jobsPagados);
  setText('stat-pendientes', jobsPendientes);

  renderDashboardRecentJobs(jobs);
}

function renderDashboardRecentJobs(jobs) {
  var wrap = document.getElementById('dashboard-recent-jobs');
  if (!wrap) return;
  var sorted = jobs.slice().sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).slice(0, 5);
  var columns = [
    { key: 'date', label: 'Fecha', render: function(r) { return formatDate(r.date); } },
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto', render: function(r) { return formatCurrency(r.amount); } },
    { key: 'status', label: 'Estado', render: function(r) { return jobStatusBadge(r.status); } }
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
  statusEl.className = 'badge ' + jobStatusBadgeClass(job.status);
  statusEl.textContent = jobStatusLabel(job.status);

  var doneEl = document.getElementById('pt-completado');
  var confEl = document.getElementById('pt-conforme');
  var faltEl = document.getElementById('pt-faltante');
  var obsEl = document.getElementById('pt-observaciones');
  if (doneEl) doneEl.checked = !!job.completado;
  if (confEl) confEl.checked = !!job.conforme;
  if (faltEl) faltEl.value = job.faltante || '';
  if (obsEl) obsEl.value = job.observaciones || '';

  renderJobDetailMap(job.mapLink, job.location);

  var markBtn = document.getElementById('job-detail-mark-paid');
  var markText = document.getElementById('job-detail-mark-paid-text');
  if (markBtn) {
    markBtn.dataset.id = job.id;
    markBtn.disabled = job.status === 'pagado';
    if (markText) markText.textContent = job.status === 'pagado' ? 'Ya Cobrado' : 'Marcar como Cobrado';
  }

  var editBtn = document.getElementById('job-detail-edit-btn');
  if (editBtn) editBtn.dataset.id = job.id;

  openModal('modal-job');
}

function renderJobDetailMap(mapLink, location) {
  var wrap = document.getElementById('job-detail-map-wrap');
  var iframe = document.getElementById('job-detail-map');
  var link = document.getElementById('job-detail-map-link');
  var src = buildEmbedUrl(mapLink || location);
  if (src) {
    iframe.src = src;
    iframe.classList.remove('hidden');
    if (mapLink) {
      link.href = mapLink;
      link.classList.remove('hidden');
    } else {
      link.removeAttribute('href');
      link.classList.add('hidden');
    }
    wrap.classList.remove('hidden');
  } else {
    iframe.src = '';
    iframe.classList.add('hidden');
    link.removeAttribute('href');
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

  // Inicializar vistas (guard interno en cada init para no duplicar listeners)
  initClientsView(store);
  initJobsView(store);
  initAccountView(store);
  initKanbanView(store);

  // Delegación para abrir detalle desde dashboard y tablas
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action="Ver"]');
    if (!btn) return;
    var rowId = btn.dataset.id;
    if (!rowId) return;
    openJobDetail(store, rowId);
  });

  // Botón "Editar Trabajo" desde el modal de detalle -> carga el trabajo en el formulario
  var editDetailBtn = document.getElementById('job-detail-edit-btn');
  if (editDetailBtn) {
    editDetailBtn.addEventListener('click', function() {
      var id = this.dataset.id;
      closeModal('modal-job');
      startEditJob(store, id);
    });
  }

  // Botón "Guardar Post-Trabajo": persiste checklist/faltante/observaciones del trabajo
  var savePt = document.getElementById('job-detail-save-pt');
  if (savePt) {
    savePt.addEventListener('click', function() {
      var id = document.getElementById('job-detail-id').textContent;
      var job = store.getJobs().find(function(j) { return String(j.id) === String(id); });
      if (!job) return;
      store.updateJob(Object.assign({}, job, {
        completado: document.getElementById('pt-completado').checked,
        conforme: document.getElementById('pt-conforme').checked,
        faltante: document.getElementById('pt-faltante').value,
        observaciones: document.getElementById('pt-observaciones').value
      }));
      toast('Post-trabajo guardado', 'success');
      closeModal('modal-job');
    });
  }

  // Marcar como cobrado desde el detalle
  const markPaid = document.getElementById('job-detail-mark-paid');
  if (markPaid) {
    markPaid.addEventListener('click', function() {
      var id = this.dataset.id;
      var job = store.getJobs().find(function(j) { return String(j.id) === String(id); });
      if (!job) return;
      store.updateJob(Object.assign({}, job, { status: 'pagado' }));
      toast('Trabajo marcado como cobrado', 'success');
      closeModal('modal-job');
    });
  }

  handleRoute();
  // Refrescar dashboard en vivo cuando cambian los datos
  store.subscribe(function() { if (currentView === 'dashboard') renderDashboard(); });
});

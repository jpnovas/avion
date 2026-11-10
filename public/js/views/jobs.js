// js/views/jobs.js - vista de Carga de Trabajos (alta y edición)

var jobsInitialized = false;
var jobsStoreRef = null;

function initJobsView(store) {
  if (jobsInitialized) return;
  jobsInitialized = true;
  jobsStoreRef = store;

  var selectClient = document.getElementById('job-client');
  var form = document.getElementById('form-job');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    // Guard contra doble despacho
    if (form.dataset.submitting === '1') return;
    var data = collectJobForm(form);

    if (!data.clientId || !data.date || !data.description) {
      toast('Completá los campos obligatorios', 'error');
      return;
    }

    form.dataset.submitting = '1';
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      var editingId = form.querySelector('#job-id').value;
      if (editingId) {
        store.updateJob(Object.assign({}, data, { id: editingId }));
        toast('Trabajo actualizado correctamente', 'success');
      } else {
        store.addJob(data);
        toast('Trabajo guardado correctamente', 'success');
      }
      exitJobEditMode();
      renderMapPreview();
    } finally {
      form.dataset.submitting = '';
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  document.getElementById('btn-cancel-job-edit').addEventListener('click', function() {
    exitJobEditMode();
  });

  var mapLink = document.getElementById('job-map-link');
  if (mapLink) mapLink.addEventListener('input', function() { renderMapPreview(); });
  var locationInput = document.getElementById('job-location');
  if (locationInput) locationInput.addEventListener('input', function() { renderMapPreview(); });

  document.getElementById('jobs-table-container').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    var id = btn.dataset.id;

    if (action === 'Ver detalle') {
      openJobDetail(store, id);
    } else if (action === 'Editar') {
      startEditJob(store, id);
    } else if (action === 'Eliminar') {
      confirmAction('¿Eliminar este trabajo y sus pagos?', function() {
        store.deleteJob(id);
        toast('Trabajo eliminado', 'success');
      });
    }
  });

  store.subscribe(function(data) {
    var clients = data.clients || [];
    var jobs = data.jobs || [];

    if (selectClient) {
      var prev = selectClient.value;
      selectClient.innerHTML = '<option value="">Seleccione cliente</option>' +
        clients.map(function(c) { return '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>'; }).join('');
      selectClient.value = prev;
    }

    function clientName(id) {
      return (clients.find(function(c) { return c.id === id; }) || {}).name || '';
    }

    var columns = [
      { key: 'date', label: 'Fecha', render: function(r) { return formatDate(r.date); } },
      { key: 'description', label: 'Descripción' },
      { key: 'clientId', label: 'Cliente', render: function(r) { return escapeHtml(clientName(r.clientId)); } },
      { key: 'amount', label: 'Monto', render: function(r) { return formatCurrency(r.amount); } },
      { key: 'status', label: 'Estado', render: function(r) { return jobStatusBadge(r.status); } }
    ];
    var actions = [
      { label: 'Ver detalle', icon: 'fa-eye', tone: '' },
      { label: 'Editar', icon: 'fa-pen', tone: '' },
      { label: 'Eliminar', icon: 'fa-trash', tone: 'danger' }
    ];
    document.getElementById('jobs-table-container').innerHTML = renderTable(jobs, columns, actions);
  });

  renderMapPreview();
}

function collectJobForm(form) {
  return {
    clientId: (form.querySelector('[name="clientId"]') || {}).value || '',
    date: (form.querySelector('[name="date"]') || {}).value || '',
    amount: parseFloat((form.querySelector('[name="amount"]') || {}).value) || 0,
    description: (form.querySelector('[name="description"]') || {}).value || '',
    location: (form.querySelector('[name="location"]') || {}).value || '',
    mapLink: (form.querySelector('[name="mapLink"]') || {}).value || '',
    status: (form.querySelector('[name="status"]') || {}).value || 'pendiente'
  };
}

function exitJobEditMode() {
  var form = document.getElementById('form-job');
  if (!form) return;
  form.reset();
  document.getElementById('job-id').value = '';
  var title = document.getElementById('job-form-title');
  if (title) title.textContent = 'Nuevo Trabajo';
  var submitBtn = document.getElementById('btn-save-job');
  if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> <span>Guardar Trabajo</span>';
  var cancelBtn = document.getElementById('btn-cancel-job-edit');
  if (cancelBtn) cancelBtn.classList.add('hidden');
}

// Carga el trabajo indicado en el formulario de Carga de Trabajos (modo edición).
function startEditJob(store, id) {
  if (!store) store = jobsStoreRef;
  if (!store) return;
  var job = store.getJobs().find(function(j) { return String(j.id) === String(id); });
  if (!job) return;
  window.location.hash = '#/jobs';
  var form = document.getElementById('form-job');
  populateForm(form, job);
  document.getElementById('job-id').value = job.id;
  var title = document.getElementById('job-form-title');
  if (title) title.textContent = 'Editar Trabajo';
  var submitBtn = document.getElementById('btn-save-job');
  if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> <span>Actualizar Trabajo</span>';
  var cancelBtn = document.getElementById('btn-cancel-job-edit');
  if (cancelBtn) cancelBtn.classList.remove('hidden');
  renderMapPreview();
}

function renderMapPreview() {
  var iframe = document.getElementById('job-map-preview');
  if (!iframe) return;
  var mapLink = document.getElementById('job-map-link');
  var link = (mapLink && mapLink.value) ? mapLink.value.trim() : '';
  var locationEl = document.getElementById('job-location');
  var location = locationEl ? locationEl.value.trim() : '';
  var src = buildEmbedUrl(link || location);
  if (src) {
    iframe.src = src;
    iframe.classList.remove('hidden');
  } else {
    iframe.src = '';
    iframe.classList.add('hidden');
  }
}

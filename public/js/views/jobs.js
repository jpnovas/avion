// js/views/jobs.js - vista de Carga de Trabajos

var jobsInitialized = false;

function initJobsView(store) {
  if (jobsInitialized) return;
  jobsInitialized = true;

  var selectClient = document.getElementById('job-client');

  document.getElementById('form-job').addEventListener('submit', function(e) {
    e.preventDefault();
    var form = e.target;
    // Guard contra doble despacho (mensajes de confirmación/clics repetidos)
    if (form.dataset.submitting === '1') return;
    var clientId = form.querySelector('[name="clientId"]').value;
    var date = form.querySelector('[name="date"]').value;
    var description = form.querySelector('[name="description"]').value;
    var amount = form.querySelector('[name="amount"]').value;
    var location = form.querySelector('[name="location"]').value;
    var mapLink = (form.querySelector('[name="mapLink"]') || {}).value || '';

    if (!clientId || !date || !description) {
      toast('Completá los campos obligatorios', 'error');
      return;
    }

    form.dataset.submitting = '1';
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      store.addJob({
        clientId: clientId,
        date: date,
        description: description,
        amount: parseFloat(amount) || 0,
        location: location,
        mapLink: mapLink
      });
      toast('Trabajo guardado correctamente', 'success');
      clearForm(form);
      renderMapPreview();
    } finally {
      form.dataset.submitting = '';
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  var mapLink = document.getElementById('job-map-link');
  if (mapLink) {
    mapLink.addEventListener('input', function() { renderMapPreview(); });
  }
  var locationInput = document.getElementById('job-location');
  if (locationInput) {
    locationInput.addEventListener('input', function() { renderMapPreview(); });
  }

  document.getElementById('jobs-table-container').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    var id = btn.dataset.id;

    if (action === 'Ver detalle') {
      openJobDetail(store, id);
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
      { key: 'status', label: 'Estado', render: function(r) {
          return '<span class="badge ' + (r.status === 'pagado' ? 'badge-pagado' : 'badge-pendiente') + '">' +
            (r.status === 'pagado' ? 'Pagado' : 'Pendiente') + '</span>';
        } }
    ];
    var actions = [
      { label: 'Ver detalle', icon: 'fa-eye', tone: '' },
      { label: 'Eliminar', icon: 'fa-trash', tone: 'danger' }
    ];
    document.getElementById('jobs-table-container').innerHTML = renderTable(jobs, columns, actions);
  });

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

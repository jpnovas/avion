// js/views/jobs.js - vista de Carga de Trabajos

function initJobsView(store) {
  // Formulario de nuevo trabajo
  document.getElementById('form-job').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const clientId = form.querySelector('[name="clientId"]').value;
    const date = form.querySelector('[name="date"]').value;
    const description = form.querySelector('[name="description"]').value;
    const amount = form.querySelector('[name="amount"]').value;
    const location = form.querySelector('[name="location"]').value;

    if (!clientId || !date || !description) {
      toast('Completá los campos obligatorios', 'error');
      return;
    }

    store.addJob({ clientId: clientId, date: date, description: description, amount: parseFloat(amount) || 0, location: location });
    toast('Trabajo guardado', 'success');
    clearForm(form);
    renderMapPreview();
  });

  // Input de enlace del mapa
  const mapLink = document.getElementById('job-map-link');
  if (mapLink) {
    mapLink.addEventListener('input', function() { renderMapPreview(); });
  }

  store.subscribe(function(data) {
    const clients = data.clients || [];
    const jobs = data.jobs || [];

    // Rellenar selector de clientes
    const select = document.getElementById('job-client');
    if (select) {
      select.innerHTML = '<option value="">Seleccione cliente</option>' +
        clients.map(function(c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
    }

    // Tabla de trabajos
    const columns = [
      { key: 'date', label: 'Fecha' },
      { key: 'description', label: 'Descripción' },
      { key: 'clientId', label: 'Cliente', render: function(r) { return (clients.find(function(c) { return c.id === r.clientId; }) || {}).name || ''; } },
      { key: 'amount', label: 'Monto', render: function(r) { return formatCurrency(r.amount); } },
      { key: 'status', label: 'Estado', render: function(r) { return '<span class="badge ' + (r.status === 'pagado' ? 'badge-paid' : 'badge-pending') + '">' + r.status + '</span>'; } }
    ];
    const actions = [
      { label: 'Eliminar', class: 'btn-danger' }
    ];
    document.getElementById('jobs-table-container').innerHTML = renderTable(jobs, columns, actions);
  });

  document.getElementById('jobs-table-container').addEventListener('click', function(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'Eliminar') {
      confirmAction('¿Eliminar este trabajo?', function() {
        store.deleteJob(btn.dataset.id);
        toast('Trabajo eliminado', 'success');
      });
    }
  });

  renderMapPreview();
}

function renderMapPreview() {
  const iframe = document.getElementById('job-map-preview');
  if (!iframe) return;
  const mapLink = document.getElementById('job-map-link');
  const link = mapLink ? mapLink.value : '';
  if (link) {
    iframe.src = link.indexOf('google.com/maps/embed') !== -1 ? link : 'https://www.google.com/maps/embed/?q=' + encodeURIComponent(link);
    iframe.classList.remove('hidden');
  } else {
    iframe.src = '';
    iframe.classList.add('hidden');
  }
}

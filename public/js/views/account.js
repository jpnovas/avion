// js/views/account.js - vista Cuenta Corriente
// Adjuntamos listeners UNA sola vez

var accountInitialized = false;
var accountStore = null;
var selectedClientId = '';

function initAccountView(store) {
  if (accountInitialized) return;
  accountInitialized = true;
  accountStore = store;

  var formPayment = document.getElementById('form-payment');
  var selectAccount = document.getElementById('account-client');
  var paymentDate = document.getElementById('payment-date');
  var paymentJobSelect = document.getElementById('payment-job');
  if (paymentDate) paymentDate.value = todayISO();

  // Cambio de cliente en el panel principal
  selectAccount.addEventListener('change', function() {
    selectedClientId = this.value;
    fillJobSelect(paymentJobSelect, store, this.value);
    renderAccount(selectedClientId);
  });
  // Si cambia el cliente del formulario de pago, refrescar sus trabajos linkeables
  document.getElementById('payment-client').addEventListener('change', function() {
    fillJobSelect(paymentJobSelect, store, this.value);
  });

  // Registrar pago
  formPayment.addEventListener('submit', function(e) {
    e.preventDefault();
    var amountEl = document.getElementById('payment-amount');
    var dateEl = document.getElementById('payment-date');
    var clientEl = document.getElementById('payment-client');
    var jobEl = paymentJobSelect;

    var clientId = clientEl.value;
    var amount = parseFloat(amountEl.value) || 0;

    if (formPayment.dataset.submitting === '1') return;
    if (!clientId || amount <= 0) {
      toast('Seleccioná un cliente e importe válido', 'error');
      return;
    }
    formPayment.dataset.submitting = '1';

    try {
      var jobId = jobEl && jobEl.value ? jobEl.value : null;
      store.addPayment({
        clientId: clientId,
        jobId: jobId,
        amount: amount,
        date: dateEl.value || todayISO(),
        note: document.getElementById('payment-note').value
      });
      toast('Pago registrado correctamente', 'success');

      clearForm(formPayment);
      if (paymentDate) paymentDate.value = todayISO();
      if (jobEl) fillJobSelect(jobEl, accountStore, clientEl.value);
    } finally {
      formPayment.dataset.submitting = '';
    }
  });

  // Delegación para clicks en las tablas de cuenta
  document.getElementById('account-jobs-table').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'Ver detalle') {
      openJobDetail(store, btn.dataset.id);
    } else if (btn.dataset.action === 'Editar') {
      startEditJob(store, btn.dataset.id);
    }
  });
  document.getElementById('account-payments-table').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'Eliminar') {
      confirmAction('¿Eliminar este pago?', function() {
        store.deletePayment(btn.dataset.id);
        toast('Pago eliminado', 'success');
      });
    } else if (btn.dataset.action === 'Editar') {
      openPaymentEditModal(accountStore, btn.dataset.id);
    }
  });

  // Guardar edición de pago (modal-payment)
  var formEdit = document.getElementById('form-payment-edit');
  formEdit.addEventListener('submit', function(e) {
    e.preventDefault();
    var id = document.getElementById('payment-edit-id').value;
    var clientId = document.getElementById('payment-edit-client').value;
    var amount = parseFloat(document.getElementById('payment-edit-amount').value) || 0;
    var date = document.getElementById('payment-edit-date').value || todayISO();
    var note = document.getElementById('payment-edit-note').value;
    var jobId = document.getElementById('payment-edit-job').value || null;

    if (!id || !clientId || amount <= 0) {
      toast('Completá cliente e importe válido', 'error');
      return;
    }
    if (formEdit.dataset.submitting === '1') return;
    formEdit.dataset.submitting = '1';

    try {
      accountStore.updatePayment({ id: id, clientId: clientId, jobId: jobId, amount: amount, date: date, note: note });
      toast('Pago actualizado correctamente', 'success');
      closeModal('modal-payment');
    } finally {
      formEdit.dataset.submitting = '';
    }
  });

  // Tabla de todas las cuentas: click en "Abrir" -> cambia de cliente
  document.getElementById('accounts-table-container').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action="Abrir"]');
    if (!btn) return;
    var id = btn.dataset.id;
    selectedClientId = id;
    document.getElementById('account-client').value = id;
    renderAccount(id);
  });

  store.subscribe(onDataChanged);
}

function onDataChanged(data) {
  var clients = data.clients || [];
  fillClientSelect(document.getElementById('account-client'), clients, true);
  fillClientSelect(document.getElementById('payment-client'), clients, true);
  // Refrescar el link de trabajo según el cliente seleccionado en cada select
  var pc = document.getElementById('payment-client');
  fillJobSelect(document.getElementById('payment-job'), accountStore, pc ? pc.value : '');
  var pe = document.getElementById('payment-edit-client');
  fillJobSelect(document.getElementById('payment-edit-job'), accountStore, pe ? pe.value : '');
  if (selectedClientId) renderAccount(selectedClientId);
  renderAllAccountsTable();
}

function fillClientSelect(sel, clients, keepPrev) {
  if (!sel) return;
  var prev = sel.value;
  sel.innerHTML = '<option value="">Seleccionar cliente</option>' +
    clients.map(function(c) { return '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>'; }).join('');
  if (keepPrev && prev) sel.value = prev;
}

function fillJobSelect(sel, store, clientId) {
  if (!sel) return;
  var prev = sel.value;
  var jobs = store ? store.getJobs().filter(function(j) { return !clientId || String(j.clientId) === String(clientId); }) : [];
  sel.innerHTML = '<option value="">Sin vínculo a trabajo</option>' +
    jobs.map(function(j) {
      return '<option value="' + j.id + '">' + escapeHtml(formatDate(j.date)) + ' - ' + escapeHtml((j.description || '').slice(0, 60)) + ' (' + escapeHtml(formatCurrency(j.amount)) + ')</option>';
    }).join('');
  if (prev) sel.value = prev;
}

function openPaymentEditModal(store, paymentId) {
  var p = store.getPayments().find(function(x) { return String(x.id) === String(paymentId); });
  if (!p) return;
  var clients = store.getClients();
  fillClientSelect(document.getElementById('payment-edit-client'), clients, false);
  fillJobSelect(document.getElementById('payment-edit-job'), store, p.clientId);
  document.getElementById('payment-edit-id').value = p.id;
  document.getElementById('payment-edit-client').value = p.clientId || '';
  document.getElementById('payment-edit-amount').value = p.amount || 0;
  document.getElementById('payment-edit-date').value = (p.date || '').slice(0, 10) || todayISO();
  document.getElementById('payment-edit-note').value = p.note || '';
  document.getElementById('payment-edit-job').value = p.jobId || '';
  // Re-popular los jobs según el cliente actual por si cambió value tras fillJobSelect
  document.getElementById('payment-edit-job').onchange = null;
  openModal('modal-payment');
}

function renderAccount(clientId) {
  var acc = accountStore.getAccount(clientId);
  var client = accountStore.getClients().find(function(c) { return c.id === clientId; });

  setText('account-client-name', client ? client.name : '—');
  setText('account-debito', formatCurrency(acc.totalDebito));
  setText('account-credito', formatCurrency(acc.totalCredito));
  setText('account-saldo', formatCurrency(acc.saldo));

  var jobCols = [
    { key: 'date', label: 'Fecha', render: function(r) { return formatDate(r.date); } },
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto', render: function(r) { return formatCurrency(r.amount); } },
    { key: 'status', label: 'Estado', render: function(r) { return jobStatusBadge(r.status); } }
  ];
  document.getElementById('account-jobs-table').innerHTML =
    renderTable(acc.jobs, jobCols, [{ label: 'Ver detalle', icon: 'fa-eye', tone: '' }, { label: 'Editar', icon: 'fa-pen', tone: '' }]);

  var payCols = [
    { key: 'date', label: 'Fecha', render: function(r) { return formatDate(r.date); } },
    { key: 'amount', label: 'Monto', render: function(r) { return formatCurrency(r.amount); } },
    { key: 'note', label: 'Nota' },
    { key: 'job', label: 'Trabajo', render: function(r) {
        if (!r.jobId) return '—';
        var job = accountStore.getJobs().find(function(j) { return String(j.id) === String(r.jobId); });
        return job ? escapeHtml((job.description || '').slice(0, 48)) + ' (' + formatCurrency(job.amount) + ')' : '—';
      } }
  ];
  document.getElementById('account-payments-table').innerHTML =
    renderTable(acc.payments, payCols, [{ label: 'Editar', icon: 'fa-pen', tone: '' }, { label: 'Eliminar', icon: 'fa-trash', tone: 'danger' }]);
}

function renderAllAccountsTable() {
  var wrap = document.getElementById('accounts-table-container');
  if (!wrap) return;
  var clients = accountStore.getClients();
  var rows = clients.map(function(c) {
    var acc = accountStore.getAccount(c.id);
    return { id: c.id, name: c.name, debito: acc.totalDebito, credito: acc.totalCredito, saldo: acc.saldo };
  });
  var columns = [
    { key: 'name', label: 'Cliente' },
    { key: 'debito', label: 'Total Debito', render: function(r) { return formatCurrency(r.debito); } },
    { key: 'credito', label: 'Total Crédito', render: function(r) { return formatCurrency(r.credito); } },
    { key: 'saldo', label: 'Saldo', render: function(r) { return '<strong>' + formatCurrency(r.saldo) + '</strong>'; } }
  ];
  wrap.innerHTML = renderTable(rows, columns, [{ label: 'Abrir', icon: 'fa-arrow-up-right-from-square', tone: '' }]);
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

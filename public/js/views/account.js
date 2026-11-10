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
  if (paymentDate) paymentDate.value = todayISO();

  //(Cambio de cliente en el panel principal)
  selectAccount.addEventListener('change', function() {
    selectedClientId = this.value;
    renderAccount(selectedClientId);
  });

  // Registrar pago
  formPayment.addEventListener('submit', function(e) {
    e.preventDefault();
    var amountEl = document.getElementById('payment-amount');
    var dateEl = document.getElementById('payment-date');
    var clientEl = document.getElementById('payment-client');

    var clientId = clientEl.value;
    var amount = parseFloat(amountEl.value) || 0;

    if (formPayment.dataset.submitting === '1') return;
    if (!clientId || amount <= 0) {
      toast('Seleccioná un cliente e importe válido', 'error');
      return;
    }
    formPayment.dataset.submitting = '1';

    try {
      store.addPayment({
        clientId: clientId,
        amount: amount,
        date: dateEl.value || todayISO(),
        note: document.getElementById('payment-note').value
      });
      toast('Pago registrado correctamente', 'success');

      clearForm(formPayment);
      if (paymentDate) paymentDate.value = todayISO();
    } finally {
      formPayment.dataset.submitting = '';
    }
  });

  // Delegación para clicks en las tablas de cuenta
  document.getElementById('account-jobs-table').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action="Ver detalle"]');
    if (!btn) return;
    openJobDetail(store, btn.dataset.id);
  });
  document.getElementById('account-payments-table').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action="Eliminar"]');
    if (!btn) return;
    confirmAction('¿Eliminar este pago?', function() {
      store.deletePayment(btn.dataset.id);
      toast('Pago eliminado', 'success');
    });
  });

  // Tabla de todas las cuentas: click en "Ver" -> cambia de cliente
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
    { key: 'status', label: 'Estado', render: function(r) {
        return '<span class="badge ' + (r.status === 'pagado' ? 'badge-pagado' : 'badge-pendiente') + '">' +
          (r.status === 'pagado' ? 'Pagado' : 'Pendiente') + '</span>';
      } }
  ];
  document.getElementById('account-jobs-table').innerHTML =
    renderTable(acc.jobs, jobCols, [{ label: 'Ver detalle', icon: 'fa-eye', tone: '' }]);

  var payCols = [
    { key: 'date', label: 'Fecha', render: function(r) { return formatDate(r.date); } },
    { key: 'amount', label: 'Monto', render: function(r) { return formatCurrency(r.amount); } },
    { key: 'note', label: 'Nota' }
  ];
  document.getElementById('account-payments-table').innerHTML =
    renderTable(acc.payments, payCols, [{ label: 'Eliminar', icon: 'fa-trash', tone: 'danger' }]);
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

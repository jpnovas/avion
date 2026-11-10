// js/views/account.js - vista Cuenta Corriente

function initAccountView(store) {
  // Formulario: consultar cuenta
  document.getElementById('form-account').addEventListener('submit', function(e) {
    e.preventDefault();
    const clientId = document.getElementById('account-client').value;
    if (!clientId) {
      toast('Seleccione un cliente', 'error');
      return;
    }
    renderAccount(store, clientId);
  });

  document.getElementById('account-client').addEventListener('change', function() {
    const clientId = this.value;
    if (clientId) renderAccount(store, clientId);
  });

  store.subscribe(function(data) {
    const clients = data.clients || [];

    // Rellenar selector con todos los clientes
    const select = document.getElementById('account-client');
    if (select) {
      select.innerHTML = '<option value="">Seleccione cliente</option>' +
        clients.map(function(c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
      if (select.value) renderAccount(store, select.value);
    }

    // Tabla de totalidad de cuentas (resumen)
    const columns = [
      { key: 'name', label: 'Cliente' },
      { key: 'debito', label: 'Total Debito', render: function(r) { return formatCurrency(r.debito); } },
      { key: 'credito', label: 'Total Crédito', render: function(r) { return formatCurrency(r.credito); } },
      { key: 'saldo', label: 'Saldo', render: function(r) { return '<strong>' + formatCurrency(r.saldo) + '</strong>'; } }
    ];
    const rows = clients.map(function(c) {
      const acc = store.getAccount(c.id);
      return { id: c.id, name: c.name, debito: acc.totalDebito, credito: acc.totalCredito, saldo: acc.saldo };
    });
    document.getElementById('accounts-table-container').innerHTML = renderTable(rows, columns, []);
  });
}

function renderAccount(store, clientId) {
  const account = store.getAccount(clientId);
  const clients = store.getData().clients;
  const client = clients.find(function(c) { return c.id === clientId; });

  document.getElementById('account-debito').textContent = formatCurrency(account.totalDebito);
  document.getElementById('account-credito').textContent = formatCurrency(account.totalCredito);
  document.getElementById('account-saldo').textContent = formatCurrency(account.saldo);

  const jobsColumns = [
    { key: 'date', label: 'Fecha' },
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto', render: function(r) { return formatCurrency(r.amount); } },
    { key: 'status', label: 'Estado', render: function(r) { return r.status; } }
  ];
  document.getElementById('account-jobs-table').innerHTML = renderTable(account.jobs, jobsColumns, []);

  const paymentsColumns = [
    { key: 'date', label: 'Fecha' },
    { key: 'amount', label: 'Monto', render: function(r) { return formatCurrency(r.amount); } },
    { key: 'note', label: 'Nota' }
  ];
  document.getElementById('account-payments-table').innerHTML = renderTable(account.payments, paymentsColumns, []);
}

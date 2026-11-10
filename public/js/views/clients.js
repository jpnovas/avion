// js/views/clients.js - vista CRUD Clientes
// Los listeners se adjuntan una sola vez por consulta (reset con init guard)

var clientsSearchQuery = '';
var clientsStore = null;
var clientsInitialized = false;

function initClientsView(store) {
  if (clientsInitialized) return;
  clientsInitialized = true;
  clientsStore = store;

  var modal = document.getElementById('modal-client');
  var formClient = document.getElementById('form-client');
  var searchInput = document.getElementById('clients-search');

  document.getElementById('btn-new-client').addEventListener('click', function() {
    clearForm(formClient);
    document.getElementById('client-id').value = '';
    document.getElementById('modal-client-title').textContent = 'Nuevo Cliente';
    openModal('modal-client');
  });

  formClient.addEventListener('submit', function(e) {
    e.preventDefault();
    var data = formToObject(formClient);
    var id = document.getElementById('client-id').value;
    if (!data.name || !data.name.trim()) {
      toast('El nombre del cliente es obligatorio', 'error');
      return;
    }
    if (id) {
      store.updateClient(Object.assign({}, data, { id: id }));
      toast('Cliente actualizado', 'success');
    } else {
      store.addClient(data);
      toast('Cliente creado', 'success');
    }
    closeModal('modal-client');
  });

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      clientsSearchQuery = searchInput.value.trim().toLowerCase();
      renderClientsTable();
    });
  }

  document.getElementById('clients-table-container').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    var id = btn.dataset.id;
    var action = btn.dataset.action;

    if (action === 'Editar') {
      var client = store.getData().clients.find(function(c) { return c.id === id; });
      if (client) {
        populateForm(formClient, client);
        document.getElementById('client-id').value = id;
        document.getElementById('modal-client-title').textContent = 'Editar Cliente';
        openModal('modal-client');
      }
    } else if (action === 'Eliminar') {
      confirmAction('¿Eliminar este cliente y sus trabajos/pagos?', function() {
        store.deleteClient(id);
        toast('Cliente eliminado', 'success');
      });
    }
  });

  store.subscribe(renderClientsTable);
}

function renderClientsTable(data) {
  var clients = [];
  try {
    clients = (data || clientsStore.getData()).clients || [];
  } catch (e) {
    clients = clientsStore ? clientsStore.getData().clients : [];
  }

  if (clientsSearchQuery) {
    clients = clients.filter(function(c) {
      var haystack = [c.name, c.cuit, c.phone, c.city, c.contact].join(' ').toLowerCase();
      return haystack.indexOf(clientsSearchQuery) !== -1;
    });
  }

  var columns = [
    { key: 'name', label: 'Razón Social / Nombre' },
    { key: 'cuit', label: 'CUIT' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'city', label: 'Localidad' },
    { key: 'contact', label: 'Contacto' },
    { key: 'createdAt', label: 'Creado', render: function(r) { return formatDate(r.createdAt); } }
  ];
  var actions = [
    { label: 'Editar', icon: 'fa-pen', tone: '' },
    { label: 'Eliminar', icon: 'fa-trash', tone: 'danger' }
  ];
  document.getElementById('clients-table-container').innerHTML = renderTable(clients, columns, actions);
}

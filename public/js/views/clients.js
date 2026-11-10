// js/views/clients.js - vista CRUD Clientes

function initClientsView(store) {
  // Botón nuevo cliente
  document.getElementById('btn-new-client').addEventListener('click', function() {
    clearForm(document.getElementById('form-client'));
    document.getElementById('client-id').value = '';
    document.getElementById('modal-client-title').textContent = 'Nuevo Cliente';
    openModal('modal-client');
  });

  // Guardar cliente
  document.getElementById('form-client').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const data = formToObject(form);
    const id = document.getElementById('client-id').value;
    if (id) {
      store.updateClient(Object.assign({}, data, { id: id }));
      toast('Cliente actualizado', 'success');
    } else {
      store.addClient(data);
      toast('Cliente creado', 'success');
    }
    closeModal('modal-client');
  });

  // Tabla: Editar / Eliminar
  document.getElementById('clients-table-container').addEventListener('click', function(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'Editar') {
      const client = store.getData().clients.find(function(c) { return c.id === id; });
      if (client) {
        populateForm(document.getElementById('form-client'), client);
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

  store.subscribe(function(data) {
    const clients = data.clients || [];
    const columns = [
      { key: 'name', label: 'Razón Social / Nombre' },
      { key: 'cuit', label: 'CUIT / Teléfono' },
      { key: 'city', label: 'Localidad' },
      { key: 'contact', label: 'Contacto' },
      { key: 'createdAt', label: 'Creado', render: function(r) { return formatDate(r.createdAt); } }
    ];
    const actions = [
      { label: 'Editar', class: 'btn-secondary' },
      { label: 'Eliminar', class: 'btn-danger' }
    ];
    document.getElementById('clients-table-container').innerHTML = renderTable(clients, columns, actions);
  });
}

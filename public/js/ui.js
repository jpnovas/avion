// js/ui.js - utilidades de UI: modales, notificaciones, helpers de formulario
// Script clásico - variables globales

function toast(message, type, duration) {
  type = type || 'info';
  duration = duration || 3000;
  const container = document.getElementById('toast-container') || createToastContainer();
  const el = document.createElement('div');
  const colors = { info: 'bg-blue-600', success: 'bg-green-600', error: 'bg-red-600', warning: 'bg-yellow-600' };
  el.className = 'px-4 py-2 rounded-lg shadow-lg text-white ' + (colors[type] || colors.info);
  el.textContent = message;
  container.appendChild(el);
  setTimeout(function() { el.classList.add('opacity-0', 'transition-opacity', 'duration-300'); setTimeout(function() { el.remove(); }, 300); }, duration);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
  document.body.appendChild(container);
  return container;
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); document.body.style.overflow = ''; }
}

function confirmAction(message, onConfirm) {
  if (confirm(message)) onConfirm();
}

function formToObject(form) {
  const data = {};
  const fields = new FormData(form);
  for (const pair of fields) { data[pair[0]] = pair[1]; }
  return data;
}

function populateForm(form, data) {
  Object.keys(data || {}).forEach(function(key) {
    const input = form.querySelector('[name="' + key + '"]');
    if (input) {
      if (input.type === 'checkbox') input.checked = data[key] === 'on' || data[key] === true;
      else input.value = data[key];
    }
  });
}

function clearForm(form) {
  form.reset();
}

function renderTable(rows, columns, actions) {
  actions = actions || [];
  const rowsArr = rows || [];
  const thead = '<thead><tr>' + columns.map(function(c) { return '<th>' + c.label + '</th>'; }).join('') + (actions.length ? '<th style="text-align:right">Acciones</th>' : '') + '</tr></thead>';
  const tbody = '<tbody>' + rowsArr.map(function(row) {
    return '<tr>' + columns.map(function(c) {
      const val = c.render ? c.render(row) : (row[c.key] || '');
      return '<td>' + val + '</td>';
    }).join('') + (actions.length
      ? '<td style="text-align:right">' + actions.map(function(a) {
          return '<button class="' + a.class + '" data-action="' + a.label + '" data-id="' + row.id + '">' + a.label + '</button>';
        }).join(' ') + '</td>'
      : '') + '</tr>';
  }).join('') + '</tbody>';
  return '<table>' + thead + tbody + '</table>';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-AR');
}

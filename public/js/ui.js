// js/ui.js - utilidades de UI: modales, notificaciones, tablas, formato
// Script clásico - variables globales

function toast(message, type, duration) {
  type = type || 'info';
  duration = duration || 3200;
  const container = document.getElementById('toast-container') || createToastContainer();
  const el = document.createElement('div');
  const colors = { info: 'bg-blue-600', success: 'bg-green-600', error: 'bg-red-600', warning: 'bg-yellow-600' };
  el.className = 'px-4 py-2 rounded-lg shadow-lg text-white text-sm font-semibold ' + (colors[type] || colors.info);
  el.textContent = message;
  container.appendChild(el);
  setTimeout(function() {
    el.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(function() { el.remove(); }, 320);
  }, duration);
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
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

// Cerrar modales al hacer clic en el overlay o con Escape
document.addEventListener('click', function(e) {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
    e.target.classList.remove('flex');
    document.body.style.overflow = '';
  }
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(function(m) {
      m.classList.add('hidden');
      m.classList.remove('flex');
    });
    document.body.style.overflow = '';
  }
});

function confirmAction(message, onConfirm) {
  if (window.confirm(message)) onConfirm();
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
    if (!input) return;
    if (input.type === 'checkbox') input.checked = data[key] === 'on' || data[key] === true;
    else input.value = data[key];
  });
}

function clearForm(form) {
  if (form) form.reset();
}

function renderTable(rows, columns, actions) {
  actions = actions || [];
  const rowsArr = rows || [];
  if (!rowsArr.length) {
    return '<div class="empty-state"><i class="fa-solid fa-inbox"></i>No hay registros cargados todavía.</div>';
  }
  const thead = '<thead><tr>' + columns.map(function(c) { return '<th>' + c.label + '</th>'; }).join('') +
    (actions.length ? '<th style="text-align:right">Acciones</th>' : '') + '</tr></thead>';
  const tbody = '<tbody>' + rowsArr.map(function(row) {
    return '<tr>' + columns.map(function(c) {
      const val = c.render ? c.render(row) : escapeHtml(String(row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : ''));
      return '<td>' + val + '</td>';
    }).join('') + (actions.length
      ? '<td style="text-align:right; white-space:nowrap">' + actions.map(function(a) {
          return '<button type="button" class="action-btn' + (a.tone ? ' ' + a.tone : '') + '" data-action="' + a.label + '" data-id="' + row.id + '" title="' + a.label + '">' +
            (a.icon ? '<i class="fa-solid ' + a.icon + '"></i>' : '') + '<span>' + a.label + '</span></button>';
        }).join(' ') + '</td>'
      : '') + '</tr>';
  }).join('') + '</tbody>';
  return '<table class="data-table">' + thead + tbody + '</table>';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(amount) || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = String(dateStr).length > 10 ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('es-AR');
}

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

// Util: convertir cualquier enlace de Google Maps (My Maps, edit, coords) a URL embebible en iframe
function buildEmbedUrl(input) {
  const s = (input || '').trim();
  if (!s) return null;

  // My Maps: link de edición o viewer -> pasar a embed con el mid
  const myMaps = s.match(/maps\/d\/u\/(\d+)\/(edit|viewer|preview)\?([^#]+)/i);
  if (myMaps) {
    const params = myMaps[3];
    const midMatch = params.match(/([?&]|^)mid=([^&]+)/i);
    if (midMatch && midMatch[2]) {
      return 'https://www.google.com/maps/d/u/' + myMaps[1] + '/embed?mid=' + encodeURIComponent(midMatch[2]);
    }
    if (params.indexOf('mid=') !== -1) {
      const cleaned = params.split('&').filter(function(p) { return p.indexOf('mid=') === 0; }).join('&');
      return 'https://www.google.com/maps/d/u/' + myMaps[1] + '/embed?' + cleaned;
    }
  }
  if (/maps\/d\/u\/\d+\/embed/i.test(s)) return s;

  // Coordenadas "lat, lng" (validamos rango)
  const coordMatch = s.match(/(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return 'https://www.google.com/maps?q=' + lat + ',' + lng + '&z=13&output=embed';
    }
  }

  // Enlace ya válido de Google Maps -> intentar output=embed
  if (/google[\.]\w+\/maps/i.test(s)) {
    return s + (s.indexOf('?') !== -1 ? '&' : '?') + 'output=embed';
  }

  // Texto de zona / nombre -> buscar en Google Maps embebido
  return 'https://www.google.com/maps?q=' + encodeURIComponent(s) + '&output=embed';
}

// Etiquetas del flujo de trabajos
var JOB_STATUS_LABELS = {
  'pendiente': 'Tomado',
  'en-curso': 'En Ejecución',
  'completado': 'Completado',
  'listo-cobro': 'Listo para Cobrar',
  'pagado': 'Cobrado'
};

function jobStatusLabel(status) {
  return JOB_STATUS_LABELS[status] || (status ? String(status) : 'Tomado');
}

function jobStatusBadgeClass(status) {
  var map = {
    'pendiente': 'badge-pendiente',
    'en-curso': 'badge-encurso',
    'completado': 'badge-completado',
    'listo-cobro': 'badge-listo',
    'pagado': 'badge-pagado'
  };
  return map[status] || 'badge-pendiente';
}

function jobStatusBadge(status) {
  return '<span class="badge ' + jobStatusBadgeClass(status) + '">' + escapeHtml(jobStatusLabel(status)) + '</span>';
}

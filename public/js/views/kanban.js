// js/views/kanban.js - Tablero Post-Trabajo (pipeline hacia cobro)
// Tomado -> En Ejecución -> Completado -> Listo para Cobrar -> Cobrado

var kanbanInitialized = false;
var kanbanStore = null;

function initKanbanView(store) {
  if (kanbanInitialized) return;
  kanbanInitialized = true;
  kanbanStore = store;

  document.getElementById('kanban-board').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-kb-action]');
    if (!btn) return;
    var id = btn.dataset.id;
    var job = store.getJobs().find(function(j) { return String(j.id) === String(id); });
    if (!job) return;

    if (btn.dataset.kbAction === 'detail') {
      openJobDetail(store, id);
      return;
    }
    var idx = jobFlowIndex(job.status);
    if (btn.dataset.kbAction === 'next' && idx < JOB_FLOW.length - 1) {
      store.updateJob(Object.assign({}, job, { status: JOB_FLOW[idx + 1] }));
      toast('Trabajo movido a: ' + jobStatusLabel(JOB_FLOW[idx + 1]), 'success');
    } else if (btn.dataset.kbAction === 'prev' && idx > 0) {
      store.updateJob(Object.assign({}, job, { status: JOB_FLOW[idx - 1] }));
      toast('Trabajo devuelto a: ' + jobStatusLabel(JOB_FLOW[idx - 1]), 'info');
    }
  });

  store.subscribe(renderKanban);
}

function renderKanban(data) {
  var wrap = document.getElementById('kanban-board');
  if (!wrap) return;
  var clients = (data && data.clients) || [];
  var jobs = (data && data.jobs) || [];

  function clientOf(id) {
    var c = clients.find(function(cl) { return String(cl.id) === String(id); });
    return c ? c.name : 'Cliente eliminado';
  }

  wrap.innerHTML = JOB_FLOW.map(function(status) {
    var colJobs = jobs.filter(function(j) { return j.status === status; })
      .slice()
      .sort(function(a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });

    var cards = colJobs.map(function(j) {
      var idx = JOB_FLOW.indexOf(status);
      var canPrev = idx > 0;
      var canNext = idx < JOB_FLOW.length - 1;
      var hasMissing = j.faltante && String(j.faltante).trim().length > 0;
      var missingBadge = hasMissing
        ? '<span class="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-full px-1.5 py-0.5"><i class="fa-solid fa-triangle-exclamation mr-0.5"></i>Faltó algo</span>'
        : '';
      var checkBadge = j.completado
        ? '<span class="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 rounded-full px-1.5 py-0.5"><i class="fa-solid fa-check mr-0.5"></i>Hecho</span>'
        : '';
      return '' +
        '<div class="kanban-card">' +
          '<div class="kanban-card-title">' + escapeHtml(j.description || 'Sin descripción') + '</div>' +
          '<div class="kanban-card-sub mt-1"><i class="fa-solid fa-user mr-1"></i>' + escapeHtml(clientOf(j.clientId)) + ' · <i class="fa-regular fa-calendar mr-1"></i>' + escapeHtml(formatDate(j.date)) + '</div>' +
          '<div class="flex items-center justify-between gap-2 mt-1">' +
            '<span class="kanban-card-amount">' + escapeHtml(formatCurrency(j.amount)) + '</span>' +
            '<span class="flex gap-1 flex-wrap justify-end">' + checkBadge + missingBadge + '</span>' +
          '</div>' +
          '<div class="kanban-card-foot">' +
            '<button type="button" class="kanban-move" data-kb-action="prev" data-id="' + escapeHtml(j.id) + '" ' + (canPrev ? '' : 'disabled') + ' title="Etapa anterior"><i class="fa-solid fa-chevron-left"></i></button>' +
            '<button type="button" class="kanban-move" data-kb-action="detail" data-id="' + escapeHtml(j.id) + '" title="Ver detalle / editar"><i class="fa-solid fa-eye"></i></button>' +
            '<button type="button" class="kanban-move" data-kb-action="next" data-id="' + escapeHtml(j.id) + '" ' + (canNext ? '' : 'disabled') + ' title="Siguiente etapa"><i class="fa-solid fa-chevron-right"></i></button>' +
          '</div>' +
        '</div>';
    }).join('');

    var body = cards || '<div class="text-xs text-slate-400 text-center py-6"><i class="fa-solid fa-inbox block text-lg mb-1"></i>Sin trabajos</div>';
    return '' +
      '<div class="kanban-col">' +
        '<div class="kanban-col-header kanban-head-' + status + '"><span>' + escapeHtml(jobStatusLabel(status)) + '</span><span class="count">' + colJobs.length + '</span></div>' +
        '<div class="kanban-body">' + body + '</div>' +
      '</div>';
  }).join('');
}

// js/app.js - inicialización y navegación entre vistas

var store = new Store();
var currentView = 'dashboard';

// Mostrar vista
function showView(viewName) {
  // Ocultar todas las vistas
  document.querySelectorAll('.view-section').forEach(function(s) { s.classList.add('hidden'); });

  var view = document.getElementById('view-' + viewName);
  if (view) view.classList.remove('hidden');

  // Actualizar nav
  document.querySelectorAll('.nav-link').forEach(function(l) {
    l.classList.remove('text-blue-700', 'font-semibold');
  });
  var activeLink = document.querySelector('.nav-link[data-view="' + viewName + '"]');
  if (activeLink) activeLink.classList.add('text-blue-700', 'font-semibold');

  currentView = viewName;

  if (viewName === 'clients') initClientsView(store);
  else if (viewName === 'jobs') initJobsView(store);
  else if (viewName === 'account') initAccountView(store);
  else renderDashboard();
}

function renderDashboard() {
  var data = store.getData();
  var clientsCount = (data.clients || []).length;
  var jobsCount = (data.jobs || []).length;
  var totalDebito = (data.jobs || []).reduce(function(s, j) { return s + (parseFloat(j.amount) || 0); }, 0);
  var totalCredito = (data.payments || []).reduce(function(s, p) { return s + (parseFloat(p.amount) || 0); }, 0);
  var saldo = totalDebito - totalCredito;

  if (document.getElementById('stat-clients')) document.getElementById('stat-clients').textContent = clientsCount;
  if (document.getElementById('stat-jobs')) document.getElementById('stat-jobs').textContent = jobsCount;
  if (document.getElementById('stat-saldo')) document.getElementById('stat-saldo').textContent = formatCurrency(saldo);
}

function handleRoute() {
  var hash = window.location.hash.slice(2) || 'dashboard';
  showView(hash);
}

window.addEventListener('hashchange', handleRoute);

window.addEventListener('DOMContentLoaded', function() {
  // Inicializar vistas con un pequeño delay para que el DMContent sea listo
  setTimeout(function() {
    // Botones de navegación
    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.hash = '/' + this.dataset.view;
      });
    });

    // Cerrar modales (genérico)
    document.querySelectorAll('[data-close-modal]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        closeModal(this.dataset.closeModal);
      });
    });

    // Router
    handleRoute();
  }, 100);
});

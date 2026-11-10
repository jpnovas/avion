// js/store.js - persistencia local usando localStorage

class Store {
  constructor() {
    this._data = { clients: [], jobs: [], payments: [] };
    this._listeners = [];
    this._load();
  }

  _load() {
    this._data.clients = this._parse('clients');
    this._data.jobs = this._parse('jobs');
    this._data.payments = this._parse('payments');
    // Sembrar datos de ejemplo si no hay nada
    if (this._data.clients.length === 0) {
      this._data.clients = [
        { id: '1', name: 'Agropecuaria El Porvenir S.A.', cuit: '20-12345678-9', phone: '351-1234567', city: 'Córdoba', contact: 'Juan Pérez', createdAt: new Date().toISOString() },
        { id: '2', name: 'Campos del Sur', cuit: '20-98765432-1', phone: '354-9876543', city: 'Villa María', contact: 'María Gómez', createdAt: new Date().toISOString() }
      ];
      this._data.jobs = [
        { id: '101', clientId: '1', date: '2026-03-10', description: 'Aeroaplicación de herbicida - Lote Norte', amount: 45000, status: 'pendiente', createdAt: new Date().toISOString() },
        { id: '102', clientId: '2', date: '2026-03-15', description: 'Fertilización foliar - Lote Centro', amount: 38000, status: 'pagado', createdAt: new Date().toISOString() }
      ];
      this._data.payments = [
        { id: '201', clientId: '2', jobId: '102', amount: 38000, date: '2026-03-20', createdAt: new Date().toISOString() }
      ];
      this._save();
    }
  }

  _parse(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  }

  _save() {
    localStorage.setItem('clients', JSON.stringify(this._data.clients));
    localStorage.setItem('jobs', JSON.stringify(this._data.jobs));
    localStorage.setItem('payments', JSON.stringify(this._data.payments));
  }

  subscribe(cb) {
    this._listeners.push(cb);
    cb(this._data);
  }

  _notify() {
    this._listeners.forEach(function(cb) { cb(this._data); });
  }

  getData() { return this._data; }
  getClients() { return this._data.clients; }
  getJobs() { return this._data.jobs; }
  getPayments() { return this._data.payments; }

  addClient(client) {
    const newClient = Object.assign({}, client, { id: Date.now().toString(), createdAt: new Date().toISOString() });
    this._data.clients.push(newClient);
    this._save();
    this._notify();
    return newClient;
  }

  updateClient(client) {
    this._data.clients = this._data.clients.map(function(c) { return c.id === client.id ? Object.assign({}, c, client) : c; });
    this._save();
    this._notify();
  }

  deleteClient(id) {
    this._data.clients = this._data.clients.filter(function(c) { return c.id !== id; });
    this._data.jobs = this._data.jobs.filter(function(j) { return j.clientId !== id; });
    this._data.payments = this._data.payments.filter(function(p) { return p.clientId !== id; });
    this._save();
    this._notify();
  }

  addJob(job) {
    const newJob = Object.assign({}, job, { id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'pendiente' });
    this._data.jobs.push(newJob);
    this._save();
    this._notify();
    return newJob;
  }

  updateJob(job) {
    this._data.jobs = this._data.jobs.map(function(j) { return j.id === job.id ? Object.assign({}, j, job) : j; });
    this._save();
    this._notify();
  }

  deleteJob(id) {
    this._data.jobs = this._data.jobs.filter(function(j) { return j.id !== id; });
    this._data.payments = this._data.payments.filter(function(p) { return p.jobId !== id; });
    this._save();
    this._notify();
  }

  addPayment(payment) {
    const newPayment = Object.assign({}, payment, { id: Date.now().toString(), createdAt: new Date().toISOString() });
    this._data.payments.push(newPayment);
    this._save();
    this._notify();
    return newPayment;
  }

  deletePayment(id) {
    this._data.payments = this._data.payments.filter(function(p) { return p.id !== id; });
    this._save();
    this._notify();
  }

  getAccount(clientId) {
    const jobs = this._data.jobs.filter(function(j) { return j.clientId === clientId; });
    const payments = this._data.payments.filter(function(p) { return p.clientId === clientId; });
    const totalDebito = jobs.reduce(function(s, j) { return s + (parseFloat(j.amount) || 0); }, 0);
    const totalCredito = payments.reduce(function(s, p) { return s + (parseFloat(p.amount) || 0); }, 0);
    return { clientId: clientId, totalDebito: totalDebito, totalCredito: totalCredito, saldo: totalDebito - totalCredito, jobs: jobs, payments: payments };
  }
}

window.Store = Store;

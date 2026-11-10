const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Leer base de datos JSON
function readDb() {
  if (!fs.existsSync(DB_FILE)) return { clients: [], jobs: [], payments: [] };
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(raw);
}

// Escribir base de datos JSON
function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ---------- Rutas API ----------

// Clientes
app.get('/api/clients', (req, res) => {
  res.json(readDb().clients);
});

app.post('/api/clients', (req, res) => {
  const db = readDb();
  const client = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...req.body };
  db.clients.push(client);
  writeDb(db);
  res.status(201).json(client);
});

app.put('/api/clients/:id', (req, res) => {
  const db = readDb();
  const idx = db.clients.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Cliente no encontrado' });
  db.clients[idx] = { ...db.clients[idx], ...req.body, id: req.params.id };
  writeDb(db);
  res.json(db.clients[idx]);
});

app.delete('/api/clients/:id', (req, res) => {
  const db = readDb();
  db.clients = db.clients.filter(c => c.id !== req.params.id);
  // También eliminar trabajos y pagos asociados
  db.jobs = db.jobs.filter(j => j.clientId !== req.params.id);
  db.payments = db.payments.filter(p => p.clientId !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
});

// Trabajos (Carga de Trabajos / Aeroaplicaciones)
app.get('/api/jobs', (req, res) => {
  const db = readDb();
  let jobs = db.jobs;
  if (req.query.clientId) jobs = jobs.filter(j => j.clientId === req.query.clientId);
  res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
  const db = readDb();
  const job = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: 'pendiente',
    amount: 0,
    ...req.body
  };
  db.jobs.push(job);
  writeDb(db);
  res.status(201).json(job);
});

app.put('/api/jobs/:id', (req, res) => {
  const db = readDb();
  const idx = db.jobs.findIndex(j => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trabajo no encontrado' });
  db.jobs[idx] = { ...db.jobs[idx], ...req.body, id: req.params.id };
  writeDb(db);
  res.json(db.jobs[idx]);
});

app.delete('/api/jobs/:id', (req, res) => {
  const db = readDb();
  db.jobs = db.jobs.filter(j => j.id !== req.params.id);
  db.payments = db.payments.filter(p => p.jobId !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
});

// Pagos (Cuenta Corriente)
app.get('/api/payments', (req, res) => {
  const db = readDb();
  let payments = db.payments;
  if (req.query.clientId) payments = payments.filter(p => p.clientId === req.query.clientId);
  if (req.query.jobId) payments = payments.filter(p => p.jobId === req.query.jobId);
  res.json(payments);
});

app.post('/api/payments', (req, res) => {
  const db = readDb();
  const payment = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  db.payments.push(payment);
  writeDb(db);
  res.status(201).json(payment);
});

app.delete('/api/payments/:id', (req, res) => {
  const db = readDb();
  db.payments = db.payments.filter(p => p.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
});

// Resumen de cuenta corriente por cliente
app.get('/api/account/:clientId', (req, res) => {
  const db = readDb();
  const clientId = req.params.clientId;
  const jobs = db.jobs.filter(j => j.clientId === clientId);
  const payments = db.payments.filter(p => p.clientId === clientId);

  const totalDebito = jobs.reduce((sum, j) => sum + (parseFloat(j.amount) || 0), 0);
  const totalCredito = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const saldo = totalDebito - totalCredito;

  res.json({
    clientId,
    totalDebito,
    totalCredito,
    saldo,
    jobs,
    payments
  });
});

// ---------- Servir archivos estáticos ----------
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor Avion corriendo en http://localhost:${PORT}`);
  console.log(`Base de datos: ${DB_FILE}`);
});

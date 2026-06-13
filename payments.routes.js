const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const clientsAgentsRoutes = require('./routes/clientsAgents.routes');
const suppliersRoutes = require('./routes/suppliers.routes');
const reservationsRoutes = require('./routes/reservations.routes');
const paymentsRoutes = require('./routes/payments.routes');
const paymentRequestsRoutes = require('./routes/paymentRequests.routes');
const reportsRoutes = require('./routes/reports.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/clients-agents', clientsAgentsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/payment-requests', paymentRequestsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

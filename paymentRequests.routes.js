const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth.middleware');
const requirePermission = require('../middleware/permission.middleware');

const router = express.Router();
router.use(auth);

// GET /api/clients-agents?type=agent&search=...
router.get('/', requirePermission('clients_agents', 'view'), async (req, res) => {
  const { type, search } = req.query;
  const conditions = [];
  const params = [];

  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(`SELECT * FROM clients_agents ${where} ORDER BY name`, params);
  res.json(result.rows);
});

// GET /api/clients-agents/:id
router.get('/:id', requirePermission('clients_agents', 'view'), async (req, res) => {
  const result = await pool.query('SELECT * FROM clients_agents WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// POST /api/clients-agents
router.post('/', requirePermission('clients_agents', 'create'), async (req, res) => {
  const { type, name, contact_person, email, phone, address, currency, credit_terms_days, commission_percent, notes } = req.body;

  if (!type || !name) {
    return res.status(400).json({ error: 'type and name are required' });
  }

  const result = await pool.query(
    `INSERT INTO clients_agents
      (type, name, contact_person, email, phone, address, currency, credit_terms_days, commission_percent, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [type, name, contact_person, email, phone, address, currency || 'USD', credit_terms_days || 0, commission_percent || 0, notes]
  );

  res.status(201).json(result.rows[0]);
});

// PUT /api/clients-agents/:id
router.put('/:id', requirePermission('clients_agents', 'edit'), async (req, res) => {
  const { type, name, contact_person, email, phone, address, currency, credit_terms_days, commission_percent, status, notes } = req.body;

  const result = await pool.query(
    `UPDATE clients_agents SET
       type = COALESCE($1, type),
       name = COALESCE($2, name),
       contact_person = $3,
       email = $4,
       phone = $5,
       address = $6,
       currency = COALESCE($7, currency),
       credit_terms_days = COALESCE($8, credit_terms_days),
       commission_percent = COALESCE($9, commission_percent),
       status = COALESCE($10, status),
       notes = $11
     WHERE id = $12 RETURNING *`,
    [type, name, contact_person, email, phone, address, currency, credit_terms_days, commission_percent, status, notes, req.params.id]
  );

  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// DELETE /api/clients-agents/:id
router.delete('/:id', requirePermission('clients_agents', 'delete'), async (req, res) => {
  await pool.query('UPDATE clients_agents SET status = $1 WHERE id = $2', ['inactive', req.params.id]);
  res.json({ success: true });
});

module.exports = router;

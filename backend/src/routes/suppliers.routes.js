const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth.middleware');
const requirePermission = require('../middleware/permission.middleware');

const router = express.Router();
router.use(auth);

// GET /api/suppliers?type=hotel&search=...
router.get('/', requirePermission('suppliers', 'view'), async (req, res) => {
  const { type, search } = req.query;
  const conditions = [];
  const params = [];

  if (type) {
    params.push(type);
    conditions.push(`supplier_type = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(`SELECT * FROM suppliers ${where} ORDER BY name`, params);
  res.json(result.rows);
});

// GET /api/suppliers/:id
router.get('/:id', requirePermission('suppliers', 'view'), async (req, res) => {
  const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// POST /api/suppliers
router.post('/', requirePermission('suppliers', 'create'), async (req, res) => {
  const { name, supplier_type, contact_person, email, phone, address, currency, payment_terms_days, bank_details, notes } = req.body;

  if (!name || !supplier_type) {
    return res.status(400).json({ error: 'name and supplier_type are required' });
  }

  const result = await pool.query(
    `INSERT INTO suppliers
      (name, supplier_type, contact_person, email, phone, address, currency, payment_terms_days, bank_details, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [name, supplier_type, contact_person, email, phone, address, currency || 'USD', payment_terms_days || 0, bank_details, notes]
  );

  res.status(201).json(result.rows[0]);
});

// PUT /api/suppliers/:id
router.put('/:id', requirePermission('suppliers', 'edit'), async (req, res) => {
  const { name, supplier_type, contact_person, email, phone, address, currency, payment_terms_days, bank_details, status, notes } = req.body;

  const result = await pool.query(
    `UPDATE suppliers SET
       name = COALESCE($1, name),
       supplier_type = COALESCE($2, supplier_type),
       contact_person = $3,
       email = $4,
       phone = $5,
       address = $6,
       currency = COALESCE($7, currency),
       payment_terms_days = COALESCE($8, payment_terms_days),
       bank_details = $9,
       status = COALESCE($10, status),
       notes = $11
     WHERE id = $12 RETURNING *`,
    [name, supplier_type, contact_person, email, phone, address, currency, payment_terms_days, bank_details, status, notes, req.params.id]
  );

  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// DELETE /api/suppliers/:id
router.delete('/:id', requirePermission('suppliers', 'delete'), async (req, res) => {
  await pool.query('UPDATE suppliers SET status = $1 WHERE id = $2', ['inactive', req.params.id]);
  res.json({ success: true });
});

module.exports = router;

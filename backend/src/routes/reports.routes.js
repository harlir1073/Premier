const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth.middleware');
const requirePermission = require('../middleware/permission.middleware');

const router = express.Router();
router.use(auth);
router.use(requirePermission('reports', 'view'));

// GET /api/reports/outstanding-agent-payments
// Money owed TO us by clients/agents (unpaid agent_price)
router.get('/outstanding-agent-payments', async (req, res) => {
  const result = await pool.query(`
    SELECT r.booking_reference, r.lead_passenger_name, ca.name AS agent_name,
           ri.id AS item_id, ri.product_type, ri.description,
           ri.agent_price, ri.agent_currency, ri.agent_payment_due_date, ri.agent_payment_status
    FROM reservation_items ri
    JOIN reservations r ON r.id = ri.reservation_id
    LEFT JOIN clients_agents ca ON ca.id = r.agent_id
    WHERE ri.agent_payment_status != 'paid'
    ORDER BY ri.agent_payment_due_date NULLS LAST
  `);
  res.json(result.rows);
});

// GET /api/reports/outstanding-supplier-payments
// Money we owe TO suppliers (unpaid supplier_price)
router.get('/outstanding-supplier-payments', async (req, res) => {
  const result = await pool.query(`
    SELECT r.booking_reference, r.lead_passenger_name, s.name AS supplier_name,
           ri.id AS item_id, ri.product_type, ri.description,
           ri.supplier_price, ri.supplier_currency, ri.supplier_payment_due_date, ri.supplier_payment_status
    FROM reservation_items ri
    JOIN reservations r ON r.id = ri.reservation_id
    LEFT JOIN suppliers s ON s.id = ri.supplier_id
    WHERE ri.supplier_payment_status != 'paid'
    ORDER BY ri.supplier_payment_due_date NULLS LAST
  `);
  res.json(result.rows);
});

// GET /api/reports/profit-summary?date_from=&date_to=&agent_id=
router.get('/profit-summary', async (req, res) => {
  const { date_from, date_to, agent_id } = req.query;
  const conditions = [];
  const params = [];

  if (date_from) {
    params.push(date_from);
    conditions.push(`ri.start_date >= $${params.length}`);
  }
  if (date_to) {
    params.push(date_to);
    conditions.push(`ri.start_date <= $${params.length}`);
  }
  if (agent_id) {
    params.push(agent_id);
    conditions.push(`r.agent_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(`
    SELECT r.booking_reference, ca.name AS agent_name, ri.product_type, ri.description,
           ri.start_date, ri.agent_price, ri.supplier_price,
           (ri.agent_price - ri.supplier_price) AS margin
    FROM reservation_items ri
    JOIN reservations r ON r.id = ri.reservation_id
    LEFT JOIN clients_agents ca ON ca.id = r.agent_id
    ${where}
    ORDER BY ri.start_date DESC
  `, params);

  const totals = result.rows.reduce((acc, row) => {
    acc.agent_total += parseFloat(row.agent_price);
    acc.supplier_total += parseFloat(row.supplier_price);
    acc.margin_total += parseFloat(row.margin);
    return acc;
  }, { agent_total: 0, supplier_total: 0, margin_total: 0 });

  res.json({ rows: result.rows, totals });
});

module.exports = router;

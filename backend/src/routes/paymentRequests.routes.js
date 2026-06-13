const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth.middleware');
const requirePermission = require('../middleware/permission.middleware');

const router = express.Router();
router.use(auth);

async function generateRequestNumber() {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) FROM payment_requests WHERE request_number LIKE $1`,
    [`PR-${year}-%`]
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `PR-${year}-${String(seq).padStart(5, '0')}`;
}

// GET /api/payment-requests?agent_id=&status=
router.get('/', requirePermission('payment_requests', 'view'), async (req, res) => {
  const { agent_id, status } = req.query;
  const conditions = [];
  const params = [];

  if (agent_id) {
    params.push(agent_id);
    conditions.push(`pr.agent_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`pr.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT pr.*, ca.name AS agent_name FROM payment_requests pr
     LEFT JOIN clients_agents ca ON ca.id = pr.agent_id
     ${where} ORDER BY pr.created_at DESC`,
    params
  );
  res.json(result.rows);
});

// GET /api/payment-requests/:id  (includes line items)
router.get('/:id', requirePermission('payment_requests', 'view'), async (req, res) => {
  const pr = await pool.query(
    `SELECT pr.*, ca.name AS agent_name FROM payment_requests pr
     LEFT JOIN clients_agents ca ON ca.id = pr.agent_id
     WHERE pr.id = $1`,
    [req.params.id]
  );
  if (!pr.rows[0]) return res.status(404).json({ error: 'Not found' });

  const items = await pool.query(
    `SELECT pri.*, ri.description, ri.product_type, r.booking_reference
     FROM payment_request_items pri
     JOIN reservation_items ri ON ri.id = pri.reservation_item_id
     JOIN reservations r ON r.id = ri.reservation_id
     WHERE pri.payment_request_id = $1`,
    [req.params.id]
  );

  res.json({ ...pr.rows[0], items: items.rows });
});

// POST /api/payment-requests
// Body: { agent_id, due_date, reservation_item_ids: [..] }
// Generates a payment request bundling the agent_price of selected unpaid items.
router.post('/', requirePermission('payment_requests', 'create'), async (req, res) => {
  const { agent_id, due_date, reservation_item_ids } = req.body;

  if (!agent_id || !Array.isArray(reservation_item_ids) || reservation_item_ids.length === 0) {
    return res.status(400).json({ error: 'agent_id and reservation_item_ids[] are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch the items to be billed, ensuring they belong to this agent and are unpaid
    const itemsResult = await client.query(
      `SELECT ri.id, ri.agent_price, ri.agent_currency
       FROM reservation_items ri
       JOIN reservations r ON r.id = ri.reservation_id
       WHERE ri.id = ANY($1) AND r.agent_id = $2 AND ri.agent_payment_status != 'paid'`,
      [reservation_item_ids, agent_id]
    );

    if (itemsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No matching unpaid items found for this agent' });
    }

    const currency = itemsResult.rows[0].agent_currency || 'USD';
    const total = itemsResult.rows.reduce((sum, r) => sum + parseFloat(r.agent_price), 0);
    const request_number = await generateRequestNumber();

    const pr = await client.query(
      `INSERT INTO payment_requests (agent_id, request_number, total_amount, currency, due_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [agent_id, request_number, total, currency, due_date, req.user.id]
    );

    for (const row of itemsResult.rows) {
      await client.query(
        `INSERT INTO payment_request_items (payment_request_id, reservation_item_id, amount)
         VALUES ($1,$2,$3)`,
        [pr.rows[0].id, row.id, row.agent_price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(pr.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment request' });
  } finally {
    client.release();
  }
});

// PUT /api/payment-requests/:id/status
router.put('/:id/status', requirePermission('payment_requests', 'approve'), async (req, res) => {
  const { status } = req.body;
  if (!['draft', 'sent', 'paid', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = await pool.query(
    `UPDATE payment_requests SET status = $1 WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );

  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

module.exports = router;

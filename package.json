const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth.middleware');
const requirePermission = require('../middleware/permission.middleware');

const router = express.Router();
router.use(auth);

// GET /api/payments?reservation_item_id=
router.get('/', requirePermission('payments', 'view'), async (req, res) => {
  const { reservation_item_id } = req.query;
  const conditions = [];
  const params = [];

  if (reservation_item_id) {
    params.push(reservation_item_id);
    conditions.push(`reservation_item_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(`SELECT * FROM payments ${where} ORDER BY payment_date DESC`, params);
  res.json(result.rows);
});

// POST /api/payments
// direction: 'incoming' (from agent) or 'outgoing' (to supplier)
// Automatically updates the related reservation_item's payment status/date.
router.post('/', requirePermission('payments', 'create'), async (req, res) => {
  const { reservation_item_id, direction, amount, currency, payment_date, method, reference } = req.body;

  if (!reservation_item_id || !direction || !amount || !payment_date) {
    return res.status(400).json({ error: 'reservation_item_id, direction, amount and payment_date are required' });
  }
  if (!['incoming', 'outgoing'].includes(direction)) {
    return res.status(400).json({ error: "direction must be 'incoming' or 'outgoing'" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const payment = await client.query(
      `INSERT INTO payments (reservation_item_id, direction, amount, currency, payment_date, method, reference, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [reservation_item_id, direction, amount, currency || 'USD', payment_date, method, reference, req.user.id]
    );

    if (direction === 'incoming') {
      await client.query(
        `UPDATE reservation_items SET agent_payment_status = 'paid', agent_paid_date = $1 WHERE id = $2`,
        [payment_date, reservation_item_id]
      );
    } else {
      await client.query(
        `UPDATE reservation_items SET supplier_payment_status = 'paid', supplier_paid_date = $1 WHERE id = $2`,
        [payment_date, reservation_item_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(payment.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to record payment' });
  } finally {
    client.release();
  }
});

module.exports = router;

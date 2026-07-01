const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth.middleware');
const requirePermission = require('../middleware/permission.middleware');

const router = express.Router();
router.use(auth);

// Helper: generate a booking reference like BR-2026-000123
async function generateBookingReference() {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) FROM reservations WHERE booking_reference LIKE $1`,
    [`BR-${year}-%`]
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `BR-${year}-${String(seq).padStart(6, '0')}`;
}

// GET /api/reservations?status=&agent_id=&date_from=&date_to=
router.get('/', requirePermission('reservations', 'view'), async (req, res) => {
  const { status, agent_id, date_from, date_to } = req.query;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`r.status = $${params.length}`);
  }
  if (agent_id) {
    params.push(agent_id);
    conditions.push(`r.agent_id = $${params.length}`);
  }
  if (date_from) {
    params.push(date_from);
    conditions.push(`r.created_at >= $${params.length}`);
  }
  if (date_to) {
    params.push(date_to);
    conditions.push(`r.created_at <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT r.*, ca.name AS agent_name
     FROM reservations r
     LEFT JOIN clients_agents ca ON ca.id = r.agent_id
     ${where}
     ORDER BY r.created_at DESC`,
    params
  );
  res.json(result.rows);
});

// PUT /api/reservations/items/:id  (update a line item, incl. payment status/dates)
// NOTE: defined before /:id so "items" isn't captured as a reservation id
router.put('/items/:id', requirePermission('reservations', 'edit'), async (req, res) => {
  const f = req.body;

  const result = await pool.query(
    `UPDATE reservation_items SET
        product_type               = COALESCE($1, product_type),
        supplier_id                = $2,
        description                = $3,
        start_date                 = $4,
        end_date                   = $5,
        agent_price                = COALESCE($6, agent_price),
        agent_currency             = COALESCE($7, agent_currency),
        agent_payment_due_date     = $8,
        agent_payment_status       = COALESCE($9, agent_payment_status),
        agent_paid_date            = $10,
        supplier_price             = COALESCE($11, supplier_price),
        supplier_currency          = COALESCE($12, supplier_currency),
        supplier_payment_due_date  = $13,
        supplier_payment_status    = COALESCE($14, supplier_payment_status),
        supplier_paid_date         = $15,
        status                     = COALESCE($16, status),
        booking_item_reference     = $17,
        supplier_ref               = $18,
        agency_reference           = $19,
        source                     = $20,
        platform                   = $21,
        inventory_type             = $22,
        availability               = $23,
        cancellation_deadline      = $24,
        city                       = $25,
        service_name               = $26,
        hotel_confirmation         = $27,
        remarks                    = $28,
        agent_profile              = $29,
        supplier_prepayment        = $30,
        agent_prepayment           = $31,
        passenger_name             = $32
     WHERE id = $33 RETURNING *`,
    [
      f.product_type, f.supplier_id, f.description, f.start_date, f.end_date,
      f.agent_price, f.agent_currency, f.agent_payment_due_date,
      f.agent_payment_status, f.agent_paid_date,
      f.supplier_price, f.supplier_currency, f.supplier_payment_due_date,
      f.supplier_payment_status, f.supplier_paid_date,
      f.status,
      f.booking_item_reference, f.supplier_ref, f.agency_reference,
      f.source, f.platform, f.inventory_type, f.availability,
      f.cancellation_deadline, f.city, f.service_name, f.hotel_confirmation,
      f.remarks, f.agent_profile, f.supplier_prepayment, f.agent_prepayment,
      f.passenger_name,
      req.params.id
    ]
  );

  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// GET /api/reservations/:id  (includes items)
router.get('/:id', requirePermission('reservations', 'view'), async (req, res) => {
  const resv = await pool.query(
    `SELECT r.*, ca.name AS agent_name FROM reservations r
     LEFT JOIN clients_agents ca ON ca.id = r.agent_id
     WHERE r.id = $1`,
    [req.params.id]
  );
  if (!resv.rows[0]) return res.status(404).json({ error: 'Not found' });

  const items = await pool.query(
    `SELECT ri.*, s.name AS supplier_name FROM reservation_items ri
     LEFT JOIN suppliers s ON s.id = ri.supplier_id
     WHERE ri.reservation_id = $1
     ORDER BY ri.start_date`,
    [req.params.id]
  );

  res.json({ ...resv.rows[0], items: items.rows });
});

// POST /api/reservations  (create reservation + optional items array)
router.post('/', requirePermission('reservations', 'create'), async (req, res) => {
  const { agent_id, lead_passenger_name, passenger_count, notes, items } = req.body;

  if (!lead_passenger_name) {
    return res.status(400).json({ error: 'lead_passenger_name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const booking_reference = await generateBookingReference();

    const resv = await client.query(
      `INSERT INTO reservations (booking_reference, agent_id, lead_passenger_name, passenger_count, created_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [booking_reference, agent_id, lead_passenger_name, passenger_count || 1, req.user.id, notes]
    );

    const reservation = resv.rows[0];
    const insertedItems = [];

    if (Array.isArray(items)) {
      for (const item of items) {
        const itemResult = await client.query(
          `INSERT INTO reservation_items
            (reservation_id, product_type, supplier_id, description, start_date, end_date,
             agent_price, agent_currency, agent_payment_due_date,
             supplier_price, supplier_currency, supplier_payment_due_date,
             booking_item_reference, supplier_ref, agency_reference,
             source, platform, inventory_type, availability,
             cancellation_deadline, city, service_name, hotel_confirmation,
             remarks, agent_profile, supplier_prepayment, agent_prepayment,
             passenger_name)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
           RETURNING *`,
          [
            reservation.id,
            item.product_type, item.supplier_id, item.description,
            item.start_date, item.end_date,
            item.agent_price || 0, item.agent_currency || 'USD', item.agent_payment_due_date,
            item.supplier_price || 0, item.supplier_currency || 'USD', item.supplier_payment_due_date,
            item.booking_item_reference, item.supplier_ref, item.agency_reference,
            item.source, item.platform, item.inventory_type, item.availability,
            item.cancellation_deadline, item.city, item.service_name, item.hotel_confirmation,
            item.remarks, item.agent_profile, item.supplier_prepayment, item.agent_prepayment,
            item.passenger_name
          ]
        );
        insertedItems.push(itemResult.rows[0]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...reservation, items: insertedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create reservation' });
  } finally {
    client.release();
  }
});

// PUT /api/reservations/:id  (header fields only)
router.put('/:id', requirePermission('reservations', 'edit'), async (req, res) => {
  const { agent_id, lead_passenger_name, passenger_count, status, notes } = req.body;

  const result = await pool.query(
    `UPDATE reservations SET
        agent_id           = COALESCE($1, agent_id),
        lead_passenger_name = COALESCE($2, lead_passenger_name),
        passenger_count    = COALESCE($3, passenger_count),
        status             = COALESCE($4, status),
        notes              = $5,
        updated_at         = now()
     WHERE id = $6 RETURNING *`,
    [agent_id, lead_passenger_name, passenger_count, status, notes, req.params.id]
  );

  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// POST /api/reservations/:id/items  (add a line item)
router.post('/:id/items', requirePermission('reservations', 'edit'), async (req, res) => {
  const item = req.body;

  const result = await pool.query(
    `INSERT INTO reservation_items
      (reservation_id, product_type, supplier_id, description, start_date, end_date,
       agent_price, agent_currency, agent_payment_due_date,
       supplier_price, supplier_currency, supplier_payment_due_date,
       booking_item_reference, supplier_ref, agency_reference,
       source, platform, inventory_type, availability,
       cancellation_deadline, city, service_name, hotel_confirmation,
       remarks, agent_profile, supplier_prepayment, agent_prepayment,
       passenger_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
     RETURNING *`,
    [
      req.params.id,
      item.product_type, item.supplier_id, item.description,
      item.start_date, item.end_date,
      item.agent_price || 0, item.agent_currency || 'USD', item.agent_payment_due_date,
      item.supplier_price || 0, item.supplier_currency || 'USD', item.supplier_payment_due_date,
      item.booking_item_reference, item.supplier_ref, item.agency_reference,
      item.source, item.platform, item.inventory_type, item.availability,
      item.cancellation_deadline, item.city, item.service_name, item.hotel_confirmation,
      item.remarks, item.agent_profile, item.supplier_prepayment, item.agent_prepayment,
      item.passenger_name
    ]
  );

  res.status(201).json(result.rows[0]);
});

module.exports = router;
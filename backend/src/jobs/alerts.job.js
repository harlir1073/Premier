// Scheduled job: scans reservation_items for upcoming/overdue payment due dates
// and inserts rows into notifications for relevant users (Accountant/Admin roles).
// Run via cron, e.g.: 0 7 * * * node src/jobs/alerts.job.js
const pool = require('../config/db');

const LOOKAHEAD_DAYS = 3;

async function run() {
  const client = await pool.connect();
  try {
    // Recipients: all active Admin/Accountant users
    const recipients = await client.query(`
      SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
      WHERE r.name IN ('Admin','Accountant') AND u.status = 'active'
    `);

    // Agent payments due soon or overdue
    const agentDue = await client.query(`
      SELECT ri.id, ri.agent_payment_due_date, r.booking_reference
      FROM reservation_items ri
      JOIN reservations r ON r.id = ri.reservation_id
      WHERE ri.agent_payment_status != 'paid'
        AND ri.agent_payment_due_date IS NOT NULL
        AND ri.agent_payment_due_date <= CURRENT_DATE + INTERVAL '${LOOKAHEAD_DAYS} days'
    `);

    // Supplier payments due soon or overdue
    const supplierDue = await client.query(`
      SELECT ri.id, ri.supplier_payment_due_date, r.booking_reference
      FROM reservation_items ri
      JOIN reservations r ON r.id = ri.reservation_id
      WHERE ri.supplier_payment_status != 'paid'
        AND ri.supplier_payment_due_date IS NOT NULL
        AND ri.supplier_payment_due_date <= CURRENT_DATE + INTERVAL '${LOOKAHEAD_DAYS} days'
    `);

    for (const recipient of recipients.rows) {
      for (const row of agentDue.rows) {
        const severity = row.agent_payment_due_date < new Date().toISOString().slice(0,10) ? 'critical' : 'warning';
        await client.query(
          `INSERT INTO notifications (user_id, type, reference_table, reference_id, message, severity)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [recipient.id, 'agent_payment_due', 'reservation_items', row.id,
           `Agent payment for booking ${row.booking_reference} is due on ${row.agent_payment_due_date}`, severity]
        );
      }
      for (const row of supplierDue.rows) {
        const severity = row.supplier_payment_due_date < new Date().toISOString().slice(0,10) ? 'critical' : 'warning';
        await client.query(
          `INSERT INTO notifications (user_id, type, reference_table, reference_id, message, severity)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [recipient.id, 'supplier_payment_due', 'reservation_items', row.id,
           `Supplier payment for booking ${row.booking_reference} is due on ${row.supplier_payment_due_date}`, severity]
        );
      }
    }

    console.log(`Alerts job complete: ${agentDue.rows.length} agent + ${supplierDue.rows.length} supplier items flagged for ${recipients.rows.length} recipients.`);
  } catch (err) {
    console.error('Alerts job failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

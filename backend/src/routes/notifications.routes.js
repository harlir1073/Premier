const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth.middleware');

const router = express.Router();
router.use(auth);

// GET /api/notifications  (current user's notifications + broadcast ones)
router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json(result.rows);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

module.exports = router;

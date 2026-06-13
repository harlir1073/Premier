const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const auth = require('../middleware/auth.middleware');
const requirePermission = require('../middleware/permission.middleware');

const router = express.Router();
router.use(auth);

// GET /api/users
router.get('/', requirePermission('users', 'view'), async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.last_login, r.name AS role_name, u.role_id
     FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.full_name`
  );
  res.json(result.rows);
});

// GET /api/users/roles  (list roles for dropdowns)
router.get('/roles', requirePermission('users', 'view'), async (req, res) => {
  const result = await pool.query(`SELECT * FROM roles ORDER BY name`);
  res.json(result.rows);
});

// POST /api/users
router.post('/', requirePermission('users', 'create'), async (req, res) => {
  const { full_name, email, password, role_id } = req.body;
  if (!full_name || !email || !password || !role_id) {
    return res.status(400).json({ error: 'full_name, email, password and role_id are required' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id) VALUES ($1,$2,$3,$4)
       RETURNING id, full_name, email, role_id, status`,
      [full_name, email, password_hash, role_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id
router.put('/:id', requirePermission('users', 'edit'), async (req, res) => {
  const { full_name, role_id, status, password } = req.body;

  let password_hash = null;
  if (password) {
    password_hash = await bcrypt.hash(password, 10);
  }

  const result = await pool.query(
    `UPDATE users SET
       full_name = COALESCE($1, full_name),
       role_id = COALESCE($2, role_id),
       status = COALESCE($3, status),
       password_hash = COALESCE($4, password_hash)
     WHERE id = $5 RETURNING id, full_name, email, role_id, status`,
    [full_name, role_id, status, password_hash, req.params.id]
  );

  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

module.exports = router;

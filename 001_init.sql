const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userResult = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.status, u.role_id, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1`,
      [email]
    );

    const user = userResult.rows[0];
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Load permissions for this role
    const permsResult = await pool.query(
      `SELECT p.module, p.action FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [user.role_id]
    );
    const permissions = permsResult.rows.map(p => `${p.module}:${p.action}`);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
        role_name: user.role_name,
        permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await pool.query('UPDATE users SET last_login = now() WHERE id = $1', [user.id]);

    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role_name, permissions } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

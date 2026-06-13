// Usage: requirePermission('reservations', 'create')
// Expects req.user.permissions to be an array of "module:action" strings,
// populated at login time and embedded in the JWT.
function requirePermission(module, action) {
  return (req, res, next) => {
    const perms = req.user?.permissions || [];
    const key = `${module}:${action}`;

    if (!perms.includes(key)) {
      return res.status(403).json({ error: `Forbidden: missing permission ${key}` });
    }
    next();
  };
}

module.exports = requirePermission;

// Simple one-shot migration runner: executes migrations/*.sql in order.
// Usage: node src/utils/migrate.js
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function run() {
  const dir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
  }

  console.log('All migrations completed.');
  await pool.end();
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

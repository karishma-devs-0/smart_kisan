const { Pool, types } = require('pg');

// Force TIMESTAMP WITHOUT TIME ZONE values to be parsed as UTC. By default the
// pg client interprets them as the backend's local time, which causes every
// timestamp to shift by the local TZ offset (e.g. -5.5h on an IST machine
// against a Neon DB that stores UTC). The DB-side migrations use NOW() which
// is server-UTC, so appending 'Z' is the correct interpretation.
//   OID 1114 = TIMESTAMP WITHOUT TIME ZONE
//   OID 1184 = TIMESTAMP WITH TIME ZONE (already handled correctly)
types.setTypeParser(1114, (val) => (val ? new Date(val + 'Z') : null));

// SSL is required by hosted Postgres (Neon, Supabase, Railway). Local Docker
// Postgres doesn't run SSL, so we make it opt-in via DB_SSL=true in .env.
const useSsl = String(process.env.DB_SSL).toLowerCase() === 'true';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: useSsl ? { rejectUnauthorized: false } : false,

  // Neon's free tier caps concurrent connections, and the default pool size of
  // 10 plus a second instance during a rolling deploy is enough to hit it —
  // which surfaces as intermittent 500s rather than anything obviously
  // connection-related.
  max: Number(process.env.DB_POOL_MAX) || 5,

  // Neon closes idle connections on its side. Recycling before that happens
  // avoids handing a dead socket to a request.
  idleTimeoutMillis: 30000,

  // Fail a stuck connection attempt rather than letting the request hang until
  // the client times out.
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL Connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL Error:', err.message);
});

module.exports = pool;

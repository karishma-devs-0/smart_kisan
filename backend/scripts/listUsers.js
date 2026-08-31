/**
 * Lists accounts and how much data each holds. Read-only.
 *
 * Run this before deleting anything, so the decision is made against what is
 * actually there rather than an assumption.
 *
 *   node scripts/listUsers.js
 */
require('dotenv').config();
const pool = require('../src/config/database');

(async () => {
  const { rows } = await pool.query(`
    SELECT u.id, u.email, u.first_name, u.created_at,
           (SELECT COUNT(*) FROM fields        WHERE owner_id = u.id) AS fields,
           (SELECT COUNT(*) FROM crops         WHERE owner_id = u.id) AS crops,
           (SELECT COUNT(*) FROM pumps         WHERE owner_id = u.id) AS pumps,
           (SELECT COUNT(*) FROM devices       WHERE owner_id = u.id) AS devices,
           (SELECT COUNT(*) FROM soil_history  WHERE user_id  = u.id) AS readings,
           (SELECT COUNT(*) FROM user_profile  WHERE user_id  = u.id) AS onboarded
    FROM users u
    ORDER BY u.created_at DESC
  `);

  console.log(`\n  ${rows.length} accounts\n`);
  console.log('  ' + 'EMAIL'.padEnd(40) + 'CREATED'.padEnd(13) +
              'FLD CRP PMP DEV RDG ONB');
  console.log('  ' + '-'.repeat(78));

  for (const r of rows) {
    const created = new Date(r.created_at).toISOString().slice(0, 10);
    console.log(
      '  ' + String(r.email).slice(0, 38).padEnd(40) + created.padEnd(13) +
      String(r.fields).padEnd(4) + String(r.crops).padEnd(4) +
      String(r.pumps).padEnd(4) + String(r.devices).padEnd(4) +
      String(r.readings).padEnd(4) + r.onboarded
    );
  }

  console.log('\n  ids (for deleteUser.js):');
  rows.forEach((r) => console.log(`    ${r.email}  ->  ${r.id}`));
  console.log();
  await pool.end();
})().catch((e) => { console.error('  error:', e.message); process.exit(1); });

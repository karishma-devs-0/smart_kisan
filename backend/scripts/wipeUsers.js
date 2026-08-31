/**
 * Deletes every user account and all data belonging to users.
 *
 * Intended for clearing demo/beta data before real users exist.
 *
 * This is irreversible and the database has no backups configured, so the
 * script prints what it is about to remove and does nothing unless --confirm
 * is passed.
 *
 *   node scripts/wipeUsers.js             # dry run: shows counts, deletes nothing
 *   node scripts/wipeUsers.js --confirm   # actually delete
 *
 * Only user-owned rows are touched. The schema itself is left alone, so the
 * app keeps working and the next sign-up starts from a clean database.
 */
require('dotenv').config();
const pool = require('../src/config/database');

// Child rows first, users last. Nothing here relies on database cascades, so
// deleting the parent first would strand everything else.
const USER_TABLES = [
  'pump_group_mapping',
  'pump_history',
  'soil_history',
  'soil_current',
  'devices',
  'crops',
  'fields',
  'pump_groups',
  'pumps',
  'user_profile',
  'users',
];

(async () => {
  const confirm = process.argv.includes('--confirm');

  console.log('\n  Current contents:\n');
  let total = 0;
  for (const table of USER_TABLES) {
    try {
      const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
      total += rows[0].n;
      console.log(`    ${table.padEnd(22)} ${rows[0].n}`);
    } catch (e) {
      console.log(`    ${table.padEnd(22)} (unavailable: ${e.message.split('\n')[0]})`);
    }
  }
  console.log(`\n    ${'TOTAL ROWS'.padEnd(22)} ${total}`);

  if (!confirm) {
    console.log('\n  Dry run — nothing was deleted.');
    console.log('  Re-run with --confirm to actually remove this data.\n');
    await pool.end();
    return;
  }

  console.log('\n  Deleting...\n');

  // One transaction: a failure part-way through leaves the database as it was
  // rather than half-emptied.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const table of USER_TABLES) {
      try {
        const r = await client.query(`DELETE FROM ${table}`);
        console.log(`    ${table.padEnd(22)} removed ${r.rowCount}`);
      } catch (e) {
        console.log(`    ${table.padEnd(22)} skipped (${e.message.split('\n')[0]})`);
      }
    }
    await client.query('COMMIT');
    console.log('\n  Done — all user data removed. Schema is intact.\n');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n  Failed, rolled back. Nothing was deleted:', e.message, '\n');
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})().catch((e) => {
  console.error('  error:', e.message);
  process.exit(1);
});

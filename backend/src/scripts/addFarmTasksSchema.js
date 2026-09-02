require('dotenv').config();

const db = require('../config/db');

/**
 * Storage for farm tasks.
 *
 * The farm management screen has always shown a fixed list of sample tasks,
 * because there was nowhere to keep real ones: no table, no endpoints. Marking
 * a task done changed local state only and was forgotten on the next launch,
 * and "Add Task" opened an alert saying nothing.
 *
 * field_id is a soft reference rather than a foreign key, matching how crops
 * relate to fields elsewhere in this schema: a field can be deleted while
 * tasks that mention it remain readable. field_name is stored alongside so the
 * task still reads sensibly if the field is gone.
 *
 * Idempotent; safe to re-run.
 */
async function addFarmTasksSchema() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS farm_tasks (
        id VARCHAR(100) PRIMARY KEY,
        owner_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date TIMESTAMP,
        field_id VARCHAR(100),
        field_name VARCHAR(255),
        assignee VARCHAR(255),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // The screen lists a farmer's own tasks newest first, and filters by
    // status. Both are covered by one index.
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_farm_tasks_owner
        ON farm_tasks (owner_id, status, due_date)
    `);

    console.log('✅ farm_tasks table ready');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addFarmTasksSchema();

const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { nanoid } = require('nanoid');
const { str, handle } = require('../middleware/validate');

/**
 * Farm tasks.
 *
 * The farm management screen previously showed a fixed sample list with no
 * storage behind it, which is what testers reported as dummy data. These are
 * the endpoints it now reads and writes.
 */

const CATEGORIES = [
  'sowing',
  'harvesting',
  'irrigation',
  'fertilizing',
  'pest-control',
  'maintenance',
  'other',
];
const STATUSES = ['active', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high'];

/** Keeps a free-text field to a known set, falling back rather than failing. */
const oneOf = (value, allowed, fallback) =>
  allowed.includes(String(value || '').toLowerCase())
    ? String(value).toLowerCase()
    : fallback;

// ============================================================
// LIST TASKS
// ============================================================

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    const params = [req.user.id];
    let where = 'WHERE owner_id = $1';
    if (status && STATUSES.includes(status)) {
      params.push(status);
      where += ' AND status = $2';
    }

    const result = await db.query(
      `SELECT * FROM farm_tasks
       ${where}
       ORDER BY
         -- Overdue and upcoming work first; tasks with no date sort last
         -- rather than to the top, which is where NULLs would otherwise land.
         CASE WHEN status = 'active' THEN 0 ELSE 1 END,
         due_date ASC NULLS LAST,
         created_at DESC`,
      params
    );

    res.json({ tasks: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('GET /farm-tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ============================================================
// CREATE TASK
// ============================================================

router.post('/', handle(async (req, res) => {
  const title = str(req.body.title, { field: 'Task title', required: true });
  const description = str(req.body.description, { field: 'Description', max: 2000 });
  const fieldName = str(req.body.fieldName, { field: 'Field name' });
  const assignee = str(req.body.assignee, { field: 'Assignee' });

  // A date the app cannot parse is worse than none: it would sort
  // unpredictably and display as Invalid Date.
  let dueDate = null;
  if (req.body.dueDate) {
    const parsed = new Date(req.body.dueDate);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'Due date is not a valid date' });
    }
    dueDate = parsed.toISOString();
  }

  const result = await db.query(
    `INSERT INTO farm_tasks(
       id, owner_id, title, description, category, status, priority,
       due_date, field_id, field_name, assignee
     )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      `task_${nanoid(10)}`,
      req.user.id,
      title,
      description || null,
      oneOf(req.body.category, CATEGORIES, 'other'),
      oneOf(req.body.status, STATUSES, 'active'),
      oneOf(req.body.priority, PRIORITIES, 'medium'),
      dueDate,
      req.body.fieldId || null,
      fieldName || null,
      assignee || null,
    ]
  );

  res.status(201).json({ task: result.rows[0], message: 'Task created' });
}));

// ============================================================
// UPDATE TASK
// ============================================================

router.put('/:id', handle(async (req, res) => {
  const existing = await db.query(
    'SELECT * FROM farm_tasks WHERE id = $1 AND owner_id = $2',
    [req.params.id, req.user.id]
  );
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const current = existing.rows[0];
  const status = req.body.status
    ? oneOf(req.body.status, STATUSES, current.status)
    : current.status;

  let dueDate = current.due_date;
  if (req.body.dueDate !== undefined) {
    if (req.body.dueDate === null) {
      dueDate = null;
    } else {
      const parsed = new Date(req.body.dueDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Due date is not a valid date' });
      }
      dueDate = parsed.toISOString();
    }
  }

  // COALESCE so the app can send only the field it changed — marking a task
  // done sends status alone and must not blank the title.
  const result = await db.query(
    `UPDATE farm_tasks
     SET title       = COALESCE($1, title),
         description = COALESCE($2, description),
         category    = COALESCE($3, category),
         -- $4 is cast because it is both assigned here and compared in the
         -- CASE below; without it Postgres cannot deduce a single type for
         -- the parameter and rejects the statement.
         status      = $4::varchar,
         priority    = COALESCE($5, priority),
         due_date    = $6,
         field_id    = COALESCE($7, field_id),
         field_name  = COALESCE($8, field_name),
         assignee    = COALESCE($9, assignee),
         -- Stamped when it moves to completed, and cleared if it is reopened,
         -- so the two never disagree.
         completed_at = CASE
           WHEN $4::varchar = 'completed' AND status <> 'completed' THEN NOW()
           WHEN $4::varchar <> 'completed' THEN NULL
           ELSE completed_at
         END,
         updated_at  = NOW()
     WHERE id = $10 AND owner_id = $11
     RETURNING *`,
    [
      req.body.title ? str(req.body.title, { field: 'Task title' }) : null,
      req.body.description ?? null,
      req.body.category ? oneOf(req.body.category, CATEGORIES, current.category) : null,
      status,
      req.body.priority ? oneOf(req.body.priority, PRIORITIES, current.priority) : null,
      dueDate,
      req.body.fieldId ?? null,
      req.body.fieldName ?? null,
      req.body.assignee ?? null,
      req.params.id,
      req.user.id,
    ]
  );

  res.json({ task: result.rows[0], message: 'Task updated' });
}));

// ============================================================
// DELETE TASK
// ============================================================

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM farm_tasks WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('DELETE /farm-tasks/:id error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;

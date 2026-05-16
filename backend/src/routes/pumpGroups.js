const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { nanoid } = require('nanoid');

// ============================================================
// GET ALL GROUPS
// ============================================================

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT *
      FROM pump_groups
      WHERE owner_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    const groups = [];

    for (const group of result.rows) {
      const pumpsResult = await db.query(
        `
        SELECT pump_id
        FROM pump_group_mapping
        WHERE group_id = $1
        `,
        [group.id]
      );

      groups.push({
        ...group,
        pumpIds: pumpsResult.rows.map(
          (item) => item.pump_id
        ),
      });
    }

    res.json({
      groups,
      count: groups.length,
    });

  } catch (error) {
    console.error(
      'GET /pump-groups error:',
      error
    );

    res.status(500).json({
      error: 'Failed to fetch groups',
    });
  }
});

// ============================================================
// GET SINGLE GROUP
// ============================================================

router.get('/:id', async (req, res) => {
  try {

    const result = await db.query(
      `
      SELECT *
      FROM pump_groups
      WHERE id = $1
      AND owner_id = $2
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Group not found',
      });
    }

    const group = result.rows[0];

    const pumpsResult = await db.query(
      `
      SELECT pump_id
      FROM pump_group_mapping
      WHERE group_id = $1
      `,
      [group.id]
    );

    res.json({
      ...group,
      pumpIds: pumpsResult.rows.map(
        (item) => item.pump_id
      ),
    });

  } catch (error) {
    console.error(
      'GET /pump-groups/:id error:',
      error
    );

    res.status(500).json({
      error: 'Failed to fetch group',
    });
  }
});

// ============================================================
// CREATE GROUP
// ============================================================

router.post('/', async (req, res) => {
  try {

    const { name, pumpIds } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Group name is required',
      });
    }

    if (
      !pumpIds ||
      !Array.isArray(pumpIds) ||
      pumpIds.length === 0
    ) {
      return res.status(400).json({
        error:
          'At least one pump ID is required',
      });
    }

    // VERIFY PUMPS BELONG TO USER
    for (const pumpId of pumpIds) {

      const pumpCheck = await db.query(
        `
        SELECT *
        FROM pumps
        WHERE id = $1
        AND owner_id = $2
        `,
        [
          pumpId,
          req.user.id,
        ]
      );

      if (pumpCheck.rows.length === 0) {
        return res.status(400).json({
          error: `Pump ${pumpId} not found or not authorized`,
        });
      }
    }

    const groupId = nanoid();

    await db.query(
      `
      INSERT INTO pump_groups(
        id,
        name,
        owner_id
      )
      VALUES($1,$2,$3)
      `,
      [
        groupId,
        name,
        req.user.id,
      ]
    );

    // INSERT GROUP ITEMS
    for (const pumpId of pumpIds) {

      await db.query(
        `
        INSERT INTO pump_group_mapping(
          group_id,
          pump_id
        )
        VALUES($1,$2)
        `,
        [
          groupId,
          pumpId,
        ]
      );
    }

    res.status(201).json({
      id: groupId,
      name,
      pumpIds,
      owner_id: req.user.id,
      message: 'Group created',
    });

  } catch (error) {
    console.error(
      'POST /pump-groups error:',
      error
    );

    res.status(500).json({
      error: 'Failed to create group',
    });
  }
});

// ============================================================
// UPDATE GROUP
// ============================================================

router.put('/:id', async (req, res) => {
  try {

    const { name, pumpIds } = req.body;

    const existingGroup = await db.query(
      `
      SELECT *
      FROM pump_groups
      WHERE id = $1
      AND owner_id = $2
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    if (existingGroup.rows.length === 0) {
      return res.status(404).json({
        error: 'Group not found',
      });
    }

    // UPDATE NAME
    if (name !== undefined) {

      await db.query(
        `
        UPDATE pump_groups
        SET
          name = $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [
          name,
          req.params.id,
        ]
      );
    }

    // UPDATE PUMP IDS
    if (pumpIds !== undefined) {

      if (!Array.isArray(pumpIds)) {
        return res.status(400).json({
          error:
            'pumpIds must be an array',
        });
      }

      // VERIFY PUMPS
      for (const pumpId of pumpIds) {

        const pumpCheck = await db.query(
          `
          SELECT *
          FROM pumps
          WHERE id = $1
          AND owner_id = $2
          `,
          [
            pumpId,
            req.user.id,
          ]
        );

        if (pumpCheck.rows.length === 0) {
          return res.status(400).json({
            error: `Pump ${pumpId} not found or not authorized`,
          });
        }
      }

      // REMOVE OLD ITEMS
      await db.query(
        `
        DELETE FROM pump_group_mapping
        WHERE group_id = $1
        `,
        [req.params.id]
      );

      // INSERT NEW ITEMS
      for (const pumpId of pumpIds) {

        await db.query(
          `
          INSERT INTO pump_group_mapping(
            group_id,
            pump_id
          )
          VALUES($1,$2)
          `,
          [
            req.params.id,
            pumpId,
          ]
        );
      }
    }

    res.json({
      message: 'Group updated',
    });

  } catch (error) {
    console.error(
      'PUT /pump-groups/:id error:',
      error
    );

    res.status(500).json({
      error: 'Failed to update group',
    });
  }
});

// ============================================================
// DELETE GROUP
// ============================================================

router.delete('/:id', async (req, res) => {
  try {

    const groupCheck = await db.query(
      `
      SELECT *
      FROM pump_groups
      WHERE id = $1
      AND owner_id = $2
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Group not found',
      });
    }

    // DELETE GROUP ITEMS
    await db.query(
      `
      DELETE FROM pump_group_mapping
      WHERE group_id = $1
      `,
      [req.params.id]
    );

    // DELETE GROUP
    await db.query(
      `
      DELETE FROM pump_groups
      WHERE id = $1
      `,
      [req.params.id]
    );

    res.json({
      message: 'Group deleted',
    });

  } catch (error) {
    console.error(
      'DELETE /pump-groups/:id error:',
      error
    );

    res.status(500).json({
      error: 'Failed to delete group',
    });
  }
});

// ============================================================
// GROUP CONTROL
// ============================================================

router.post('/:id/control', async (req, res) => {
  try {

    const { action } = req.body;

    if (!['on', 'off'].includes(action)) {
      return res.status(400).json({
        error:
          'Action must be "on" or "off"',
      });
    }

    const groupResult = await db.query(
      `
      SELECT *
      FROM pump_groups
      WHERE id = $1
      AND owner_id = $2
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Group not found',
      });
    }

    const group = groupResult.rows[0];

    const pumpItems = await db.query(
      `
      SELECT pump_id
      FROM pump_group_mapping
      WHERE group_id = $1
      `,
      [req.params.id]
    );

    const results = [];

    for (const item of pumpItems.rows) {

      const pumpId = item.pump_id;

      const pumpResult = await db.query(
        `
        SELECT *
        FROM pumps
        WHERE id = $1
        `,
        [pumpId]
      );

      if (pumpResult.rows.length === 0) {
        continue;
      }

      const pump = pumpResult.rows[0];

      const now = new Date();

      let additionalRunTime = 0;

      if (
        action === 'off' &&
        pump.status === 'on' &&
        pump.last_turned_on
      ) {

        additionalRunTime = Math.floor(
          (
            now -
            new Date(pump.last_turned_on)
          ) / 1000
        );
      }

      await db.query(
        `
        UPDATE pumps
        SET
          status = $1,
          last_action = $2,
          updated_at = NOW(),
          last_turned_on = CASE
            WHEN $1 = 'on'
            THEN NOW()
            ELSE last_turned_on
          END,
          last_turned_off = CASE
            WHEN $1 = 'off'
            THEN NOW()
            ELSE last_turned_off
          END,
          total_run_time_sec = total_run_time_sec + $3
        WHERE id = $4
        `,
        [
          action,
          action === 'on'
            ? 'turned_on'
            : 'turned_off',
          additionalRunTime,
          pumpId,
        ]
      );

      // SAVE HISTORY
      await db.query(
        `
        INSERT INTO pump_history(
          pump_id,
          pump_name,
          action,
          triggered_by,
          user_id,
          duration_sec
        )
        VALUES($1,$2,$3,$4,$5,$6)
        `,
        [
          pumpId,
          pump.name,
          action,
          'group',
          req.user.id,
          action === 'off'
            ? additionalRunTime
            : null,
        ]
      );

      results.push({
        pumpId,
        name: pump.name,
        status: action,
      });
    }

    res.json({
      groupId: req.params.id,
      action,
      pumpsControlled:
        results.length,
      results,
      message: `All pumps in "${group.name}" turned ${action}`,
    });

  } catch (error) {
    console.error(
      'POST /pump-groups/:id/control error:',
      error
    );

    res.status(500).json({
      error: 'Failed to control group',
    });
  }
});

module.exports = router;

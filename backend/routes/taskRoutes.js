import express from 'express';
import { query } from '../db/index.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all active tasks for Dashboard mapping
// Accessible by all authenticated staff
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        m.id as id,
        m.id as message_id, 
        m.sender_phone, 
        m.content, 
        m.created_at,
        t.id as task_id,
        COALESCE(t.title, 'Incoming Support Request') as title,
        t.category,
        t.priority,
        COALESCE(t.status, 'New Message') as status
      FROM messages m
      LEFT JOIN tasks t ON t.message_id = m.id
      ORDER BY m.created_at DESC
    `);
    console.log(`[GET /api/tasks] Returning ${result.rows.length} activities`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET basic analytics/KPIs for Dashboard Overview
// Restricted to Admins and Managers
router.get('/metrics', authenticate, authorize(['Admin', 'Manager']), async (req, res) => {
  try {
    const totalMessagesRes = await query('SELECT count(*) FROM messages');
    const totalActionableRes = await query('SELECT count(*) FROM messages WHERE is_actionable = true');
    const actionRequiredRes = await query("SELECT count(*) FROM tasks WHERE status = 'New'");
    
    res.json({
      totalMessages: parseInt(totalMessagesRes.rows[0].count),
      autoQualifiedTasks: parseInt(totalActionableRes.rows[0].count),
      actionRequired: parseInt(actionRequiredRes.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DEBUG: Directly fetch messages to see what's in the DB
router.get('/debug', async (req, res) => {
  try {
    const result = await query('SELECT * FROM messages LIMIT 10');
    res.json({
      count: result.rows.length,
      rows: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tasks/:id - Manual Overrides & Status Transitions (FR-8, FR-9)
router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, summary, category, priority, status, project_id } = req.body;
  const userRole = req.headers['x-user-role'] || 'Executive';
  const userId = req.headers['x-user-id'] || 1; // Placeholder until full Auth is in place

  try {
    // 1. Fetch current task state for audit logging
    const currentTaskRes = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (currentTaskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const currentTask = currentTaskRes.rows[0];

    // 2. Perform Update
    const updateResult = await query(`
      UPDATE tasks 
      SET 
        title = COALESCE($1, title),
        summary = COALESCE($2, summary),
        category = COALESCE($3, category),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        project_id = COALESCE($6, project_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [title, summary, category, priority, status, project_id, id]);

    const updatedTask = updateResult.rows[0];

    // 3. Create Audit Log (FR-10)
    let actions = [];
    if (status && status !== currentTask.status) actions.push(`STATUS_CHANGE: ${currentTask.status} -> ${status}`);
    if (category && category !== currentTask.category) actions.push(`CATEGORY_OVERRIDE: ${currentTask.category} -> ${category}`);
    if (title && title !== currentTask.title) actions.push('DETAILS_EDITED');

    if (actions.length > 0) {
      await query(
        'INSERT INTO audit_logs (task_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [id, userId, actions.join(' | '), JSON.stringify({ old: currentTask, new: updatedTask })]
      );
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// GET /api/tasks/:id/audit - Fetch audit history for a task (FR-10)
router.get('/:id/audit', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT a.*, u.name as user_name 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.task_id = $1
      ORDER BY a.created_at DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;

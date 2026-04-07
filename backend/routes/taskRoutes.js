import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET all active tasks for Dashboard mapping
router.get('/', async (req, res) => {
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
router.get('/metrics', async (req, res) => {
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

export default router;

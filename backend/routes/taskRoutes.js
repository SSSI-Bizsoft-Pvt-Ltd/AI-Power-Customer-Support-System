import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET all active tasks for Dashboard mapping
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.title, t.summary, t.category, t.confidence_score, t.priority, t.status, t.created_at, m.sender_phone
      FROM tasks t
      JOIN messages m ON t.message_id = m.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
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

export default router;

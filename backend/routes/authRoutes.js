import express from 'express';
import axios from 'axios';
import { query } from '../db/index.js';

const router = express.Router();

// POST /api/auth/google
// Verify Google ID Token and provide session/role
router.get('/google-verify', async (req, res) => {
  const { idToken } = req.query;

  if (!idToken) {
    return res.status(400).json({ error: 'ID Token is required' });
  }

  try {
    // 1. Verify token with Google API
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const { email, name, sub } = response.data;

    // 2. Check if user exists in DB, otherwise create as 'Executive'
    let userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (userRes.rows.length === 0) {
      // Create new user (FR-1: User Management)
      const newUserRes = await query(
        'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *',
        [name, email, 'Executive']
      );
      user = newUserRes.rows[0];
    } else {
      user = userRes.rows[0];
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Google token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid Google Token' });
  }
});

export default router;

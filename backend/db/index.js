import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Keep the process alive for better container recovery unless critical
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export const initDB = async () => {
  try {
    const initSql = fs.readFileSync(path.resolve(__dirname, 'init.sql'), 'utf8');
    await pool.query(initSql);
    console.log('Database initialized successfully (checked/created tables)');
  } catch (error) {
    console.error('Error initializing database:', error);
    // Don't crash—just log, so the server can potentially retry or stay up
  }
};

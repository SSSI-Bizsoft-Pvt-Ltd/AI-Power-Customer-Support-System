import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getClient } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDB() {
  const client = await getClient();
  try {
    const sqlPath = path.join(__dirname, '../db/init.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running DB schema initialization...');
    await client.query(sqlScript);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
    process.exit();
  }
}

initializeDB();

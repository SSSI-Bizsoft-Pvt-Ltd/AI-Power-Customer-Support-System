import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import whatsappRoutes from './routes/whatsappRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { initDB } from './db/index.js';

// Load environment variables
dotenv.config();

// Auto-initialize DB tables if not present
initDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

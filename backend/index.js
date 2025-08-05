import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import summarizeRoutes from './routes/summarizeRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/contact', contactRoutes);

// Serve static frontend files (from client folder)
app.use(express.static(path.join(__dirname, '../client')));

// Root route: Redirect to login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// MongoDB Connection and Server Start
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'textsummarizer', // Ensures the correct DB name
})
.then(() => {
  console.log("✅ Connected to MongoDB Atlas");
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1); // Exit app if DB connection fails
});

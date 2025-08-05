import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import summarizeRoutes from './routes/summarizeRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import contactRoutes from './routes/contactRoutes.js'; // ✅ Added contact route

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Required for ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/contact', contactRoutes); // ✅ Register contact route

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, '../client')));

// ✅ Redirect root URL to login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

// ❌ 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  app.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
  );
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

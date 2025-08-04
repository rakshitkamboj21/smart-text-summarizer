import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import summarizeRoutes from './routes/summarizeRoutes.js';
import emailRoutes from './routes/emailRoutes.js'; // ✅ Added'=

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Needed for path handling in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/email', emailRoutes); // ✅ Registered email route

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, '../client')));

// ✅ Redirect root URL to login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

// ❌ 404 Handler (Keep this last)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ DB Connect + Start Server
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

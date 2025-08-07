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

// === CORS Configuration ===
const allowedOrigins = [
  "https://brilliant-peony-573c56.netlify.app",
  "https://moonlit-kitsune-4179ad.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed for this origin: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Optional: parses form submissions

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/contact', contactRoutes);

// === Serve Frontend (Optional for monorepo hosting) ===
// If you're hosting frontend separately (e.g., Netlify), you may not need this
app.use(express.static(path.join(__dirname, '../client')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// MongoDB Connection + Server Start
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'textsummarizer',
})
.then(() => {
  console.log("✅ Connected to MongoDB Atlas");
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

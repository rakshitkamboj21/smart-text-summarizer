// routes/summarizeRoutes.js
import express from 'express';
import {
  summarizeText,
  summarizeURL,
  getUserSummaries,
  deleteSummary,
  deleteAllSummaries,
  translateSummary,
  saveSummary // ✅ Newly added import
} from '../controllers/summarizeController.js';

import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Summarize plain text
router.post('/', authMiddleware, summarizeText);

// ✅ Summarize from URL
router.post('/url', authMiddleware, summarizeURL);

// ✅ Get user's summary history
router.get('/history', authMiddleware, getUserSummaries);

// ✅ Delete individual summary by ID
router.delete('/:id', authMiddleware, deleteSummary);

// ✅ Delete all summaries
router.delete('/', authMiddleware, deleteAllSummaries);

// ✅ Translate summary
router.post('/translate', authMiddleware, translateSummary);

// ✅ Save translated summary (used after summarizing and translating from text or URL)
router.post('/save', authMiddleware, saveSummary);

export default router;

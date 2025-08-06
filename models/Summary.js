// models/Summary.js
import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalText: {
    type: String,
    required: true,
  },
  summaryText: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
    default: 'en', // fallback if language is not provided
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('Summary', summarySchema);

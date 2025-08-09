import { getSummary } from '../utils/geminiUtil.js';
import Summary from '../models/Summary.js';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

/**
 * Helper: Translate text using LibreTranslate
 */
const libreTranslate = async (text, targetLang) => {
  try {
    const resp = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'auto', // ✅ Detect source language automatically
        target: targetLang,
        format: 'text'
      })
    });

    if (!resp.ok) {
      throw new Error(`LibreTranslate error: ${resp.statusText}`);
    }

    const data = await resp.json();
    return data.translatedText;
  } catch (err) {
    console.error('LibreTranslate Error:', err.message);
    return null; // fallback to original if translation fails
  }
};

/**
 * POST /api/summarize
 * Summarize plain text and optionally translate
 */
export const summarizeText = async (req, res) => {
  const { text, language } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ message: 'Text is required for summarization' });
  }

  try {
    // Step 1: Summarize in English
    const englishSummary = await getSummary(text);

    let finalSummary = englishSummary;
    const targetLang = language || 'en';

    // Step 2: Translate if needed
    if (targetLang !== 'en') {
      const translated = await libreTranslate(englishSummary, targetLang);
      if (translated) {
        finalSummary = translated;
      }
    }

    // Step 3: Save to DB
    await Summary.create({
      userId: req.user.id,
      originalText: text,
      summaryText: finalSummary,
      language: targetLang,
    });

    res.status(201).json({ summary: finalSummary });
  } catch (error) {
    console.error('Summarization Error:', error.message);
    res.status(500).json({ message: 'Failed to summarize text' });
  }
};

/**
 * POST /api/summarize/url
 * Summarize content from a URL, and support translation
 */
export const summarizeURL = async (req, res) => {
  const { url, language } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'A valid URL is required.' });
  }

  try {
    // Fetch page content
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Node.js fetch)' },
    });

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract paragraphs and headings
    let textContent = '';
    const elements = document.querySelectorAll('p, h1, h2, h3');
    elements.forEach(el => {
      textContent += el.textContent.trim() + ' ';
    });

    textContent = textContent.trim().replace(/\s+/g, ' ');

    if (!textContent || textContent.length < 100) {
      return res.status(400).json({ message: 'Failed to extract meaningful content from URL.' });
    }

    // Limit to 8000 characters
    const trimmedText = textContent.slice(0, 8000);

    // Step 1: Summarize in English
    const englishSummary = await getSummary(trimmedText);

    let finalSummary = englishSummary;
    const targetLang = language || 'en';

    // Step 2: Translate if needed
    if (targetLang !== 'en') {
      const translated = await libreTranslate(englishSummary, targetLang);
      if (translated) {
        finalSummary = translated;
      }
    }

    // Step 3: Save to DB
    await Summary.create({
      userId: req.user.id,
      originalText: `Content from URL: ${url}`,
      summaryText: finalSummary,
      language: targetLang,
    });

    res.status(200).json({ summary: finalSummary });
  } catch (error) {
    console.error('URL Summarization Error:', error);
    res.status(500).json({ message: 'Failed to summarize content from URL.' });
  }
};

/**
 * POST /api/summarize/translate
 * Translate provided text
 */
export const translateSummary = async (req, res) => {
  const { text, targetLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({ message: 'Text and target language are required' });
  }

  try {
    const translated = await libreTranslate(text, targetLanguage);
    if (!translated) {
      return res.status(500).json({ message: 'Translation failed' });
    }
    res.status(200).json({ translatedText: translated });
  } catch (err) {
    console.error('Translate Route Error:', err.message);
    res.status(500).json({ message: 'Translation failed' });
  }
};

/**
 * POST /api/summarize/save
 * Save a summary directly (after translation on frontend)
 */
export const saveSummary = async (req, res) => {
  try {
    const { originalText, summaryText, language } = req.body;

    if (!originalText || !summaryText || !language) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const newSummary = new Summary({
      userId: req.user.id,
      originalText,
      summaryText,
      language,
    });

    await newSummary.save();
    res.status(201).json({ message: 'Summary saved successfully' });
  } catch (err) {
    console.error('Save Error:', err.message);
    res.status(500).json({ message: 'Failed to save summary.' });
  }
};

/**
 * GET /api/summarize/history
 * Get all summaries by user
 */
export const getUserSummaries = async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ history: summaries });
  } catch (error) {
    console.error('Fetch History Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch summaries' });
  }
};

/**
 * DELETE /api/summarize/:id
 * Delete a single summary by ID
 */
export const deleteSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Summary.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Summary not found or unauthorized' });
    }

    res.status(200).json({ message: 'Summary deleted successfully' });
  } catch (error) {
    console.error('Delete Summary Error:', error.message);
    res.status(500).json({ message: 'Error deleting summary' });
  }
};

/**
 * DELETE /api/summarize
 * Delete all summaries by user
 */
export const deleteAllSummaries = async (req, res) => {
  try {
    await Summary.deleteMany({ userId: req.user.id });
    res.status(200).json({ message: 'All summaries deleted successfully' });
  } catch (error) {
    console.error('Delete All Summaries Error:', error.message);
    res.status(500).json({ message: 'Error deleting all summaries' });
  }
};

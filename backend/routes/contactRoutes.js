// server/routes/contactRoutes.js
import express from 'express';
import ContactMessage from '../models/contactMessage.js';

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newMessage = new ContactMessage({ name, email, message });
    await newMessage.save();

    console.log("Contact form saved:", newMessage);
    res.status(200).json({ message: "Message received and saved successfully!" });
  } catch (error) {
    console.error("Error saving contact form:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;

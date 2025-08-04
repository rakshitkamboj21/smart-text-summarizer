import express from "express";
import { emailSummary } from "../controllers/emailController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send", authMiddleware, emailSummary);

export default router;

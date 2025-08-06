import { sendSummaryEmail } from "../utils/emailUtil.js";

export const emailSummary = async (req, res) => {
  const { toEmail, summary } = req.body;

  if (!toEmail || !summary) {
    return res.status(400).json({ message: "Email and summary are required." });
  }

  try {
    await sendSummaryEmail(toEmail, summary);
    res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
};

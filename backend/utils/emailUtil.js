import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // or use "smtp" with host/port/auth
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendSummaryEmail = async (to, summaryText) => {
  const mailOptions = {
    from: `"Smart Summarizer" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Text Summary",
    text: summaryText,
  };

  return transporter.sendMail(mailOptions);
};

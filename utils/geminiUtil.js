import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in the environment");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const delay = ms => new Promise(res => setTimeout(res, ms));

export const getSummary = async (text, retries = 3, backoff = 2000) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Summarize the following text concisely:\n\n${text}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
      });
      const response = result.response;
      const summary = await response.text(); // Ensure async safety
      return summary;
    } catch (error) {
      console.error("Gemini API Error:", error?.message || error);
      if (error?.response?.status === 503 && attempt < retries - 1) {
        console.log(`Retrying after ${backoff}ms... (${attempt + 1}/${retries})`);
        await delay(backoff * (attempt + 1));
      } else {
        throw new Error("Failed to generate summary");
      }
    }
  }
};

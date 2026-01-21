import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

// Initialize the 2026 GenAI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default ai;
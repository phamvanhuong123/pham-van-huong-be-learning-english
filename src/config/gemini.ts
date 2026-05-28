import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "@/config/environment";

const GEMINI_API_KEY = env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error(
    "Missing GEMINI_API_KEY in environment variables"
  );
}

export const GEMINI_MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-lite"
];
export const DEFAULT_GEMINI_MODEL = GEMINI_MODEL_CHAIN[0];

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface GetGeminiModelOptions {
  model?: string;
}

export const getGeminiModel = ({
  model = DEFAULT_GEMINI_MODEL,
}: GetGeminiModelOptions = {}) => {
  return genAI.getGenerativeModel({
    model,
  });
};
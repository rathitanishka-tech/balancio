import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

async function run() {
  console.log("=== AI Provider Test ===");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is not set in process.env");
    process.exit(1);
  } else {
    console.log("✅ GEMINI_API_KEY is set (length: " + apiKey.length + ")");
  }

  try {
    console.log("Initializing GoogleGenAI...");
    const ai = new GoogleGenAI({ apiKey });

    console.log("Calling generateContent...");
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Say hello.",
    });

    console.log("\n✅ Success! Response:");
    console.log(response.text);
  } catch (error: any) {
    console.error("\n❌ Error generating content:");
    console.error(error.message);
    if (error.stack) console.error(error.stack);
  }
}

run();

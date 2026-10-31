"use server";

import Groq from "groq-sdk";
import { requireAuth } from "@/lib/auth/session";
import {
  GROQ_MODEL,
  MAX_MESSAGE_LENGTH,
  isCasualIntent,
  buildFinancialContext,
  handleGroqError,
} from "@/lib/ai/utils";

export type AiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function askAi(input: string | AiMessage[]): Promise<string> {
  const message = typeof input === "string" 
    ? input 
    : (Array.isArray(input) && input.length > 0 ? input[input.length - 1]?.content : "");

  if (!message || typeof message !== "string" || !message.trim()) {
    return "Please enter a message.";
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return "Your message is too long. Please keep your question under 1,000 characters.";
  }

  // Authentication check - server determines user identity strictly via Clerk session
  let session;
  try {
    session = await requireAuth();
  } catch {
    return "You must be signed in to use the AI assistant.";
  }

  if (!session?.userId) {
    return "You must be signed in to use the AI assistant.";
  }

  const rawApiKey = process.env.GROQ_API_KEY;
  const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, "") : undefined;
  if (!apiKey) {
    return "The AI assistant is temporarily unavailable because the API key is not configured.";
  }

  const groq = new Groq({
    apiKey,
    timeout: 15000,
  });

  // Intent classification
  let isCasual = isCasualIntent(trimmedMessage);

  if (!isCasual) {
    try {
      const classifyRes = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "Classify the user intent as either 'CASUAL' (greetings, small talk, thanks, what can you do, capabilities) or 'FINANCIAL' (questions about spending, costs, debts, owing, balances, money, expenses). Respond with ONLY one word: CASUAL or FINANCIAL."
          },
          { role: "user", content: trimmedMessage }
        ],
        temperature: 0,
        max_tokens: 10,
      });

      const intent = classifyRes.choices?.[0]?.message?.content?.trim().toUpperCase() || "";
      if (intent.includes("CASUAL")) {
        isCasual = true;
      }
    } catch (err: any) {
      return handleGroqError(err);
    }
  }

  let systemPromptContent = "You are Balancio AI, a helpful, friendly financial assistant inside the Balancio app. Respond naturally, warmly, and briefly.";

  if (!isCasual) {
    try {
      const financialContext = await buildFinancialContext(session.userId, trimmedMessage);
      systemPromptContent += `\n\n[USER FINANCIAL SUMMARY]\n${financialContext}\n[END SUMMARY]\n\nAnswer the user's question accurately using ONLY the above summary. Do not reveal database IDs, emails, or internal structures. If data is zero or empty, state so clearly.`;
    } catch (dbErr) {
      console.error("Database query error in AI action");
      return "Unable to retrieve your financial data at the moment. Please try again later.";
    }
  }

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPromptContent },
        { role: "user", content: trimmedMessage }
      ],
      temperature: isCasual ? 0.7 : 0.2,
      max_tokens: 500,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return "I was unable to process your request. Please try again.";
    }
    return reply;
  } catch (err: any) {
    return handleGroqError(err);
  }
}

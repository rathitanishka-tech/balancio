"use server";

import { requireAuth } from "@/lib/auth/session";
import {
  GROQ_MODEL,
  MAX_MESSAGE_LENGTH,
  MAX_COMPLETION_TOKENS,
  isCasualIntent,
  buildFinancialContext,
  handleGroqError,
  getGroqClient,
  getGroqApiKey,
  AiRequestTimer,
} from "@/lib/ai/utils";

export type AiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function askAi(input: string | AiMessage[]): Promise<string> {
  const timer = new AiRequestTimer();

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
    timer.mark("Authentication completed");
  } catch {
    return "You must be signed in to use the AI assistant.";
  }

  if (!session?.userId) {
    return "You must be signed in to use the AI assistant.";
  }

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return "The AI assistant is temporarily unavailable because the API key is not configured.";
  }

  const groq = getGroqClient(apiKey);

  // Intent classification
  let isCasual = isCasualIntent(trimmedMessage);
  let financialContext: string | null = null;

  if (!isCasual) {
    timer.mark("Intent classification and DB retrieval started (parallel)");
    try {
      // Run classification and financial context retrieval in parallel
      const [classifyRes, contextRes] = await Promise.all([
        groq.chat.completions.create({
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
        }),
        buildFinancialContext(session.userId, trimmedMessage).catch((dbErr) => {
          console.error("Database query error in AI action");
          return null;
        })
      ]);

      const intent = classifyRes.choices?.[0]?.message?.content?.trim().toUpperCase() || "";
      if (intent.includes("CASUAL")) {
        isCasual = true;
      } else {
        financialContext = contextRes;
      }
      timer.mark("Intent classification and DB retrieval completed");
    } catch (err: any) {
      return handleGroqError(err);
    }
  }

  let systemPromptContent = "You are Balancio AI, a helpful, friendly financial assistant inside the Balancio app. Respond naturally, warmly, and briefly.";

  if (!isCasual) {
    if (!financialContext) {
      try {
        financialContext = await buildFinancialContext(session.userId, trimmedMessage);
      } catch (dbErr) {
        console.error("Database query error in AI action");
        return "Unable to retrieve your financial data at the moment. Please try again later.";
      }
    }
    systemPromptContent += `\n\n[USER FINANCIAL SUMMARY]\n${financialContext}\n[END SUMMARY]\n\nAnswer the user's question accurately using ONLY the above summary. Do not reveal database IDs, emails, or internal structures. If data is zero or empty, state so clearly.`;
    timer.mark("Prompt construction completed");
  }

  try {
    timer.mark("Groq request started");
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPromptContent },
        { role: "user", content: trimmedMessage }
      ],
      temperature: isCasual ? 0.7 : 0.2,
      max_tokens: MAX_COMPLETION_TOKENS,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    timer.mark("Groq generation completed");
    timer.mark("Response delivered to frontend");

    if (!reply) {
      return "I was unable to process your request. Please try again.";
    }
    return reply;
  } catch (err: any) {
    return handleGroqError(err);
  }
}

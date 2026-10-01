"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const ExpenseDraftSchema = z.object({
  intent: z.enum(["CREATE_EXPENSE", "ASK_QUESTION", "UNKNOWN"]).default("UNKNOWN"),
  title: z.string().optional(),
  amountMinor: z.number().optional(),
  currency: z.string().optional(),
  date: z.string().optional(),
  paidBy: z.object({
    type: z.enum(["CURRENT_USER", "SPECIFIC_USER"]),
    name: z.string().optional()
  }).optional(),
  participants: z.array(z.object({
    name: z.string(),
    share: z.number().optional()
  })).optional(),
  splitType: z.enum(["EQUAL", "PERCENTAGE", "CUSTOM", "EXACT"]).optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  confidence: z.number().default(0)
});

export async function parseExpenseAction(text: string, groupMembers?: string[]) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  let prompt = `Extract expense details from the following text:\n\n"${text}"`;
  if (groupMembers && groupMembers.length > 0) {
    prompt += `\n\nContext: The user is in a group with the following members: ${groupMembers.join(", ")}. Try to match participant names to these members.`;
  }

  const result = await generateObject({
    model: groq("llama3-8b-8192"),
    schema: ExpenseDraftSchema,
    system: "You are an expense parser. Extract the details accurately. If no currency is mentioned, assume INR. Calculate amountMinor by multiplying the amount by 100. Be sure to output high confidence if details are clear.",
    prompt,
  });

  return result.object;
}

export async function parseReceiptAction(formData: FormData) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const file = formData.get("receipt") as File;
  if (!file) throw new Error("No receipt file provided");

  // Currently Groq models are text-only via OpenAI compat layer.
  // Return a mock placeholder for receipt parsing or use a small text fallback.
  return {
    merchant: "Scanned Merchant",
    totalMinor: 50000,
    confidence: 0.5,
    currency: "INR",
  };
}

export async function getInsightsAction(analyticsData: any) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dataString = JSON.stringify(analyticsData, null, 2);
  const prompt = `Here is the user's spending data:\n\n${dataString}\n\nGenerate a brief 1-2 sentence financial insight summary.`;

  const result = await generateText({
    model: groq("llama3-8b-8192"),
    system: "You are a financial advisor analyzing spending data. Keep your insight very brief, encouraging, and actionable. Do not use markdown. Just pure text.",
    prompt,
  });

  return { summary: result.text };
}

export async function explainDebtAction(debtData: any) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dataString = JSON.stringify(debtData, null, 2);
  const prompt = `Here is the debt context data:\n\n${dataString}\n\nExplain why this debt exists based on these transactions.`;

  const result = await generateText({
    model: groq("llama3-8b-8192"),
    system: "You are an AI assistant explaining how a debt was calculated based on past shared expenses. Be clear and concise. Do not use complex markdown.",
    prompt,
  });

  return { explanation: result.text };
}

import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

import { getOrCreateCurrentUser } from "@/lib/actions/user";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  let dbUser;
  try {
    const user = await getOrCreateCurrentUser();
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        expenses: {
          include: { splits: true, group: true },
          take: 50,
          orderBy: { date: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user for chat:", error);
    return new Response("Internal Server Error", { status: 500 });
  }

  if (!dbUser) {
    return new Response("User not found", { status: 404 });
  }

  const expenseData = dbUser.expenses.map(e => ({
    title: e.title,
    amount: e.amount,
    date: e.date,
    group: e.group?.name || "Personal",
  }));

  const systemPrompt = `You are an AI financial assistant for an expense splitting app called Balancio.
Here are the user's recent expenses:
${JSON.stringify(expenseData, null, 2)}

Answer the user's questions about their expenses concisely and helpfully.`;
  
  if (!process.env.GROQ_API_KEY) {
    // Provide a mocked streaming response for demo purposes
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const text = "I am a demo AI! To get real answers, please add a `GROQ_API_KEY` to your `.env.local` file. Your most recent expense is: " + (expenseData[0]?.title || "None yet!");
        
        for (let i = 0; i < text.length; i++) {
          controller.enqueue(encoder.encode(`0:${JSON.stringify(text[i])}\n`));
          await new Promise(r => setTimeout(r, 20)); // simulated typing
        }
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1'
      }
    });
  }

  try {
    const result = await streamText({
      model: groq("llama3-8b-8192"), 
      system: systemPrompt,
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI Chat Error:", error);
    return new Response("An error occurred with the AI API.", { status: 500 });
  }
}

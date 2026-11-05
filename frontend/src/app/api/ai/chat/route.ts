import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
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
} from "@/lib/ai/utils";
import type { AiMessage } from "@/lib/actions/ai";

export const dynamic = "force-dynamic";

// Persistent in-memory User ID cache attached to globalThis to survive development hot-reloads
// Strictly scoped to the verified clerkId from Clerk's authentication session
const globalForUserCache = globalThis as unknown as {
  aiUserCache: Map<string, { id: string; name: string }> | undefined;
};

export const userCache =
  globalForUserCache.aiUserCache ??
  new Map<string, { id: string; name: string }>();

if (process.env.NODE_ENV !== "production") {
  globalForUserCache.aiUserCache = userCache;
}

export async function POST(req: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 9);
  const routeStart = performance.now();
  console.log(`[AI Perf][${reqId}] Route entry at ${new Date().toISOString()}`);

  // 1. Clerk Authentication
  const tAuthStart = performance.now();
  let clerkId: string | null = null;
  try {
    const authObj = auth();
    clerkId = authObj?.userId || null;
  } catch (authErr) {
    console.error(`[AI Perf][${reqId}] Clerk auth exception:`, authErr);
  }
  const tAuthEnd = performance.now();
  const authDur = tAuthEnd - tAuthStart;
  console.log(`[AI Perf][${reqId}] Clerk authentication: ${authDur.toFixed(1)} ms`);

  if (!clerkId) {
    return new Response(
      JSON.stringify({ error: "You must be signed in to use the AI assistant." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. User Lookup in Database (Strictly scoped to authenticated clerkId, with global persistence)
  const tUserStart = performance.now();
  let user: { id: string; name: string } | null = null;
  const isCacheHit = userCache.has(clerkId);

  if (isCacheHit) {
    user = userCache.get(clerkId)!;
  } else {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, name: true }
    });
    if (dbUser) {
      user = dbUser;
      userCache.set(clerkId, { id: dbUser.id, name: dbUser.name });
    } else {
      // Graceful fallback to getSyncedUser if first-time user
      const session = await requireAuth().catch(() => null);
      if (session?.userId) {
        user = { id: session.userId, name: "User" };
        userCache.set(clerkId, { id: session.userId, name: "User" });
      }
    }
  }
  const tUserEnd = performance.now();
  const userDur = tUserEnd - tUserStart;
  console.log(`[AI Perf][${reqId}] User lookup: ${userDur.toFixed(1)} ms (${isCacheHit ? "cache hit" : "db query"})`);

  if (!user) {
    return new Response(
      JSON.stringify({ error: "User account not found. Please log in again." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Parse and validate request payload
  let body: { messages?: AiMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON request payload." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const rawMessages = body.messages || [];
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Please enter a message." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const latestMessage = rawMessages[rawMessages.length - 1];
  const userContent = latestMessage?.content?.trim() || "";

  if (!userContent) {
    return new Response(
      JSON.stringify({ error: "Please enter a message." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (userContent.length > MAX_MESSAGE_LENGTH) {
    return new Response(
      JSON.stringify({ error: "Your message is too long. Please keep your question under 1,000 characters." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Check Groq API configuration
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "The AI assistant is temporarily unavailable because the API key is not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Intent detection & database context retrieval
  const isCasual = isCasualIntent(userContent);
  let financialContext: string | null = null;
  let dbDuration = 0;

  if (!isCasual) {
    const tDbStart = performance.now();
    try {
      financialContext = await buildFinancialContext(user.id, userContent, reqId);
      dbDuration = performance.now() - tDbStart;
      console.log(`[AI Perf][${reqId}] Financial context retrieval: ${dbDuration.toFixed(1)} ms`);
    } catch (dbErr) {
      console.error(`[AI Perf][${reqId}] Database query error in AI streaming route:`, dbErr);
      return new Response(
        JSON.stringify({ error: "Unable to retrieve your financial data at the moment. Please try again later." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } else {
    console.log(`[AI Perf][${reqId}] Context retrieval skipped (casual intent)`);
  }

  // 6. Build compact prompt and recent conversation history
  const tPromptStart = performance.now();
  let systemPrompt = "You are Balancio AI, a smart, friendly financial assistant inside the Balancio app. Respond naturally, warmly, and concisely (typically 2-4 sentences) unless a detailed breakdown is explicitly requested. Format currency values with bold text.";

  if (financialContext) {
    systemPrompt += `\n\n[USER FINANCIAL SUMMARY]\n${financialContext}\n[END SUMMARY]\n\nAnswer the user's question accurately using ONLY the above summary. Do not reveal database IDs, emails, or internal structures. If data is zero or empty, state so clearly.`;
  }

  const recentTurns = rawMessages
    .slice(-6)
    .filter(m => (m.role === "user" || m.role === "assistant") && m.content)
    .map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(0, 500)
    }));

  const groqMessages = [
    { role: "system" as const, content: systemPrompt },
    ...recentTurns
  ];
  const promptDur = performance.now() - tPromptStart;
  console.log(`[AI Perf][${reqId}] Prompt construction: ${promptDur.toFixed(1)} ms`);

  // 7. Flush streaming response immediately and process Groq async iterator inside stream lifecycle
  const encoder = new TextEncoder();
  let firstTokenReceived = false;
  let firstChunkEnqueued = false;
  let totalTokens = 0;

  const readableStream = new ReadableStream({
    async start(controller) {
      const streamStart = performance.now();

      // Flush an immediate preamble whitespace to force Node.js / Next.js to flush
      // the HTTP 200 headers and first byte across the TCP connection without waiting for Groq.
      controller.enqueue(encoder.encode(" "));
      console.log(`[AI Perf][${reqId}] Immediate stream flush enqueued at ${(performance.now() - routeStart).toFixed(1)} ms from route start`);

      try {
        const groqApiStart = performance.now();
        console.log(`[AI Perf][${reqId}] Groq API request start at ${(groqApiStart - routeStart).toFixed(1)} ms from route start`);
        const groq = getGroqClient(apiKey);

        const groqStream = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: groqMessages,
          temperature: isCasual ? 0.7 : 0.2,
          max_tokens: MAX_COMPLETION_TOKENS,
          stream: true,
        });

        const groqPromiseResolved = performance.now();
        const promiseDur = groqPromiseResolved - groqApiStart;
        console.log(`[AI Perf][${reqId}] Groq API promise resolved (HTTP handshake): ${promiseDur.toFixed(1)} ms`);

        for await (const chunk of groqStream) {
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              const ttftFromInvoke = performance.now() - groqApiStart;
              const ttftFromRoute = performance.now() - routeStart;
              console.log(`[AI Perf][${reqId}] Groq first token received (TTFT from invoke): ${ttftFromInvoke.toFixed(1)} ms (${ttftFromRoute.toFixed(1)} ms from route start)`);
            }
            if (!firstChunkEnqueued) {
              firstChunkEnqueued = true;
              const tEnqueue = performance.now() - routeStart;
              console.log(`[AI Perf][${reqId}] First content chunk enqueued into ReadableStream: ${tEnqueue.toFixed(1)} ms from route start`);
            }
            totalTokens++;
            controller.enqueue(encoder.encode(delta));
          }
        }

        const totalStreamDur = performance.now() - streamStart;
        const totalReqDur = performance.now() - routeStart;
        console.log(`[AI Perf][${reqId}] Stream completion: ${totalStreamDur.toFixed(1)} ms (tokens=${totalTokens}, totalReqDuration=${totalReqDur.toFixed(1)} ms)`);
        controller.close();
      } catch (streamErr: any) {
        console.error(`[AI Perf][${reqId}] Groq stream error:`, streamErr);
        const friendlyMsg = handleGroqError(streamErr);
        controller.enqueue(encoder.encode(friendlyMsg));
        controller.close();
      }
    }
  });

  return new Response(readableStream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Server-Timing": `auth;dur=${authDur.toFixed(1)}, user;dur=${userDur.toFixed(1)}, db;dur=${dbDuration.toFixed(1)}, prompt;dur=${promptDur.toFixed(1)}`,
    }
  });
}

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIProvider, GenerateStructuredOutputOptions, GenerateTextOptions, AnalyzeImageOptions } from "./ai.provider";
import { z } from "zod";

// Utility to convert a Zod schema to Google GenAI schema
// This is a simplified version; complex zod schemas might need more robust translation.
function zodToGeminiSchema(schema: z.ZodTypeAny): Schema {
  const jsonSchema = convertZodToJsonSchema(schema);
  return jsonSchema as Schema;
}

// Basic recursive conversion (supports objects, arrays, strings, numbers, booleans, enums)
function convertZodToJsonSchema(schema: any): any {
  const def = schema._def;
  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return { type: Type.STRING };
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return { type: Type.NUMBER };
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return { type: Type.BOOLEAN };
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return { type: Type.STRING, enum: def.values };
    case z.ZodFirstPartyTypeKind.ZodArray:
      return { type: Type.ARRAY, items: convertZodToJsonSchema(def.type) };
    case z.ZodFirstPartyTypeKind.ZodObject: {
      const properties: Record<string, any> = {};
      const required: string[] = [];
      for (const key in def.shape()) {
        const propSchema = def.shape()[key];
        properties[key] = convertZodToJsonSchema(propSchema);
        if (!propSchema.isOptional()) {
          required.push(key);
        }
      }
      return { type: Type.OBJECT, properties, required: required.length > 0 ? required : undefined };
    }
    case z.ZodFirstPartyTypeKind.ZodOptional:
    case z.ZodFirstPartyTypeKind.ZodNullable:
      return convertZodToJsonSchema(def.innerType);
    default:
      return { type: Type.STRING }; // Fallback
  }
}

import { env } from "../config/env";

export class GoogleAIProvider implements AIProvider {
  private ai: GoogleGenAI | null = null;
  private defaultModel = process.env.AI_MODEL || "gemini-2.5-flash";

  constructor() {
    if (env.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    } else {
      console.warn("⚠️ GEMINI_API_KEY is missing. Using MOCK provider for development.");
    }
  }

  async generateStructuredOutput<T>(options: GenerateStructuredOutputOptions<T>): Promise<T> {
    if (!this.ai) {
      const promptStr = options.prompt.toLowerCase();
      let intent = "UNKNOWN";
      if (promptStr.includes("hey") || promptStr.includes("hello")) intent = "GREETING";
      else if (promptStr.includes("what can you do")) intent = "GENERAL_HELP";
      else if (promptStr.includes("how much did i spend")) intent = "SPENDING_QUERY";
      else if (promptStr.includes("what do i owe")) intent = "BALANCE_QUERY";
      else if (promptStr.includes("who owes me")) intent = "DEBT_QUERY";
      else if (promptStr.includes("i have spent")) intent = "EXPENSE_CREATION_INTENT";
      return { intent } as T;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
        contents: options.prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature || 0,
          responseMimeType: "application/json",
          responseSchema: zodToGeminiSchema(options.schema),
        },
      });

      if (!response.text) {
        throw new Error("AI provider returned empty response");
      }

      // Parse and validate with the actual Zod schema
      const parsed = JSON.parse(response.text);
      return options.schema.parse(parsed);
    } catch (error: any) {
      console.warn("Structured output generation failed:", error.message);
      throw error;
    }
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    if (!this.ai) {
      throw new Error("API key is missing.");
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
        contents: options.prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature || 0.7,
          tools: options.tools, // If tools are provided
        },
      });

      if (!response.text) {
        throw new Error("AI provider returned empty text response");
      }

      return response.text;
    } catch (error: any) {
      console.warn("Text generation failed:", error.message);
      return "I'm currently receiving too many requests right now and am out of quota! Please try again later.";
    }
  }

  async analyzeImage<T>(options: AnalyzeImageOptions<T>): Promise<T> {
    if (!this.ai) {
      console.warn("MOCK provider: returning mock image analysis");
      return {} as T;
    }

    const response = await this.ai.models.generateContent({
      model: this.defaultModel,
      contents: [
        {
          inlineData: {
            data: options.imageBuffer.toString("base64"),
            mimeType: options.mimeType,
          },
        },
        options.prompt,
      ],
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature || 0,
        responseMimeType: "application/json",
        responseSchema: zodToGeminiSchema(options.schema),
      },
    });

    if (!response.text) {
      throw new Error("AI provider returned empty image analysis response");
    }

    const parsed = JSON.parse(response.text);
    return options.schema.parse(parsed);
  }

  async askConversational(
    query: string, 
    history: { role: string, content: string }[] | undefined,
    tools: any[],
    systemInstruction: string
  ): Promise<string> {
    if (!this.ai) {
      return "This is a mock AI response since the API key is missing. I would have executed tools if needed.";
    }

    // Convert our internal tool format to Gemini FunctionDeclarations
    const functionDeclarations = tools.map(t => {
      // Map JSON schema types to Gemini Types (simple implementation)
      const mapType = (typeStr: string) => {
        if (typeStr === "string") return Type.STRING;
        if (typeStr === "number") return Type.NUMBER;
        if (typeStr === "boolean") return Type.BOOLEAN;
        return Type.OBJECT;
      };
      
      const properties: any = {};
      for (const [key, val] of Object.entries((t.parameters?.properties as any) || {})) {
        properties[key] = {
          type: mapType((val as any).type),
          description: (val as any).description
        };
      }
      
      return {
        name: t.name,
        description: t.description,
        parameters: {
          type: Type.OBJECT,
          properties,
          required: t.parameters?.required || []
        }
      };
    });

    const geminiTools = [{ functionDeclarations }];

    // Prepare history
    // Note: Gemini chat expects history in { role: 'user' | 'model', parts: [{ text: ... }] } format
    // But since we are creating a new chat session, we can just send the whole history as text context in the first message if we want, or map it to `history` field in `ai.chats.create`.
    const mappedHistory = (history || []).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = this.ai.chats.create({
      model: this.defaultModel,
      config: {
        systemInstruction,
        temperature: 0.2,
        tools: geminiTools
      },
      history: mappedHistory.length > 0 ? mappedHistory : undefined
    });

    try {
      console.log(`[AI] Conversational chat started with query: "${query}"`);
      let response = await chat.sendMessage({ message: query });
      
      // Loop to handle potential multiple tool calls
      let loopCount = 0;
      while (response.functionCalls && response.functionCalls.length > 0 && loopCount < 5) {
        loopCount++;
        const call = response.functionCalls[0];
        console.log(`[AI] LLM requested tool: ${call.name} with args`, call.args);
        
        const tool = tools.find(t => t.name === call.name);
        let result;
        if (tool) {
          try {
            result = await tool.execute(call.args || {});
            console.log(`[AI] Tool executed successfully.`);
          } catch (err: any) {
            console.error(`[AI] Tool ${call.name} failed:`, err.message);
            result = { error: err.message };
          }
        } else {
          console.error(`[AI] Tool ${call.name} not found!`);
          result = { error: `Tool ${call.name} not found` };
        }
        
        response = await chat.sendMessage({
          message: [{
            functionResponse: {
              name: call.name,
              response: result
            }
          }]
        });
      }

      if (!response.text) {
        return "Sorry, I encountered an issue formulating a response.";
      }
      return response.text;
    } catch (error: any) {
      console.error("[AI] ERROR in conversational chat\nerror:", JSON.stringify(error), "\nstack:", error.stack);
      if (error?.status === 404) {
        return "Sorry, I am configured with an AI model that is not available on this API key. Please check your backend configuration.";
      }
      if (error?.status === 429) {
        const errorMsg = error.message || "";
        const match = errorMsg.match(/Please retry in ([\d.]+)s/);
        const retryAfter = match && match[1] ? Math.ceil(parseFloat(match[1])) : 60;
        const rateLimitError = new Error(`The AI provider is temporarily rate-limited. Please try again in approximately ${retryAfter} seconds.`);
        (rateLimitError as any).status = 429;
        (rateLimitError as any).retryAfter = retryAfter;
        throw rateLimitError;
      }
      if (error?.status === 503) {
        return "I'm experiencing unusually high demand right now. Spikes in demand are usually temporary, so please try again in a few moments!";
      }
      
      throw error;
    }
  }
}

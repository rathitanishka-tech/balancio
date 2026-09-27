import Groq from "groq-sdk";
import { AIProvider, GenerateStructuredOutputOptions, GenerateTextOptions, AnalyzeImageOptions } from "./ai.provider";
import { z } from "zod";
import { env } from "../config/env";

export class GroqProvider implements AIProvider {
  private ai: Groq | null = null;
  // Use a stable model capable of tool calling available on this specific key
  private defaultModel = env.aiModel || "qwen/qwen3.8-27b";

  constructor() {
    if (env.groqApiKey) {
      this.ai = new Groq({ apiKey: env.groqApiKey });
    } else {
      console.warn("⚠️ GROQ_API_KEY is missing.");
    }
  }

  async generateStructuredOutput<T>(options: GenerateStructuredOutputOptions<T>): Promise<T> {
    if (!this.ai) throw new Error("Groq API key is missing.");

    const messages: any[] = [];
    if (options.systemInstruction) {
      // Instruct the model to output valid JSON matching the schema
      messages.push({ role: "system", content: `${options.systemInstruction}\n\nYou must respond in JSON format.` });
    }
    messages.push({ role: "user", content: options.prompt });

    try {
      const response = await this.ai.chat.completions.create({
        model: this.defaultModel,
        messages,
        temperature: options.temperature || 0,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error("Groq returned empty response");

      const parsed = JSON.parse(text);
      return options.schema.parse(parsed);
    } catch (error: any) {
      console.warn("Structured output generation failed:", error.message);
      throw error;
    }
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    if (!this.ai) throw new Error("Groq API key is missing.");

    const messages: any[] = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    messages.push({ role: "user", content: options.prompt });

    try {
      const response = await this.ai.chat.completions.create({
        model: this.defaultModel,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: 800
      });

      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error("Groq returned empty text response");

      return text;
    } catch (error: any) {
      console.warn("Text generation failed:", error.message);
      return "I'm currently receiving too many requests right now and am out of quota! Please try again later.";
    }
  }

  async analyzeImage<T>(options: AnalyzeImageOptions<T>): Promise<T> {
    // Groq supports LLaVA for vision, but standard models do not support it natively yet.
    // For now, if analyzeImage is called, we throw or return a mock.
    throw new Error("analyzeImage is not fully supported in the current Groq provider model configuration.");
  }

  async askConversational(
    query: string,
    history: { role: string, content: string }[] | undefined,
    tools: any[],
    systemInstruction: string
  ): Promise<string> {
    if (!this.ai) throw new Error("Groq API key is missing.");

    // Convert internal tools to OpenAI/Groq function schema format
    const groqTools = tools.map(t => {
      const properties: any = {};
      for (const [key, val] of Object.entries((t.parameters?.properties as any) || {})) {
        properties[key] = {
          type: (val as any).type,
          description: (val as any).description
        };
      }

      return {
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: "object",
            properties,
            required: t.parameters?.required || []
          }
        }
      };
    });

    const messages: any[] = [{ role: "system", content: systemInstruction }];

    if (history && history.length > 0) {
      history.forEach(msg => {
        messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
      });
    }

    messages.push({ role: "user", content: query });

    try {
      console.log(`[AI] Conversational chat started with query: "${query}" using Groq`);

      let response = await this.ai.chat.completions.create({
        model: this.defaultModel,
        messages,
        temperature: 0.2,
        max_tokens: 800, // Hard limit to prevent hitting Groq's 1000 OTPM free tier limit
        tools: groqTools.length > 0 ? groqTools : undefined,
        tool_choice: "auto"
      });

      let responseMessage = response.choices[0]?.message;

      // Loop to handle potential multiple tool calls
      let loopCount = 0;
      while (responseMessage?.tool_calls && loopCount < 5) {
        loopCount++;
        messages.push(responseMessage); // Append assistant's function call message to history

        for (const toolCall of responseMessage.tool_calls) {
          console.log(`[AI] LLM requested tool: ${toolCall.function.name}`);
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          const tool = tools.find(t => t.name === functionName);
          let result;
          if (tool) {
            try {
              result = await tool.execute(functionArgs);
              console.log(`[AI] Tool executed successfully.`);
            } catch (err: any) {
              console.error(`[AI] Tool ${functionName} failed:`, err.message);
              result = { error: err.message };
            }
          } else {
            console.error(`[AI] Tool ${functionName} not found!`);
            result = { error: `Tool ${functionName} not found` };
          }

          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(result)
          });
        }

        // Second response from model with the tool results
        response = await this.ai.chat.completions.create({
          model: this.defaultModel,
          messages,
          temperature: 0.2,
          max_tokens: 800
        });

        responseMessage = response.choices[0]?.message;
      }

      if (!responseMessage?.content) {
        return "Sorry, I encountered an issue formulating a response.";
      }

      return responseMessage.content;

    } catch (error: any) {
      console.error("[AI] ERROR in conversational chat\nerror:", error.message);

      if (error.status === 429) {
        const rateLimitError = new Error(`The AI provider is temporarily rate-limited. Please try again in approximately 60 seconds.`);
        (rateLimitError as any).status = 429;
        (rateLimitError as any).retryAfter = 60;
        throw rateLimitError;
      }

      throw error;
    }
  }
}

import { ZodSchema } from "zod";

export interface GenerateStructuredOutputOptions<T> {
  prompt: string;
  schema: ZodSchema<T>;
  systemInstruction?: string;
  temperature?: number;
}

export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  tools?: any[];
}

export interface AnalyzeImageOptions<T> {
  prompt: string;
  schema: ZodSchema<T>;
  imageBuffer: Buffer;
  mimeType: string;
  systemInstruction?: string;
  temperature?: number;
}

/**
 * Abstract interface for the AI service.
 * Ensures the application is not tightly coupled to a single LLM provider.
 */
export interface AIProvider {
  /**
   * Generates a structured JSON output constrained by a Zod schema.
   */
  generateStructuredOutput<T>(options: GenerateStructuredOutputOptions<T>): Promise<T>;

  /**
   * Generates free-form text or answers conversational queries, optionally using tools.
   */
  generateText(options: GenerateTextOptions): Promise<string>;

  /**
   * Analyzes an image and returns a structured output constrained by a Zod schema.
   */
  analyzeImage<T>(options: AnalyzeImageOptions<T>): Promise<T>;

  /**
   * Runs a conversational loop that automatically calls tools if the LLM requests them.
   */
  askConversational(
    query: string, 
    history: { role: string, content: string }[] | undefined,
    tools: any[],
    systemInstruction: string
  ): Promise<string>;
}

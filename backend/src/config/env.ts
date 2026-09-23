import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: optionalNumber("PORT", 5000),

  mongoUrl: required("MONGO_URL", "mongodb://localhost:27017/splitwise"),

  jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  aiProvider: process.env.AI_PROVIDER ?? "google",
  aiModel: process.env.AI_MODEL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,

  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",

  maxFileSize: optionalNumber("MAX_FILE_SIZE", 5 * 1024 * 1024),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads"),

  rateLimitWindowMs: optionalNumber("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  rateLimitMax: optionalNumber("RATE_LIMIT_MAX", 300),

  logLevel: process.env.LOG_LEVEL ?? "info"
};

if (env.isProduction && env.jwtSecret === "dev-only-insecure-secret-change-me") {
  // Fail loudly rather than silently running production with a known secret.
  throw new Error("JWT_SECRET must be set to a strong secret in production.");
}

import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/**
 * General-purpose API rate limiter. Applied globally in app.ts.
 * A stricter limiter is used specifically for auth endpoints to slow down
 * credential-stuffing / brute-force attempts.
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." }
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many authentication attempts, please try again later." }
  }
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Max 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "The AI provider is temporarily rate-limited. Please try again later." }
  }
});

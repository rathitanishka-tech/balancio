import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "../utils/errors";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * Centralized error handler. Every error - whether an intentional AppError
 * thrown by business logic, or an unexpected exception - is normalized
 * into:
 *   { success: false, error: { code, message } }
 * Stack traces are NEVER exposed to the client, and are only logged
 * server-side.
 */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { code: err.code, stack: err.stack, path: req.path });
    }
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.errors.map((e) => e.message).join("; ")
      }
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: err.message }
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: `Invalid value for ${err.path}` }
    });
    return;
  }

  // MongoDB duplicate key error
  if (isMongoDuplicateKeyError(err)) {
    res.status(409).json({
      success: false,
      error: { code: "CONFLICT", message: "A record with these details already exists" }
    });
    return;
  }

  // Unknown/unexpected error
  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled error", { message, stack: err instanceof Error ? err.stack : undefined, path: req.path });

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: env.isProduction ? "Something went wrong. Please try again later." : message
    }
  });
}

function isMongoDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  );
}

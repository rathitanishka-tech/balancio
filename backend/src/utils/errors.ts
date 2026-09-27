/**
 * Centralized application error types. Every error thrown intentionally by
 * business logic should be an instance of AppError (or a subclass) so that
 * `error.middleware.ts` can turn it into the standard error response shape:
 *
 * { success: false, error: { code, message } }
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class InvalidSplitError extends AppError {
  constructor(message = "Split amounts must equal the expense total.") {
    super(message, 400, "INVALID_SPLIT");
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHENTICATED");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "UNAUTHORIZED");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMITED");
  }
}

export class InvariantViolationError extends AppError {
  constructor(message: string) {
    super(message, 500, "INVARIANT_VIOLATION");
  }
}

import type { ApiClientError } from "@/types/api";

/** Thrown by lib/api/client.ts for every failed request - components catch this, never a raw fetch error. */
export class ApiError extends Error implements ApiClientError {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Turns a backend error code/status into a short, friendly message a user
 * can actually act on - never the raw backend error string. Falls back to
 * the backend's own message for VALIDATION_ERROR/INVALID_SPLIT, since
 * those are already written to be user-facing (see splitwise-backend's
 * error.middleware.ts and Zod validators).
 */
export function friendlyErrorMessage(error: ApiClientError): string {
  switch (error.status) {
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return error.message || "That already exists or conflicts with something else.";
    case 429:
      return "You're doing that a bit too fast. Please wait a moment and try again.";
    case 400:
      return error.message || "Something about this request isn't valid.";
    case 0:
      return "Couldn't reach the server. Check your connection and try again.";
    default:
      return "Something went wrong on our end. Please try again.";
  }
}

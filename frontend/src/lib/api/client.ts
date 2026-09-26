import { getToken, clearToken } from "@/lib/auth/token";
import { ApiError } from "@/lib/api/errors";
import type { ApiEnvelope, ApiPaginatedSuccess } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Skip attaching the Authorization header (e.g. register/login themselves). */
  skipAuth?: boolean;
  signal?: AbortSignal;
}

let onUnauthorized: (() => void) | null = null;

/** AuthProvider registers a callback here so a 401 anywhere can trigger a clean logout + redirect. */
export function registerUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.startsWith("http") ? path : `${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * The single place every network call in this app goes through. It:
 *  - attaches the JWT (unless skipAuth)
 *  - parses the backend's { success, data } / { success, error } envelope
 *  - normalizes any failure into an ApiError with a stable status/code
 *  - triggers a global "logged out" flow on 401
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, skipAuth } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (!skipAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options.signal
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Couldn't reach the server.");
  }

  let payload: ApiEnvelope<T> | ApiPaginatedSuccess<T extends Array<infer U> ? U : never> | null = null;
  try {
    payload = await response.json();
  } catch {
    // No JSON body (e.g. a 204, or a non-JSON error page from a proxy).
  }

  if (!response.ok) {
    const code = (payload && "error" in payload && payload.error?.code) || `HTTP_${response.status}`;
    const message = (payload && "error" in payload && payload.error?.message) || response.statusText;

    if (response.status === 401) {
      clearToken();
      onUnauthorized?.();
    }

    throw new ApiError(response.status, code, message);
  }

  if (payload && "success" in payload && payload.success) {
    return payload.data as T;
  }

  // 2xx with an unexpected shape - treat the whole payload as the data.
  return payload as unknown as T;
}

/** Same as apiRequest, but also returns the pagination metadata for list endpoints. */
export async function apiRequestPaginated<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiPaginatedSuccess<T>> {
  const { method = "GET", body, query, skipAuth } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (!skipAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options.signal
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Couldn't reach the server.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const code = payload?.error?.code || `HTTP_${response.status}`;
    const message = payload?.error?.message || response.statusText;
    if (response.status === 401) {
      clearToken();
      onUnauthorized?.();
    }
    throw new ApiError(response.status, code, message);
  }

  return payload as ApiPaginatedSuccess<T>;
}

/** For endpoints that return a raw file (CSV/PDF export) rather than a JSON envelope. */
export async function apiRequestBlob(
  path: string,
  options: RequestOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    signal: options.signal
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = await response.json();
      message = payload?.error?.message ?? message;
    } catch {
      /* not JSON - keep statusText */
    }
    if (response.status === 401) {
      clearToken();
      onUnauthorized?.();
    }
    throw new ApiError(response.status, `HTTP_${response.status}`, message);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? "export";

  return { blob: await response.blob(), filename };
}

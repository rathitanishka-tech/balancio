/**
 * Matches the backend's standard response envelope exactly
 * (see splitwise-backend API.md). Every api/* module unwraps these.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedSuccess<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  unread?: number;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorBody;

/** Normalized error shape thrown by lib/api/client.ts on any failed request. */
export interface ApiClientError {
  status: number;
  code: string;
  message: string;
}

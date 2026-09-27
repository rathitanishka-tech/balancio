import { Response } from "express";
import { PaginationMeta } from "./pagination";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, data });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  statusCode = 200
): Response {
  return res.status(statusCode).json({ success: true, data, pagination });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string
): Response {
  return res.status(statusCode).json({ success: false, error: { code, message } });
}

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthenticatedError } from "../utils/errors";
import { JwtPayload } from "../types/auth.types";

/**
 * requireAuth
 * ---------------------------------------------------------------------
 * 1. Reads the JWT from the `Authorization: Bearer <token>` header.
 * 2. Verifies its signature and expiry.
 * 3. Identifies the user from the token payload.
 * 4. Attaches `{ id, email }` to `req.user`.
 * 5. Rejects missing/invalid/expired tokens with 401.
 *
 * Every downstream handler must read the current user's identity from
 * `req.user`, NEVER from a userId supplied in the request body/params/query.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    next(new UnauthenticatedError("Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload & { iat: number; exp: number };
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthenticatedError("Session expired, please log in again"));
      return;
    }
    next(new UnauthenticatedError("Invalid authentication token"));
  }
}

/**
 * optionalAuth - attaches req.user if a valid token is present, but never
 * rejects the request if it's missing/invalid. Useful for endpoints that
 * behave slightly differently for authenticated vs anonymous callers.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const token = header.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    // Ignore invalid tokens for optional auth.
  }
  next();
}

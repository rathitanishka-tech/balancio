import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository";
import { env } from "../config/env";
import { ConflictError, UnauthenticatedError } from "../utils/errors";
import { RegisterInput, LoginInput, AuthTokenResponse } from "../types/auth.types";
import { IUser } from "../models/User";

const SALT_ROUNDS = 12;

/**
 * Auth service. Kept deliberately thin around bcrypt/JWT so that adding
 * Google OAuth / Auth.js later only means adding a new "strategy" (e.g.
 * `loginWithGoogle`) that still funnels into `issueToken` - the rest of
 * the app (requireAuth middleware, controllers) doesn't need to change.
 */
function issueToken(user: IUser): AuthTokenResponse {
  const payload = { sub: user._id.toString(), email: user.email };
  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  } as SignOptions);
  return { token, expiresIn: env.jwtExpiresIn };
}

export const authService = {
  async register(input: RegisterInput): Promise<{ user: IUser; auth: AuthTokenResponse }> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await userRepository.create({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      currency: input.currency ?? "INR",
      timezone: input.timezone ?? "Asia/Kolkata"
    });

    return { user, auth: issueToken(user) };
  },

  async login(input: LoginInput): Promise<{ user: IUser; auth: AuthTokenResponse }> {
    const user = await userRepository.findByEmailWithPassword(input.email);
    if (!user) {
      throw new UnauthenticatedError("Invalid email or password");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthenticatedError("Invalid email or password");
    }

    return { user, auth: issueToken(user) };
  },

  /**
   * JWTs are stateless, so "logout" has no server-side state to clear by
   * default - the client simply discards the token. This function exists
   * as the seam where a server-side token blocklist (e.g. Redis) could be
   * added later without changing the API surface.
   */
  async logout(): Promise<void> {
    return;
  }
};

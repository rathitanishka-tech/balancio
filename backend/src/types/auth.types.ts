export interface JwtPayload {
  sub: string; // userId
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  currency?: string;
  timezone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  token: string;
  expiresIn: string;
}

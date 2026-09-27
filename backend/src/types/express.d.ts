/**
 * Augments the Express Request type so that authenticated requests carry
 * a strongly-typed `user` object attached by `auth.middleware.ts`.
 * This is the ONLY place the rest of the app should read the current
 * user's identity from - never trust a userId supplied in the body/query.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      /** Populated by role.middleware.ts once group membership has been verified */
      membership?: {
        groupId: string;
        role: "OWNER" | "ADMIN" | "MEMBER";
      };
      /** Populated by upload middleware (multer) for attachment routes */
      file?: Express.Multer.File;
    }
  }
}

export {};

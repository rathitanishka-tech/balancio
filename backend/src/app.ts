import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { env } from "./config/env";
import { getDatabaseStatus } from "./config/database";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/notFound.middleware";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import groupRoutes from "./routes/group.routes";
import expenseRoutes from "./routes/expense.routes";
import settlementRoutes from "./routes/settlement.routes";
import notificationRoutes from "./routes/notification.routes";
import analyticsRoutes from "./routes/analytics.routes";
import attachmentRoutes from "./routes/attachment.routes";
import searchRoutes from "./routes/search.routes";
import { invitationTokenRouter } from "./routes/invitation.routes";
import aiRoutes from "./routes/ai.routes";

// Ensure the upload directory exists before multer tries to write into it.
// On serverless environments (like Vercel), this may fail due to read-only filesystems.
try {
  if (!fs.existsSync(env.uploadDir)) {
    fs.mkdirSync(env.uploadDir, { recursive: true });
  }
} catch (error) {
  console.warn("Could not create upload directory. This is expected in read-only serverless environments.");
}

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // --- Security & platform middleware -----------------------------------
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: env.isProduction
            ? ["'self'", "'unsafe-inline'"] 
            : ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: env.isProduction
            ? ["'self'", "https:"]
            : ["'self'", "https:", "ws:", "wss:"],
        },
      },
    })
  );
  app.use(
    cors({
      origin: env.isProduction 
        ? env.corsOrigin 
        : [env.corsOrigin, "http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? "combined" : "dev"));
  }

  app.use("/api", apiRateLimiter);

  // --- Health check --------------------------------------------------------
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      success: true,
      status: "healthy",
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString()
    });
  });

  // --- Static receipts (metadata is in Mongo; files are served from disk) ---
  app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));

  // --- API routes ------------------------------------------------------------
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/settlements", settlementRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/attachments", attachmentRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/invitations", invitationTokenRouter);
  app.use("/api/ai", aiRoutes);

  // Only apply the API 404 middleware to /api routes
  // This allows Next.js to handle all other routes (frontend)
  app.use("/api", notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();

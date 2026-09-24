import { app } from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { logger } from "./config/logger";
import next from "next";
import path from "path";

async function main(): Promise<void> {
  try {
    await connectDatabase();
  } catch (err) {
    logger.error("Failed to connect to MongoDB on startup", {
      message: err instanceof Error ? err.message : String(err)
    });
    logger.warn(
      "Starting the HTTP server anyway - requests that touch the database will fail " +
        "until MONGO_URL is reachable. Update your .env and restart once MongoDB is available."
    );
  }

  const dev = process.env.NODE_ENV !== "production";
  // Determine frontendDir robustly by looking at CWD (the backend folder)
  const frontendDir = path.resolve(process.cwd(), "../frontend");
  
  logger.info(`Booting Next.js from ${frontendDir}...`);
  const nextApp = next({ dev, dir: frontendDir });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();
  logger.info("Next.js prepared.");

  // Catch-all route for Next.js (frontend)
  app.all("*", (req, res) => {
    return handle(req, res);
  });

  const server = app.listen(env.port, () => {
    logger.info(`Splitwise unified server listening on port ${env.port}`, { env: env.nodeEnv });
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(() => process.exit(0));
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main();

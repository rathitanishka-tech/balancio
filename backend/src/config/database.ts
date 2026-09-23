import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

let connecting: Promise<typeof mongoose> | null = null;

/**
 * Connects to MongoDB using the MONGO_URL environment variable.
 * Safe to call multiple times - reuses the in-flight connection promise.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (connecting) {
    return connecting;
  }

  mongoose.set("strictQuery", true);

  connecting = mongoose
    .connect(env.mongoUrl, {
      serverSelectionTimeoutMS: 5000
    })
    .then((conn) => {
      logger.info("MongoDB connected", { host: conn.connection.host });
      return conn;
    })
    .catch((err) => {
      connecting = null;
      logger.error("MongoDB connection error", { message: (err as Error).message });
      throw err;
    });

  return connecting;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  connecting = null;
}

export function getDatabaseStatus(): "connected" | "connecting" | "disconnected" | "disconnecting" {
  const states: Record<number, "disconnected" | "connected" | "connecting" | "disconnecting"> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  return states[mongoose.connection.readyState] ?? "disconnected";
}

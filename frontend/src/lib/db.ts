import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  heartbeatStarted: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Background connection keep-alive heartbeat to prevent idle connection drops
// by Supabase PgBouncer pooler and cloud firewalls after 3-5 minutes of inactivity.
if (!globalForPrisma.heartbeatStarted && typeof setInterval !== "undefined") {
  globalForPrisma.heartbeatStarted = true;
  const heartbeatTimer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // Non-critical background ping
    }
  }, 2.5 * 60 * 1000); // Every 2.5 minutes

  if (heartbeatTimer.unref) {
    heartbeatTimer.unref(); // Do not block Node process exit
  }
}

/**
 * Minimal structured logger. Uses plain console under the hood (Morgan
 * handles HTTP access logs separately in app.ts) but centralizes the
 * interface so it can be swapped for Pino/Winston without touching call
 * sites throughout the codebase.
 */

type LogFields = Record<string, unknown>;

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  info(message: string, fields?: LogFields): void {
    console.log(`[${timestamp()}] INFO  ${message}`, fields ?? "");
  },
  warn(message: string, fields?: LogFields): void {
    console.warn(`[${timestamp()}] WARN  ${message}`, fields ?? "");
  },
  error(message: string, fields?: LogFields): void {
    console.error(`[${timestamp()}] ERROR ${message}`, fields ?? "");
  },
  debug(message: string, fields?: LogFields): void {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(`[${timestamp()}] DEBUG ${message}`, fields ?? "");
    }
  }
};

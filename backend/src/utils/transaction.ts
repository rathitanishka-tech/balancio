import mongoose from "mongoose";
import { logger } from "../config/logger";

/**
 * Runs `fn` inside a MongoDB multi-document transaction when the
 * connection supports one (i.e. MongoDB is running as a replica set /
 * mongos, which is the default for MongoDB Atlas and most managed
 * MongoDB, but NOT for a bare `mongod --dbpath` standalone instance often
 * used in local development).
 *
 * LIMITATION: A standalone MongoDB server cannot run multi-document
 * transactions. When we detect that (error code 20 / "Transaction numbers
 * are only allowed on a replica set member or mongos") we fall back to
 * running the same operations sequentially without a transaction. This
 * means that in that specific local-dev configuration, a failure partway
 * through (e.g. creating the Expense but then failing to create its
 * ExpenseParticipants) could leave partially-written data. For production
 * use, run MongoDB as a (single-node) replica set to get full atomicity -
 * this is a one-line `rs.initiate()` and is what MongoDB Atlas gives you
 * out of the box.
 */
export async function withTransaction<T>(fn: (session: mongoose.ClientSession | undefined) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result as T;
  } catch (err) {
    if (isTransactionsNotSupportedError(err)) {
      logger.warn(
        "MongoDB transactions are not supported by this deployment (standalone server). " +
          "Falling back to non-transactional writes. See utils/transaction.ts for details."
      );
      return fn(undefined);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

function isTransactionsNotSupportedError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("Transaction numbers are only allowed on a replica set member or mongos") ||
    message.includes("IllegalOperation") ||
    message.includes("Transactions are not supported")
  );
}

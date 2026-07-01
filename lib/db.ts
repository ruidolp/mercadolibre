// lib/db.ts
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Database } from "./schema";

/**
 * Singleton Kysely instance for the application.
 *
 * The pool is created lazily on first access so that importing this module at
 * build time (when env vars may not be present) does not throw. At runtime
 * (inside a request handler) POSTGRES_URL must be set.
 *
 * Pool max is kept at 1 to avoid connection exhaustion on Vercel serverless
 * functions, which can spin up many concurrent instances.
 */

let _db: Kysely<Database> | null = null;

function getDb(): Kysely<Database> {
  if (_db) return _db;

  const connectionString =
    process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Missing database connection string. Set POSTGRES_URL or DATABASE_URL in your environment."
    );
  }

  const pool = new Pool({
    connectionString,
    max: 1, // Keep low for serverless
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  _db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });

  return _db;
}

/**
 * Proxy that forwards every property access to the lazily-created Kysely
 * instance. This lets callers write `db.selectFrom(...)` without calling
 * `getDb()` explicitly, while still deferring the connection until the first
 * actual request.
 */
export const db = new Proxy({} as Kysely<Database>, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

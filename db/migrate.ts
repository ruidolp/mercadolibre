// db/migrate.ts
/**
 * Simple migration runner that executes SQL files in order.
 *
 * Usage:
 *   npx tsx db/migrate.ts
 *
 * Requires POSTGRES_URL or DATABASE_URL to be set in the environment.
 * For local development, create a .env.local file and run:
 *   npx dotenv -e .env.local -- npx tsx db/migrate.ts
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

async function migrate() {
  const connectionString =
    process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    console.error(
      "ERROR: Set POSTGRES_URL or DATABASE_URL before running migrations."
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  const client = await pool.connect();

  try {
    // Create a migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        filename   TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = join(process.cwd(), "db", "migrations");
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      // Skip already-applied migrations
      const { rows } = await client.query(
        "SELECT id FROM _migrations WHERE filename = $1",
        [file]
      );

      if (rows.length > 0) {
        console.log(`  SKIP  ${file} (already applied)`);
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), "utf-8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO _migrations (filename) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`  APPLY ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  FAIL  ${file}:`, err);
        throw err;
      }
    }

    console.log("\nMigrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration runner error:", err);
  process.exit(1);
});

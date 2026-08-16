import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.js";
import { ensureAdmin } from "./ensureAdmin.js";

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
);

// PostgreSQL requires a newly added enum value to commit before it can be used
// by the seed migration that creates the admin user.
await db.execute(sql`ALTER TYPE "role" ADD VALUE IF NOT EXISTS 'admin'`);
await migrate(db, { migrationsFolder });
if (process.env.NODE_ENV === "production") await ensureAdmin();
await pool.end();

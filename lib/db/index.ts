import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. Using dummy connection string for build.");
}

const connectionString = process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/dbname";
const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema: { ...schema } });

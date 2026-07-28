import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Applying manual migration...");
        await db.execute(sql`ALTER TABLE fantasy_lineups ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active' NOT NULL;`);
        await db.execute(sql`ALTER TABLE fantasy_lineups ADD COLUMN IF NOT EXISTS metadata JSONB;`);
        console.log("Successfully added status and metadata to fantasy_lineups.");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();

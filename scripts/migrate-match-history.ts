import { db } from "../lib/db"
import { sql } from "drizzle-orm"

/**
 * Migration: Add match_history table
 * Run with: npx tsx scripts/migrate-match-history.ts
 */

async function migrate() {
    console.log("🔄 Creating match_history table...")

    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS match_history (
                id TEXT PRIMARY KEY,
                match_id TEXT NOT NULL REFERENCES matches(id),
                action TEXT NOT NULL,
                previous_data JSONB,
                new_data JSONB,
                updated_by TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `)

        console.log("✅ match_history table created successfully")

        // Create index for faster queries
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_match_history_match_id 
            ON match_history(match_id)
        `)

        console.log("✅ Index created on match_id")

        console.log("🎉 Migration completed successfully!")
        process.exit(0)
    } catch (error) {
        console.error("❌ Migration failed:", error)
        process.exit(1)
    }
}

migrate()

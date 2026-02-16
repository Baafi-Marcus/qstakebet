import { db } from "../lib/db"
import { sql } from "drizzle-orm"

/**
 * PRODUCTION SYNC SCRIPT
 * Run with: npx tsx scripts/sync-production.ts
 */

async function sync() {
    console.log("🚀 Starting Production Schema Sync...");

    try {
        // 1. Add missing columns to matches table
        const matchesCols = [
            { name: "auto_end_at", type: "TIMESTAMP" },
            { name: "last_tick_at", type: "TIMESTAMP" },
            { name: "current_round", type: "INTEGER DEFAULT 0 NOT NULL" }
        ];

        for (const col of matchesCols) {
            console.log(`Checking column: matches.${col.name}...`);
            try {
                await db.execute(sql.raw(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`));
                console.log(`  ✅ Column ${col.name} verified/added.`);
            } catch (err: any) {
                console.warn(`  ⚠️  Column ${col.name} might already exist: ${err.message}`);
            }
        }

        // 2. Create match_history table
        console.log("Checking match_history table...");
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
        `);
        console.log("  ✅ match_history table verified/created.");

        // 3. Create Index
        console.log("Creating/Verifying index...");
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_match_history_match_id 
            ON match_history(match_id)
        `);
        console.log("  ✅ Index verified.");

        console.log("🎉 Production Schema Sync Successful!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Sync Failed:", error);
        process.exit(1);
    }
}

sync();

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL!);
async function renameColumns() {
    console.log("Starting column rename to snake_case...");
    const renames = [
        { from: "startTime", to: "start_time" },
        { from: "isLive", to: "is_live" },
        { from: "extendedOdds", to: "extended_odds" },
        { from: "tournamentId", to: "tournament_id" }
    ];
    for (const r of renames) {
        console.log(`Renaming ${r.from} to ${r.to} if ${r.from} exists...`);
        try {
            // Check if 'from' exists and 'to' doesn't
            const fromExists = await sql`
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'matches' AND column_name = ${r.from}
            `;
            const toExists = await sql`
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'matches' AND column_name = ${r.to}
            `;
            if (fromExists.length > 0 && toExists.length === 0) {
                await (sql as any)(`ALTER TABLE "matches" RENAME COLUMN "${r.from}" TO "${r.to}"`);
                console.log(`  Success: Renamed ${r.from} to ${r.to}`);
            } else if (fromExists.length > 0 && toExists.length > 0) {
                console.log(`  Skipping: Both ${r.from} and ${r.to} exist. Will try to drop ${r.from} later if needed.`);
            } else {
                console.log(`  Skipping: ${r.from} does not exist.`);
            }
        } catch (err: any) {
            console.warn(`  Warning on ${r.from}: ${err.message}`);
        }
    }
    console.log("Column rename completed!");
}
renameColumns();

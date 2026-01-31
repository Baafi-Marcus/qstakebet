import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL!);
async function finalFix() {
    console.log("Starting final matches table sync...");
    const columns = [
        { name: "tournament_id", type: "text" },
        { name: "participants", type: "jsonb DEFAULT '[]'::jsonb NOT NULL" },
        { name: "start_time", type: "text DEFAULT 'TBD' NOT NULL" },
        { name: "is_live", type: "boolean DEFAULT false NOT NULL" },
        { name: "stage", type: "text DEFAULT 'Regular Season' NOT NULL" },
        { name: "odds", type: "jsonb DEFAULT '{}'::jsonb NOT NULL" },
        { name: "extended_odds", type: "jsonb" },
        { name: "is_virtual", type: "boolean DEFAULT false NOT NULL" },
        { name: "sport_type", type: "text DEFAULT 'quiz' NOT NULL" },
        { name: "gender", type: "text DEFAULT 'male' NOT NULL" },
        { name: "margin", type: "jsonb DEFAULT '0.1'::jsonb NOT NULL" },
        { name: "created_at", type: "timestamp DEFAULT now()" }
    ];
    for (const col of columns) {
        console.log(`Ensuring ${col.name}...`);
        try {
            await (sql as any)(`ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
            console.log("  Done.");
        } catch (err: any) {
            console.warn(`  Warning on ${col.name}: ${err.message}`);
        }
    }
    console.log("Final sync completed!");
}
finalFix();

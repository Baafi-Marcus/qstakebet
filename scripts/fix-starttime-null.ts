import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
    try {
        console.log("Removing NOT NULL from start_time...");
        await sql`ALTER TABLE matches ALTER COLUMN start_time DROP NOT NULL`;
        console.log("✅ Migration successful.");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    }
}

migrate();

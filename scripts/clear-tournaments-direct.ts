import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function clearDB() {
    console.log("Starting DB wipe...");
    try {
        await sql`DELETE FROM bets`;
        console.log("Deleted bets");

        await sql`DELETE FROM match_history`;
        console.log("Deleted match_history");

        await sql`DELETE FROM matches`;
        console.log("Deleted matches");

        await sql`DELETE FROM tournaments`;
        console.log("Deleted tournaments");

        console.log("✅ Successfully cleared DB.");
    } catch (e) {
        console.error("❌ Error:", e);
    }
}

clearDB();

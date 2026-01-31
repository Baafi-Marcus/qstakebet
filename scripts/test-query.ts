import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function testQuery() {
    try {
        console.log("Testing SELECT * FROM matches...");
        const result = await sql`SELECT * FROM public.matches LIMIT 1`;
        console.log("Success! Columns:", Object.keys(result[0]));
    } catch (err: any) {
        console.error("SELECT * FAILED:", err.message);
        if (err.detail) console.error("DETAIL:", err.detail);
        if (err.hint) console.error("HINT:", err.hint);
    }

    try {
        console.log("Testing specific columns...");
        const result = await sql`
            SELECT "id", "tournament_id", "participants", "start_time", "is_live", "stage", "odds", "extended_odds", "is_virtual", "sport_type", "gender", "margin", "created_at"
            FROM public.matches
            LIMIT 1
        `;
        console.log("Success with specific columns!");
    } catch (err: any) {
        console.error("SPECIFIC SELECT FAILED:", err.message);
    }
}

testQuery();

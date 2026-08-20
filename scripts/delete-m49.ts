import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function run() {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM matches WHERE id = 'nsmq-2026-m49'`;
    console.log("Deleted match 49");
}

run();

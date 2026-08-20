import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log("Checking settled matches...");
    if (!process.env.DATABASE_URL) throw new Error("No DB URL");
    const sql = neon(process.env.DATABASE_URL);
    
    const matches = await sql`SELECT id, status, result, participants FROM matches WHERE status='settled'`;
    console.log(`Settled matches:`);
    for (const m of matches) {
        console.log(`ID: ${m.id}`);
    }
}

run().catch(console.error).finally(() => process.exit(0));

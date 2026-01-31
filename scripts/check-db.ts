import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function checkSchema() {
    try {
        console.log("Checking matches table...");
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'matches'
        `;
        console.log("Matches columns:", JSON.stringify(columns, null, 2));

        console.log("Checking tables...");
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log("Tables:", JSON.stringify(tables, null, 2));
    } catch (err) {
        console.error("Error checking schema:", err);
    }
}

checkSchema();

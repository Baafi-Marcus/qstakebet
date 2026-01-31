import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function auditMatches() {
    try {
        console.log("AUDIT_START");
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'matches'
            ORDER BY ordinal_position
        `;
        columns.forEach((c: any) => {
            console.log(`COLUMN: ${c.column_name} (${c.data_type})`);
        });
        console.log("AUDIT_END");
    } catch (err: any) {
        console.error("AUDIT_ERROR:", err.message);
    }
}

auditMatches();

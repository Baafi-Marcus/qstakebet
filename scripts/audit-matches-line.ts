import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function auditMatchesLineByLine() {
    try {
        console.log("--- START AUDIT ---");
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'matches'
            ORDER BY ordinal_position
        `;
        for (const c of columns as any[]) {
            console.log(`FOUND_COLUMN: ${c.column_name}`);
        }
        console.log("--- END AUDIT ---");
    } catch (err: any) {
        console.error("AUDIT_ERROR:", err.message);
    }
}

auditMatchesLineByLine();

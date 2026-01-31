import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL!);
async function casingAudit() {
    try {
        console.log("CASING_AUDIT_START");
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'matches'
            AND table_schema = 'public'
        `;
        columns.forEach((c: any) => {
            console.log(`DB_COLUMN: ${c.column_name}`);
        });
        console.log("CASING_AUDIT_END");
    } catch (err: any) {
        console.error("ERROR:", err.message);
    }
}
casingAudit();

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL!);
async function crossSchemaAudit() {
    try {
        console.log("SCHEMA_AUDIT_START");
        const tables = await sql`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'matches'
        `;
        console.log("MATCHES_TABLES_FOUND:", JSON.stringify(tables));

        const currentUser = await sql`SELECT current_user`;
        console.log("CURRENT_USER:", JSON.stringify(currentUser));

        console.log("SCHEMA_AUDIT_END");
    } catch (err: any) {
        console.error("AUDIT_ERROR:", err.message);
    }
}
crossSchemaAudit();

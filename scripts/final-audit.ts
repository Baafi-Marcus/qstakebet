import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL!);
async function finalAudit() {
    try {
        console.log("DB_AUDIT_START");
        const tables = await sql`SELECT table_schema, table_name, table_type FROM information_schema.tables WHERE table_name = 'matches'`;
        console.log("MATCHES_TABLES:", JSON.stringify(tables));

        const columns = await sql`SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'matches' AND table_schema = 'public' ORDER BY ordinal_position`;
        console.log("MATCHES_COLUMNS_PUBLIC:", JSON.stringify(columns));

        const path = await sql`SHOW search_path`;
        console.log("SEARCH_PATH:", JSON.stringify(path));

        console.log("DB_AUDIT_END");
    } catch (err: any) {
        console.error("AUDIT_ERROR:", err.message);
    }
}
finalAudit();

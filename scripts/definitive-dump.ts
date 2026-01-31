import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function definitiveDump() {
    try {
        console.log("--- DEFINITIVE_SCHEMA_DUMP ---");
        const columns = await sql`
            SELECT table_schema, table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `;

        for (const c of columns as any[]) {
            console.log(`SCHEMA:${c.table_schema} TABLE:${c.table_name} COLUMN:${c.column_name}`);
        }
        console.log("--- END_DUMP ---");
    } catch (err: any) {
        console.error("DUMP_ERROR:", err.message);
    }
}

definitiveDump();

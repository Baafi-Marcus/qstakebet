import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function dumpSchema() {
    try {
        const columns = await sql`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `;

        const tables: Record<string, string[]> = {};
        columns.forEach((c: any) => {
            if (!tables[c.table_name]) tables[c.table_name] = [];
            tables[c.table_name].push(c.column_name);
        });

        console.log("DATABASE_SCHEMA_DUMP:");
        Object.entries(tables).forEach(([table, cols]) => {
            console.log(`${table}: ${cols.join(", ")}`);
        });

    } catch (err) {
        console.error("Error:", err);
    }
}

dumpSchema();

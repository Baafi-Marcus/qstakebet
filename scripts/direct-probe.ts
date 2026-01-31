import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL!);
async function directProbe() {
    try {
        console.log("PROBE_START");
        // We use a raw query and don't specify column names to see what's there
        const results = await (sql as any)('SELECT * FROM public.matches LIMIT 1');
        if (results.length > 0) {
            console.log("COLUMNS_FOUND:", Object.keys(results[0]).join(", "));
        } else {
            // If empty, we can check the information_schema again but with simpler query
            const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'matches'`;
            console.log("COLUMNS_INFO:", columns.map((c: any) => c.column_name).join(", "));
        }
        console.log("PROBE_END");
    } catch (err: any) {
        console.error("PROBE_ERROR:", err.message);
    }
}
directProbe();

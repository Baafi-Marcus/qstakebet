import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}

const sql = neon(url);

async function test() {
    console.log("Testing connection to:", url);
    try {
        const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log("Tables in public schema:", result.map(t => t.table_name));

        const schoolsResult = await sql`SELECT * FROM schools LIMIT 5`;
        console.log("Schools sample:", schoolsResult);
    } catch (err) {
        console.error("Error during query:", err);
    }
}

test();

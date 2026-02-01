import "dotenv/config"
import { neon } from "@neondatabase/serverless"

async function listTables() {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    console.log("Tables in DB:", result.map(r => r.table_name))
}

listTables().catch(console.error)

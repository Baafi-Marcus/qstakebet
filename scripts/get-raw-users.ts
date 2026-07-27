import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local" })

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing")
    process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function main() {
    try {
        const res = await sql`SELECT id, phone, role, name, email FROM users LIMIT 20;`
        console.log("SUCCESS: Raw users in database:")
        console.dir(res, { depth: null })
    } catch (e: any) {
        console.error("FAILED to query raw users:", e.message || e)
    }
}

main()

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
        console.log("Checking user role in database...")
        const user = await sql`
            SELECT id, name, phone, role FROM users WHERE phone = '0544865254';
        `
        console.log("User record found:", JSON.stringify(user, null, 2))
    } catch (e: any) {
        console.error("Query failed:", e.message || e)
    }
}

main()

import "dotenv/config"
import { Pool } from "@neondatabase/serverless"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT`)
    const existing = await pool.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_username_unique'`
    )
    if (existing.rows.length === 0) {
        await pool.query(`CREATE UNIQUE INDEX users_username_unique ON users (username)`)
    }
    console.log("users.username column + unique index ready")
    await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })

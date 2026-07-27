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
        console.log("🚀 Starting database schema update for custom chat rooms...")

        // 1. Create chat_rooms table
        console.log("Creating 'chat_rooms' table...")
        await sql`
            CREATE TABLE IF NOT EXISTS chat_rooms (
                id text PRIMARY KEY,
                name text NOT NULL,
                creator_id text NOT NULL,
                is_public boolean DEFAULT true NOT NULL,
                invite_code text UNIQUE NOT NULL,
                created_at timestamp DEFAULT now()
            );
        `

        // 2. Create chat_room_members table
        console.log("Creating 'chat_room_members' table...")
        await sql`
            CREATE TABLE IF NOT EXISTS chat_room_members (
                id text PRIMARY KEY,
                room_id text NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
                user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                joined_at timestamp DEFAULT now()
            );
        `

        // 3. Add column to chat_messages table
        console.log("Adding 'room_id' column to 'chat_messages' table...")
        await sql`
            ALTER TABLE chat_messages 
            ADD COLUMN IF NOT EXISTS room_id text REFERENCES chat_rooms(id) ON DELETE SET NULL;
        `

        console.log("✅ SUCCESS: Chat rooms tables and columns successfully migrated.")
    } catch (e: any) {
        console.error("❌ Migration failed:", e.message || e)
    }
}

main()

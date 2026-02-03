
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./lib/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing from .env.local");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });


import * as fs from 'fs';

async function checkAdmins() {
    console.log("🔍 Checking for admin users...");
    const result: any = { admins: [], candidates: [] };

    try {
        const admins = await db.select().from(schema.users).where(eq(schema.users.role, "admin"));

        if (admins.length === 0) {
            console.log("⚠️ No admin users found!");

            // Check mostly likely candidates (users who might have been intended as admins)
            const allUsers = await db.select().from(schema.users).limit(5);
            result.candidates = allUsers;
        } else {
            console.log(`✅ Found ${admins.length} admin(s):`);
            result.admins = admins;
        }

        fs.writeFileSync('debug_result.json', JSON.stringify(result, null, 2));
        console.log("Written to debug_result.json");
    } catch (e) {
        console.error("❌ Error querying database:", e);
    }
}

checkAdmins();

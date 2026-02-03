import { db } from "./lib/db"
import { users } from "./lib/db/schema"
import { eq } from "drizzle-orm"

async function checkAdminUsers() {
    const adminUsers = await db.select().from(users).where(eq(users.role, "admin"))
    console.log("Admin Users:", JSON.stringify(adminUsers, null, 2))
}

checkAdminUsers().catch(console.error)

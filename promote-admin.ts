import "dotenv/config"
import { db } from "./lib/db"
import { users } from "./lib/db/schema"
import { eq } from "drizzle-orm"

async function promoteUsers() {
    console.log("Loading DB URL:", process.env.DATABASE_URL?.substring(0, 20) + "...")

    // Promote specific user to admin
    const result = await db.update(users)
        .set({ role: "admin" })
        .where(eq(users.phone, "0544865254"))

    console.log("Promotion completed. Check if any users were updated.")

    const allUsers = await db.select().from(users)
    console.log("Current Users & Roles:", allUsers.map(u => ({ phone: u.phone, role: u.role })))
}

promoteUsers().catch(e => {
    console.error("Failed to promote users:", e)
})

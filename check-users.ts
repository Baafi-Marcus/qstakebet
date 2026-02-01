import "dotenv/config"
import { db } from "./lib/db"
import { users } from "./lib/db/schema"

console.log("DB URL Loaded:", process.env.DATABASE_URL ? "Yes (starts with " + process.env.DATABASE_URL.substring(0, 10) + "...)" : "No")

async function checkDB() {
    const allUsers = await db.select().from(users)
    console.log("Users in DB:", allUsers.map(u => ({ id: u.id, phone: u.phone, role: u.role })))

    const { wallets, bets } = await import("./lib/db/schema")
    const allWallets = await db.select().from(wallets)
    console.log("Wallets in DB:", allWallets.length)

    const allBets = await db.select().from(bets)
    console.log("Bets in DB:", allBets.length)
}

checkDB().catch(console.error)

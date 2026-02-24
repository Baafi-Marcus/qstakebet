
import "dotenv/config";
import { db } from "./lib/db/index";
import { bets, users } from "./lib/db/schema";
import { desc, eq } from "drizzle-orm";

async function checkRecentBets() {
    console.log("Fetching recent bets...");
    try {
        const recentBets = await db.select({
            id: bets.id,
            status: bets.status,
            mode: bets.mode,
            stake: bets.stake,
            potentialPayout: bets.potentialPayout,
            createdAt: bets.createdAt,
            settledAt: bets.settledAt,
            userEmail: users.email
        })
            .from(bets)
            .leftJoin(users, eq(bets.userId, users.id))
            .orderBy(desc(bets.createdAt))
            .limit(5);

        console.table(recentBets);
    } catch (error) {
        console.error("Error fetching bets:", error);
    }
    process.exit(0);
}

checkRecentBets();


import * as dotenv from "dotenv";
dotenv.config();

const { db } = require("../lib/db");
const { matches, bets, transactions, wallets } = require("../lib/db/schema");
const { eq, inArray } = require("drizzle-orm");

async function main() {
    try {
        const matchIds = ['mtc-9t8hqdiyd', 'mtc-gcoqpxuqe'];
        console.log(`Resetting matches: ${matchIds.join(', ')}`);

        // 1. Reset matches to upcoming
        await db.update(matches).set({
            status: 'upcoming',
            result: null,
            isLive: false,
            liveMetadata: null
        }).where(inArray(matches.id, matchIds));

        // 2. We should ideally also reset the bets associated with these matches if they were settled.
        // For bet-jg6weirec, it was already reset to pending by my previous script.
        // Let's ensure ANY bet associated with these matches is set back to pending if it was settled.
        // This is complex for multi-bets if they have other settled legs, but for now, let's just 
        // focus on letting the admin re-enter scores.

        console.log("✅ Matches reset successfully.");
    } catch (e) {
        console.error("❌ Reset failed:", e);
    }
    process.exit(0);
}

main();

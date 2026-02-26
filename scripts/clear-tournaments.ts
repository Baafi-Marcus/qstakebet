import { db } from "../lib/db";
import {
    matchHistory,
    matches,
    tournaments,
    bets
} from "../lib/db/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function clearTournamentsAndMatches() {
    console.log("Starting DB wipe for tournaments, matches, and associated history...");

    try {
        console.log("1. Deleting all active bets (they reference matches)...");
        await db.delete(bets);

        console.log("2. Deleting match_history...");
        await db.delete(matchHistory);

        console.log("3. Deleting matches...");
        await db.delete(matches);

        console.log("4. Deleting tournaments...");
        await db.delete(tournaments);

        console.log("✅ Successfully cleared tournaments, matches, history, and bets.");
    } catch (error) {
        console.error("❌ Failed to clear database:", error);
    }

    process.exit(0);
}

clearTournamentsAndMatches();

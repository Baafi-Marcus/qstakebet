import { config } from "dotenv";
config({ path: ".env.local" });
import { isNotNull } from "drizzle-orm";

async function main() {
    console.log("Cleaning up database...");

    const { db } = await import("../lib/db");
    const { matches, tournaments, matchHistory, chatRooms } = await import("../lib/db/schema");

    try {
        console.log("Deleting match history...");
        await db.delete(matchHistory);

        console.log("Deleting all matches...");
        await db.delete(matches);

        console.log("Deleting all tournaments...");
        await db.delete(tournaments);

        console.log("Successfully cleared all matches and tournaments!");
    } catch (error) {
        console.error("Error clearing database:", error);
    }
    process.exit(0);
}

main();

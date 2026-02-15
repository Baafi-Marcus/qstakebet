import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { processMatchTicks, initializeLiveMatch } from "../lib/match-engine";
import { db } from "../lib/db";
import { matches } from "../lib/db/schema";
import { and, eq, isNull, lte } from "drizzle-orm";

async function main() {
    console.log("🚀 Live Match Engine Daemon Started.");
    console.log("Press Ctrl+C to stop.");

    // Loop forever
    while (true) {
        try {
            const now = new Date();
            console.log(`[${now.toLocaleTimeString()}] Ticking Match Engine...`);

            // 1. Find upcoming matches that should be starting now
            const upcomingToStart = await db.select().from(matches).where(
                and(
                    eq(matches.status, 'upcoming'),
                    lte(matches.scheduledAt, now)
                )
            );

            for (const match of upcomingToStart) {
                console.log(`Starting match: ${match.id}`);
                await initializeLiveMatch(match.id);
            }

            // 2. Process ticks for already live matches
            await processMatchTicks();

        } catch (error) {
            console.error("Engine tick failed:", error);
        }

        // Wait 30 seconds before next tick
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

main().catch(error => {
    console.error("Daemon crashed:", error);
    process.exit(1);
});

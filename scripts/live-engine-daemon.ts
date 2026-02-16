import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { processMatchTicks, initializeLiveMatch } from "../lib/match-engine";
import { db } from "../lib/db";
import { matches } from "../lib/db/schema";
import { and, eq, isNull, lte } from "drizzle-orm";

const SPORT_TIMEOUTS: Record<string, number> = {
    'football': 2.5 * 60 * 60 * 1000,
    'handball': 1.5 * 60 * 60 * 1000,
    'basketball': 2.5 * 60 * 60 * 1000,
    'volleyball': 2.0 * 60 * 60 * 1000,
    'quiz': 1.5 * 60 * 60 * 1000,
    'athletics': 4.0 * 60 * 60 * 1000,
};

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
                console.log(`Starting match automatically: ${match.id} (${match.sportType})`);
                await initializeLiveMatch(match.id);
            }

            // 2. Find live matches that have reached their autoEndAt time or specific timeout
            const liveMatches = await db.select().from(matches).where(eq(matches.status, 'live'));
            for (const match of liveMatches) {
                let shouldEnd = false;
                let reason = "";
                const startTime = match.scheduledAt || match.createdAt || now;
                const duration = now.getTime() - new Date(startTime).getTime();

                // 1. Explicit auto-end time set by admin
                if (match.autoEndAt && now >= new Date(match.autoEndAt)) {
                    shouldEnd = true;
                    reason = "scheduled_auto_end";
                }
                // 2. Fallback to sport-specific logic if NO explicit autoEndAt is set
                else if (!match.autoEndAt) {
                    const timeout = SPORT_TIMEOUTS[match.sportType] || (3 * 60 * 60 * 1000); // 3h default
                    if (duration > timeout) {
                        shouldEnd = true;
                        reason = "sport_timeout_auto_end";
                    }
                }

                if (shouldEnd) {
                    console.log(`Auto-ending match due to ${reason}: ${match.id} (${match.sportType})`);
                    const { recordMatchUpdate } = await import("../lib/match-helpers");

                    // Log to history
                    await recordMatchUpdate({
                        matchId: match.id,
                        action: "status_change",
                        previousData: { status: 'live' },
                        newData: { status: 'pending' },
                        metadata: { reason, durationMinutes: Math.floor(duration / 60000) }
                    });

                    await db.update(matches).set({
                        status: 'pending',
                        isLive: false,
                        lastTickAt: now
                    }).where(eq(matches.id, match.id));
                }
            }

            // 3. Process ticks for already live matches
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

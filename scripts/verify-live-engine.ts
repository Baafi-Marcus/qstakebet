import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { db } from "../lib/db";
import { matches, schools } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { initializeLiveMatch, processMatchTicks } from "../lib/match-engine";

async function verify() {
    console.log("🔍 Verifying Live Match Engine...");

    // 1. Create a dummy match
    const matchId = `test-live-${Date.now()}`;
    const allSchools = await db.select().from(schools).limit(3);

    if (allSchools.length < 3) {
        console.error("Need at least 3 schools in DB to test.");
        return;
    }

    const participants = allSchools.map(s => ({
        schoolId: s.id,
        name: s.name,
        odd: 1.5 + Math.random()
    }));

    await db.insert(matches).values({
        id: matchId,
        participants,
        startTime: "Live Test",
        scheduledAt: new Date(Date.now() - 1000), // 1 second ago
        status: 'upcoming',
        stage: "Test Final",
        odds: {},
        isVirtual: false,
        sportType: 'quiz'
    });

    console.log(`✅ Created test match: ${matchId}`);

    // 2. Initialize
    process.stdout.write("Initializing match... ");
    await initializeLiveMatch(matchId);

    let match = (await db.select().from(matches).where(eq(matches.id, matchId)))[0];
    if (match.status === 'live' && match.liveMetadata) {
        console.log("SUCCESS");
    } else {
        console.log("FAILED");
        return;
    }

    // 3. Simulate Ticks
    console.log("Simulating ticks...");
    for (let i = 0; i < 6; i++) {
        // Mock the lastTickAt to be 2 minutes ago to force a tick
        await db.update(matches).set({
            lastTickAt: new Date(Date.now() - 120000)
        }).where(eq(matches.id, matchId));

        await processMatchTicks();

        match = (await db.select().from(matches).where(eq(matches.id, matchId)))[0];
        console.log(`Tick ${i + 1}: Status=${match.status}, Round=${match.currentRound}, Scores=${JSON.stringify((match.result as any)?.totalScores)}`);

        if (match.status === 'finished') break;
    }

    if (match.status === 'finished') {
        console.log("🏁 Match finished successfully.");
    } else {
        console.log("❌ Match did not finish as expected.");
    }
}

verify().catch(console.error);

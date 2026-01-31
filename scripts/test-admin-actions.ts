
import "dotenv/config";
import { createTournament, createMatch } from "../lib/admin-actions";
import { db } from "../lib/db";
import { schools } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function testAdminActions() {
    console.log("Starting Admin Actions Test...");

    try {
        // 1. Create Tournament
        console.log("Creating Test Tournament...");
        const t = await createTournament({
            name: "Automated Test Cup 2026",
            region: "Ashanti",
            sportType: "football",
            gender: "male",
            year: "2026"
        });
        console.log("Tournament Created:", t[0].id, t[0].name);

        // 2. Fetch 2 random schools
        const s = await db.select().from(schools).limit(2);
        if (s.length < 2) throw new Error("Not enough schools to test match creation");
        const schoolIds = s.map(sch => sch.id);
        console.log("Selected Schools:", s.map(sch => sch.name).join(" vs "));

        // 3. Create Match
        console.log("Creating Test Match...");
        const m = await createMatch({
            tournamentId: t[0].id,
            schoolIds: schoolIds,
            stage: "Test Stage",
            startTime: "Tomorrow 15:00",
            sportType: "football",
            gender: "male"
        });

        console.log("Match Created:", m[0].id);
        console.log("Participants:", JSON.stringify(m[0].participants, null, 2));
        console.log("Generated Odds:", JSON.stringify(m[0].odds, null, 2));

        if (Object.keys(m[0].odds).length > 0) {
            console.log("SUCCESS: Odds generated.");
        } else {
            console.error("FAILURE: Odds empty.");
        }

    } catch (error) {
        console.error("Test Failed:", error);
    }

    process.exit(0);
}

testAdminActions();

import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { db } from "../lib/db";
import { schools, tournaments, matches } from "../lib/db/schema";
import { getAllMatchesWithTournaments } from "../lib/data";
import { createSchoolAction, createTournament, createMatch } from "../lib/admin-actions";

async function verifyLevels() {
    console.log("🔍 Verifying Multi-Level Support...");

    // 1. Create a University school
    console.log("Creating University school...");
    const schoolRes = await createSchoolAction({
        name: "University of Ghana (Legon)",
        region: "Greater Accra",
        level: "university"
    });

    if (!schoolRes.success || !schoolRes.school) {
        console.error("Failed to create university school");
        return;
    }
    const schoolId = schoolRes.school.id;
    console.log(`✅ Created: ${schoolRes.school.name} (ID: ${schoolId})`);

    // 2. Create a University tournament
    console.log("Creating University tournament...");
    const tmtRes = await createTournament({
        name: "UG Inter-Hall Quiz 2026",
        region: "Greater Accra",
        sportType: "quiz",
        gender: "mixed",
        year: "2026",
        level: "university"
    });

    const tmtId = tmtRes[0].id;
    console.log(`✅ Created: ${tmtRes[0].name} (ID: ${tmtId}, Level: ${tmtRes[0].level})`);

    // 3. Create a Match
    console.log("Creating University match...");
    await createMatch({
        tournamentId: tmtId,
        schoolIds: [schoolId], // Simplified for test
        stage: "Opening Round",
        startTime: new Date().toISOString(),
        sportType: "quiz",
        gender: "mixed"
    });

    // 4. Verify Fetching
    console.log("Verifying data fetching...");
    const allMatches = await getAllMatchesWithTournaments();
    const uniMatches = allMatches.filter(m => m.level === 'university');
    const shsMatches = allMatches.filter(m => m.level === 'shs');

    console.log(`📊 Statistics:`);
    console.log(`- University Matches: ${uniMatches.length}`);
    console.log(`- SHS Matches: ${shsMatches.length}`);

    if (uniMatches.length > 0) {
        console.log("✅ SUCCESS: Found university matches.");
        console.log(`   Sample: ${uniMatches[0].stage} in ${uniMatches[0].level} level.`);
    } else {
        console.log("❌ FAILED: No university matches found.");
    }
}

verifyLevels().catch(console.error);

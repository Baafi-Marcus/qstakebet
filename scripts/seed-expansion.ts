import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { db } from "../lib/db"
import { schools, tournaments, schoolStrengths, matches } from "../lib/db/schema"

async function seed() {
    console.log("Seeding new competition structure...");

    // 1. Create Schools
    const schoolData = [
        { id: "sch-presec", name: "PRESEC Legon", region: "Greater Accra" },
        { id: "sch-owass", name: "Opoku Ware School", region: "Ashanti" },
        { id: "sch-prempeh", name: "Prempeh College", region: "Ashanti" },
        { id: "sch-mantsipim", name: "Mfantsipim School", region: "Central" },
        { id: "sch-augustines", name: "St. Augustine's College", region: "Central" },
        { id: "sch-weygeyhey", name: "Wesley Girls' High School", region: "Central" },
    ];

    console.log("Inserting schools...");
    for (const s of schoolData) {
        try {
            await db.insert(schools).values(s).onConflictDoNothing();
        } catch (e) {
            console.error(`Failed to insert school ${s.id}:`, e);
        }
    }

    // 2. Create Tournaments
    const tournamentData = [
        { id: "tmt-ashanti-fb-26", name: "Ashanti Inter-Schools Football 2026", region: "Ashanti", sportType: "football", gender: "male", year: "2026" },
        { id: "tmt-national-quiz-25", name: "National Science & Maths Quiz 2025", region: "National", sportType: "quiz", gender: "mixed", year: "2025" },
        { id: "tmt-accra-athl-26", name: "Greater Accra Girls Athletics 2026", region: "Greater Accra", sportType: "athletics", gender: "female", year: "2026" },
    ];

    console.log("Inserting tournaments...");
    for (const t of tournamentData) {
        try {
            await db.insert(tournaments).values(t).onConflictDoNothing();
        } catch (e) {
            console.error(`Failed to insert tournament ${t.id}:`, e);
        }
    }

    // 3. Create School Strengths
    const strengthData = [
        { id: "str-1", schoolId: "sch-presec", sportType: "quiz", gender: "mixed", rating: { overall: 95 } },
        { id: "str-2", schoolId: "sch-owass", sportType: "quiz", gender: "mixed", rating: { overall: 90 } },
        { id: "str-3", schoolId: "sch-prempeh", sportType: "quiz", gender: "mixed", rating: { overall: 92 } },
        { id: "str-4", schoolId: "sch-prempeh", sportType: "football", gender: "male", rating: { overall: 85 } },
        { id: "str-5", schoolId: "sch-owass", sportType: "football", gender: "male", rating: { overall: 88 } },
        { id: "str-6", schoolId: "sch-weygeyhey", sportType: "athletics", gender: "female", rating: { overall: 94 } },
    ];

    console.log("Inserting student strengths...");
    for (const s of strengthData) {
        try {
            await db.insert(schoolStrengths).values(s).onConflictDoNothing();
        } catch (e) {
            console.error(`Failed to insert strength ${s.id}:`, e);
        }
    }

    // 4. Create Sample Matches
    const matchData = [
        {
            id: "m-1",
            tournamentId: "tmt-ashanti-fb-26",
            participants: [
                { schoolId: "sch-prempeh", name: "Prempeh College", odd: 2.10 },
                { schoolId: "sch-owass", name: "Opoku Ware School", odd: 1.85 }
            ],
            startTime: "2026-02-15T15:00:00Z",
            isLive: false,
            stage: "Quarter Final",
            odds: {},
            sportType: "football",
            gender: "male",
            margin: 0.1
        },
        {
            id: "m-2",
            tournamentId: "tmt-national-quiz-25",
            participants: [
                { schoolId: "sch-presec", name: "PRESEC Legon", odd: 1.50 },
                { schoolId: "sch-owass", name: "Opoku Ware School", odd: 3.20 },
                { schoolId: "sch-prempeh", name: "Prempeh College", odd: 2.80 }
            ],
            startTime: "2025-10-20T10:00:00Z",
            isLive: true,
            stage: "National Final",
            odds: {},
            sportType: "quiz",
            gender: "mixed",
            margin: 0.1
        }
    ];

    console.log("Inserting sample matches...");
    for (const m of matchData) {
        try {
            await db.insert(matches).values(m as any).onConflictDoNothing();
        } catch (e) {
            console.error(`Failed to insert match ${m.id}:`, e);
        }
    }

    console.log("Seeding complete!");
}

seed().catch(console.error);

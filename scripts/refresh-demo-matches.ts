import "dotenv/config";
import { db } from "../lib/db";
import { matches, schools, tournaments, bets, bonuses } from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { simulateMatch } from "../lib/virtuals";

async function refreshDemoData() {
    console.log("🧹 Purging old demo data...");

    // 1. Purge Bonuses (reference bets)
    await db.delete(bonuses);
    // 2. Purge Bets (to allow deleting matches)
    await db.delete(bets);
    // 3. Purge Matches
    await db.delete(matches);
    console.log("✅ Matches, Bets, and Bonuses purged.");

    // 3. Ensure Core Schools Exist
    console.log("🏫 Seeding Core Schools...");
    const coreSchools = [
        // SHS
        { id: "presec-legon", name: "PRESEC Legon", level: "shs", region: "Greater Accra" },
        { id: "mfantsipim-school", name: "Mfantsipim School", level: "shs", region: "Central" },
        { id: "prempeh-college", name: "Prempeh College", level: "shs", region: "Ashanti" },
        { id: "opoku-ware-school", name: "Opoku Ware School", level: "shs", region: "Ashanti" },
        { id: "achimota-school", name: "Achimota School", level: "shs", region: "Greater Accra" },
        { id: "st-peter-shs", name: "St. Peter's SHS", level: "shs", region: "Eastern" },
        // University
        { id: "ug-legon-vandal", name: "Commonwealth Hall (Vandal)", level: "university", region: "Greater Accra" },
        { id: "ug-legon-sarbah", name: "Mensah Sarbah Hall", level: "university", region: "Greater Accra" },
        { id: "knust-unity", name: "Unity Hall (Conti)", level: "university", region: "Ashanti" },
        { id: "knust-katanga", name: "University Hall (Katanga)", level: "university", region: "Ashanti" }
    ];

    for (const s of coreSchools) {
        await db.insert(schools).values({
            id: s.id,
            name: s.name,
            level: s.level as any,
            region: s.region,
        }).onConflictDoUpdate({
            target: schools.id,
            set: { level: s.level as any, region: s.region }
        });
    }

    // 4. Ensure Tournaments Exist
    console.log("🏆 Seeding Tournaments...");
    const nsmq = await db.insert(tournaments).values({
        id: "nsmq-2026",
        name: "NSMQ 2026 National Championship",
        level: "shs",
        region: "National",
        sportType: "quiz",
        gender: "mixed",
        year: "2026",
        status: "active"
    }).onConflictDoUpdate({
        target: tournaments.id,
        set: { status: "active" }
    }).returning();

    const uniInterHall = await db.insert(tournaments).values({
        id: "ug-interhall-2026",
        name: "UG Inter-Hall Quiz 2026",
        level: "university",
        region: "Greater Accra",
        sportType: "quiz",
        gender: "mixed",
        year: "2026",
        status: "active"
    }).onConflictDoUpdate({
        target: tournaments.id,
        set: { status: "active" }
    }).returning();

    const nsmqId = nsmq[0]?.id || "nsmq-2026";
    const uniId = uniInterHall[0]?.id || "ug-interhall-2026";

    // 5. Seed Matches
    console.log("🎮 Seeding Demo Matches...");
    const now = new Date();

    // A. LIVE Match (Today)
    const liveStartTime = new Date(now.getTime() - 1000 * 60 * 30).toISOString(); // Started 30 mins ago
    const liveOutcome = simulateMatch(0, 77, undefined, 'national', undefined, {}, Date.now());
    await db.insert(matches).values({
        id: "demo-live-1",
        tournamentId: nsmqId,
        participants: [
            { schoolId: "presec-legon", name: "PRESEC Legon", odd: 1.45 },
            { schoolId: "mfantsipim-school", name: "Mfantsipim School", odd: 2.80 },
            { schoolId: "opoku-ware-school", name: "Opoku Ware School", odd: 5.50 }
        ],
        startTime: new Date(liveStartTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }),
        scheduledAt: new Date(liveStartTime),
        status: 'live',
        isLive: true,
        currentRound: 2,
        lastTickAt: now,
        liveMetadata: liveOutcome,
        result: {
            ...liveOutcome,
            rounds: liveOutcome.rounds.slice(0, 3), // Rounds 1, 2, 3 played
            totalScores: [25, 22, 18]
        },
        odds: { "presec-legon": 1.45, "mfantsipim-school": 2.80, "opoku-ware-school": 5.50 },
        extendedOdds: {
            roundWinner: { "PRESEC": 1.50, "Mfantsipim": 2.20, "Opoku Ware": 4.00 }
        },
        stage: "National Quarter-Finals",
        sportType: "quiz"
    });

    // B. Upcoming TODAY (University)
    const upcomingToday = new Date(now.getTime() + 1000 * 60 * 120); // Starts in 2 hours
    await db.insert(matches).values({
        id: "demo-upcoming-uni",
        tournamentId: uniId,
        participants: [
            { schoolId: "ug-legon-vandal", name: "Commonwealth Hall", odd: 2.10 },
            { schoolId: "ug-legon-sarbah", name: "Mensah Sarbah Hall", odd: 1.95 }
        ],
        startTime: upcomingToday.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }),
        scheduledAt: upcomingToday,
        status: 'upcoming',
        stage: "Opening Round",
        odds: { "ug-legon-vandal": 2.10, "ug-legon-sarbah": 1.95 },
        sportType: "quiz"
    });

    // C. Tomorrow (SHS)
    const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    await db.insert(matches).values({
        id: "demo-tomorrow-shs",
        tournamentId: nsmqId,
        participants: [
            { schoolId: "prempeh-college", name: "Prempeh College", odd: 1.25 },
            { schoolId: "achimota-school", name: "Achimota School", odd: 4.50 },
            { schoolId: "st-peter-shs", name: "St. Peter's SHS", odd: 7.00 }
        ],
        startTime: "10:00 AM",
        scheduledAt: tomorrow,
        status: 'upcoming',
        stage: "Regional Prelims",
        odds: { "prempeh-college": 1.25, "achimota-school": 4.50, "st-peter-shs": 7.00 },
        sportType: "quiz"
    });

    // D. TBD (Future)
    const futureTbd = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3); // 3 days later
    await db.insert(matches).values({
        id: "demo-future-tbd",
        tournamentId: nsmqId,
        participants: [
            { schoolId: "mfantsipim-school", name: "Mfantsipim School", odd: 2.50 },
            { schoolId: "presec-legon", name: "PRESEC Legon", odd: 1.80 }
        ],
        startTime: null, // TBD
        scheduledAt: futureTbd,
        status: 'upcoming',
        stage: "Semi-Final Contest",
        odds: { "mfantsipim-school": 2.50, "presec-legon": 1.80 },
        sportType: "quiz"
    });

    // E. Future Dated (Next Week)
    const nextWeek = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
    await db.insert(matches).values({
        id: "demo-grand-finale",
        tournamentId: nsmqId,
        participants: [
            { schoolId: "presec-legon", name: "PRESEC Legon", odd: 1.50 },
            { schoolId: "prempeh-college", name: "Prempeh College", odd: 2.50 },
            { schoolId: "mfantsipim-school", name: "Mfantsipim School", odd: 5.00 }
        ],
        startTime: "02:00 PM",
        scheduledAt: nextWeek,
        status: 'upcoming',
        stage: "Grand Finale",
        odds: { "presec-legon": 1.50, "prempeh-college": 2.50, "mfantsipim-school": 5.00 },
        sportType: "quiz"
    });

    console.log("🏁 Demo data refresh complete!");
    process.exit(0);
}

refreshDemoData().catch(err => {
    console.error("❌ Refersh failed:", err);
    process.exit(1);
});

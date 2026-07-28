import { db } from "../lib/db";
import { settleFantasyPoints } from "../lib/fantasy-actions";
import { users, fantasyLineups } from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Creating test user and lineup...");
        const userId = "test-usr-1";
        const lineupId = "test-fln-1";
        
        // Setup mock user
        await db.insert(users).values({
            id: userId,
            email: "test@fantasy.com",
            passwordHash: "xxx",
            phone: "1234567890",
            totalFantasyPoints: 0
        }).onConflictDoNothing();

        // Setup mock schools
        const schoolA = "sch-presec";
        const schoolB = "sch-owass";
        const schoolC = "sch-ketasco";

        await db.execute(sql`INSERT INTO schools (id, name, region) VALUES (${schoolA}, 'Presec', 'Greater Accra') ON CONFLICT DO NOTHING`);
        await db.execute(sql`INSERT INTO schools (id, name, region) VALUES (${schoolB}, 'Owass', 'Ashanti') ON CONFLICT DO NOTHING`);
        await db.execute(sql`INSERT INTO schools (id, name, region) VALUES (${schoolC}, 'Ketasco', 'Volta') ON CONFLICT DO NOTHING`);

        await db.insert(fantasyLineups).values({
            id: lineupId,
            userId: userId,
            school1Id: schoolA,
            school2Id: schoolB,
            school3Id: schoolC,
            gameWeek: "Week 1",
            pointsEarned: 0,
            rank: 0,
            substitutionsMade: 0,
            creditsSpent: 0,
            status: "active",
            pointsBreakdown: {}
        }).onConflictDoNothing();

        console.log("Settling match where Presec wins with 55 points...");
        // Presec wins 55-40 (margin 15) -> Base(55) + Win(15) + Margin(10) = 80 points
        await settleFantasyPoints("match-mock-1", {
            winner: schoolA,
            scores: {
                [schoolA]: 55,
                "sch-someother": 40
            }
        });

        // Check points
        const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
        const lineup = await db.query.fantasyLineups.findFirst({ where: eq(fantasyLineups.id, lineupId) });
        
        console.log(`User Total Points: ${user?.totalFantasyPoints}`);
        console.log(`Lineup Earned Points: ${lineup?.pointsEarned}`);
        console.log(`Lineup Breakdown:`, lineup?.pointsBreakdown);

        if (user?.totalFantasyPoints === 80) {
            console.log("SUCCESS! Points matched expectations.");
        } else {
            console.error("FAIL! Points did not match.");
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
    process.exit(0);
}

run();

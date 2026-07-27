import { db } from "@/lib/db"
import { matches, users, fantasyLineups } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { Match } from "@/lib/types"

// Betting settlement logic removed

export async function settleFantasyLineups(
    matchId: string,
    options: {
        perfectRound3SchoolIds?: string[];
        regionalStealsSchoolIds?: string[];
        dailyHighScoreSchoolIds?: string[];
        customScores?: Record<string, number>;
    }
) {
    try {
        console.log(`Settling fantasy lineups for match: ${matchId}`);

        // 1. Fetch match details
        const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
        if (!matchData.length) {
            return { success: false, error: "Match not found" };
        }

        const match = matchData[0];
        const result = match.result as {
            scores?: Record<string, number>;
        } | null;

        // Use custom override scores if provided, otherwise fallback to match results
        const finalScores = options.customScores || result?.scores || {};

        if (Object.keys(finalScores).length === 0) {
            return { success: false, error: "No final scores available to settle fantasy points" };
        }

        // Calculate fantasy points for each participating school
        const schoolPoints: Record<string, number> = {};
        for (const schoolId of Object.keys(finalScores)) {
            let pts = finalScores[schoolId] || 0;
            if (options.perfectRound3SchoolIds?.includes(schoolId)) pts += 10;
            if (options.regionalStealsSchoolIds?.includes(schoolId)) pts += 5;
            if (options.dailyHighScoreSchoolIds?.includes(schoolId)) pts += 20;
            schoolPoints[schoolId] = pts;
        }

        console.log("Calculated fantasy points per school:", schoolPoints);

        // 2. Fetch all lineups for the game week (the stage of this match)
        const lineups = await db.select()
            .from(fantasyLineups)
            .where(eq(fantasyLineups.gameWeek, match.stage));

        console.log(`Found ${lineups.length} lineups for game week: ${match.stage}`);

        let updatedCount = 0;

        for (const lineup of lineups) {
            const breakdown = { ...(lineup.pointsBreakdown as Record<string, number> || {}) };
            let isLineupUpdated = false;

            const checkAndAddPoints = (schoolId: string) => {
                if (schoolPoints[schoolId] !== undefined) {
                    breakdown[schoolId] = schoolPoints[schoolId];
                    isLineupUpdated = true;
                }
            };

            checkAndAddPoints(lineup.school1Id);
            checkAndAddPoints(lineup.school2Id);
            checkAndAddPoints(lineup.school3Id);

            if (isLineupUpdated) {
                const newTotalPoints = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
                const difference = newTotalPoints - lineup.pointsEarned;

                // Update fantasy lineup points
                await db.update(fantasyLineups)
                    .set({
                        pointsBreakdown: breakdown,
                        pointsEarned: newTotalPoints,
                        status: "settled",
                        updatedAt: new Date()
                    })
                    .where(eq(fantasyLineups.id, lineup.id));

                // Update user lifetime points
                if (difference !== 0) {
                    await db.update(users)
                        .set({
                            lifetimePoints: sql`${users.lifetimePoints} + ${difference}`
                        })
                        .where(eq(users.id, lineup.userId));
                }

                updatedCount++;
            }
        }

        // 3. Mark the match status as settled
        await db.update(matches)
            .set({ status: "settled" })
            .where(eq(matches.id, matchId));

        return { success: true, updatedLineupsCount: updatedCount };
    } catch (error) {
        console.error("Error settling fantasy lineups:", error);
        return { success: false, error: "Internal error during fantasy lineup settlement" };
    }
}


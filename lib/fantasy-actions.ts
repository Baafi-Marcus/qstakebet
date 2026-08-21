"use server"

import { db } from "@/lib/db"
import { users, schools, fantasyLineups, matches } from "@/lib/db/schema"
import { eq, and, or, desc, sql, inArray, asc } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function submitLineup(gameWeek: string, schoolIds: string[]) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "Please log in to submit a fantasy lineup" }
        }

        if (schoolIds.length !== 3) {
            return { success: false, error: "A fantasy lineup must contain exactly 3 schools" }
        }

        // Deadline check
        if (gameWeek !== "Off-Season" && gameWeek.startsWith("Matchday ")) {
            const stages = await getFantasyStages();
            let matchedStage = null;
            if (stages.currentStage?.gameWeek === gameWeek) matchedStage = stages.currentStage;
            if (stages.nextStage?.gameWeek === gameWeek) matchedStage = stages.nextStage;
            
            if (matchedStage) {
                 if (matchedStage.deadline && new Date() > matchedStage.deadline) {
                     return { success: false, error: "The deadline for this Matchday has already passed!" };
                 }
            } else {
                 return { success: false, error: "This Matchday is no longer active for drafting." };
            }
        }

        const userId = session.user.id

        // Fetch details of the selected schools
        const selectedSchools = await db.select()
            .from(schools)
            .where(
                or(
                    eq(schools.id, schoolIds[0]),
                    eq(schools.id, schoolIds[1]),
                    eq(schools.id, schoolIds[2])
                )
            )

        if (selectedSchools.length !== 3) {
            return { success: false, error: "One or more selected schools were not found in the database" }
        }

        // Calculate credit cost
        const getCreditCost = (category: string | null) => {
            if (category === 'A') return 50;
            if (category === 'B') return 30;
            return 20;
        }

        const totalCredits = selectedSchools.reduce((sum, s) => sum + getCreditCost(s.category), 0)

        if (totalCredits > 100) {
            return { success: false, error: `Your selected lineup cost is ${totalCredits} credits, which exceeds the 100-credit budget` }
        }

        // Check for existing lineup for this gameWeek
        const existing = await db.select()
            .from(fantasyLineups)
            .where(
                and(
                    eq(fantasyLineups.userId, userId),
                    eq(fantasyLineups.gameWeek, gameWeek)
                )
            )
            .limit(1)

        const lineupId = existing.length > 0 ? existing[0].id : `fln-${Math.random().toString(36).substr(2, 9)}`

        if (existing.length > 0) {
            const oldLineup = existing[0]
            const oldSchools = [oldLineup.school1Id, oldLineup.school2Id, oldLineup.school3Id]
            
            // Calculate how many new schools are not in the old lineup
            const newSubs = schoolIds.filter(id => !oldSchools.includes(id)).length
            
            await db.update(fantasyLineups)
                .set({
                    school1Id: schoolIds[0],
                    school2Id: schoolIds[1],
                    school3Id: schoolIds[2],
                    creditsSpent: totalCredits,
                    updatedAt: new Date(),
                    substitutionsMade: sql`substitutions_made + ${newSubs}`
                })
                .where(eq(fantasyLineups.id, lineupId))
        } else {
            await db.insert(fantasyLineups)
                .values({
                    id: lineupId,
                    userId,
                    gameWeek,
                    school1Id: schoolIds[0],
                    school2Id: schoolIds[1],
                    school3Id: schoolIds[2],
                    creditsSpent: totalCredits
                })
        }

        return { success: true, totalCredits }
    } catch (error: any) {
        console.error("Error in submitLineup:", error)
        return { success: false, error: error.message || "An unexpected error occurred" }
    }
}

export async function getUserLineup(userId: string, gameWeek: string) {
    try {
        const lineupData = await db.select({
            lineup: fantasyLineups,
            school1: schools,
        })
            .from(fantasyLineups)
            .leftJoin(schools, eq(fantasyLineups.school1Id, schools.id))
            .where(
                and(
                    eq(fantasyLineups.userId, userId),
                    eq(fantasyLineups.gameWeek, gameWeek)
                )
            )
            .limit(1)

        if (!lineupData.length) return null

        const lineup = lineupData[0].lineup

        // Fetch other two schools
        const school2Data = await db.select().from(schools).where(eq(schools.id, lineup.school2Id)).limit(1)
        const school3Data = await db.select().from(schools).where(eq(schools.id, lineup.school3Id)).limit(1)

        return {
            id: lineup.id,
            gameWeek: lineup.gameWeek,
            creditsSpent: lineup.creditsSpent,
            pointsEarned: lineup.pointsEarned,
            substitutionsMade: lineup.substitutionsMade,
            status: lineup.status,
            createdAt: lineup.createdAt,
            schools: [
                lineupData[0].school1,
                school2Data[0] || null,
                school3Data[0] || null
            ].filter(Boolean).map(school => ({
                id: school!.id,
                name: school!.name,
                region: school!.region,
                tier: school!.category || 'C',
                creditCost: school!.category === 'A' ? 50 : school!.category === 'B' ? 30 : 20
            }))
        }
    } catch (error) {
        console.error("Error in getUserLineup:", error)
        return null
    }
}

export async function getLeaderboard(gameWeek?: string) {
    try {
        if (gameWeek) {
            // Retrieve points for specific game week
            const results = await db.select({
                username: users.name,
                almaMater: users.almaMater,
                points: fantasyLineups.pointsEarned,
            })
                .from(fantasyLineups)
                .innerJoin(users, eq(fantasyLineups.userId, users.id))
                .where(eq(fantasyLineups.gameWeek, gameWeek))
                .orderBy(desc(fantasyLineups.pointsEarned))
                .limit(50)

            return results
        } else {
            // Retrieve lifetime rankings
            const results = await db.select({
                username: users.name,
                almaMater: users.almaMater,
                points: users.totalFantasyPoints,
            })
                .from(users)
                .orderBy(desc(users.totalFantasyPoints))
                .limit(50)

            return results
        }
    } catch (error) {
        console.error("Error in getLeaderboard:", error)
        return []
    }
}

export async function getUserFantasyStats() {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "Not logged in" }
        
        const userData = await db.select({
            totalFantasyPoints: users.totalFantasyPoints,
            almaMater: users.almaMater
        })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1)
            
        if (!userData.length) return { success: false, error: "User not found" }
        return { 
            success: true, 
            totalFantasyPoints: userData[0].totalFantasyPoints, 
            almaMater: userData[0].almaMater 
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Calculates and updates the points for all fantasy lineups
 * when a match finishes.
 */
export async function settleFantasyPoints(matchId: string, resultData: any) {
    if (!resultData || !resultData.winner) {
        console.error("Cannot settle fantasy points: Invalid match result data");
        return;
    }

    const { winner, scores } = resultData;
    
    // Find all lineups that contain at least one of the participating schools
    const participatingSchoolIds = Object.keys(scores);
    
    if (participatingSchoolIds.length === 0) return;

    const affectedLineups = await db.query.fantasyLineups.findMany({
        where: or(
            ...participatingSchoolIds.map(id => eq(fantasyLineups.school1Id, id)),
            ...participatingSchoolIds.map(id => eq(fantasyLineups.school2Id, id)),
            ...participatingSchoolIds.map(id => eq(fantasyLineups.school3Id, id))
        )
    });

    if (affectedLineups.length === 0) return;

    console.log(`Settling points for ${affectedLineups.length} lineups...`);

    // Process each lineup
    for (const lineup of affectedLineups) {
        const schoolsInLineup = [lineup.school1Id, lineup.school2Id, lineup.school3Id];
        let totalPointsEarnedInMatch = 0;
        
        // Initialize pointsBreakdown if it doesn't exist
        const breakdown = (lineup.pointsBreakdown as Record<string, any>) || {};
        
        // Ensure idempotency: skip if we already scored this match for this lineup
        if (breakdown[matchId]) continue;
        
        const matchBreakdown: Record<string, any> = {};

        for (const schoolId of schoolsInLineup) {
            // Check if this school was in the match
            if (participatingSchoolIds.includes(schoolId)) {
                const schoolScore = scores[schoolId] || 0;
                let points = schoolScore; // Base points
                
                matchBreakdown[schoolId] = {
                    base: schoolScore,
                    bonus: 0
                };

                // Win Bonus
                if (schoolId === winner) {
                    points += 15;
                    matchBreakdown[schoolId].bonus += 15;
                    
                    // Margin Bonus
                    // Find the second highest score to calculate margin
                    const otherScores = participatingSchoolIds
                        .filter(id => id !== winner)
                        .map(id => scores[id] || 0);
                        
                    const maxOtherScore = Math.max(...otherScores, 0);
                    const margin = schoolScore - maxOtherScore;
                    
                    if (margin >= 10) {
                        points += 10;
                        matchBreakdown[schoolId].bonus += 10;
                    }
                }
                
                matchBreakdown[schoolId].total = points;
                totalPointsEarnedInMatch += points;
            }
        }

        // If no points were earned from this match, skip updating
        if (totalPointsEarnedInMatch === 0) continue;

        breakdown[matchId] = matchBreakdown;

        // Update the lineup
        await db.update(fantasyLineups)
            .set({
                pointsEarned: sql`${fantasyLineups.pointsEarned} + ${totalPointsEarnedInMatch}`,
                pointsBreakdown: breakdown
            })
            .where(eq(fantasyLineups.id, lineup.id));

        // Update the user's total points globally
        await db.update(users)
            .set({
                totalFantasyPoints: sql`${users.totalFantasyPoints} + ${totalPointsEarnedInMatch}`
            })
            .where(eq(users.id, lineup.userId));
    }
}

export async function getFantasyStages() {
    try {
        // Fetch all matches that are not completely finished or settled
        const rawMatches = await db.select({ scheduledAt: matches.scheduledAt, status: matches.status })
            .from(matches)
            .where(sql`${matches.status} NOT IN ('finished', 'settled')`)
            .orderBy(asc(matches.scheduledAt));

        const matchdays = new Map<string, { dateStr: string, deadline: Date, hasOngoing: boolean }>();
        
        for (const m of rawMatches) {
            if (!m.scheduledAt) continue;
            const dateStr = m.scheduledAt.toISOString().split('T')[0];
            if (!matchdays.has(dateStr)) {
                matchdays.set(dateStr, {
                    dateStr,
                    deadline: m.scheduledAt, 
                    hasOngoing: m.status === 'in_progress'
                });
            } else {
                if (m.status === 'in_progress') {
                    const existing = matchdays.get(dateStr)!;
                    existing.hasOngoing = true;
                }
            }
        }

        const sortedDates = Array.from(matchdays.values()).sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

        let currentStage = null;
        let nextStage = null;
        const now = new Date();

        for (const md of sortedDates) {
            const gw = `Matchday ${md.dateStr}`;
            if (md.deadline <= now || md.hasOngoing) {
                // Locked/Ongoing
                currentStage = {
                    gameWeek: gw,
                    deadline: md.deadline,
                    isLocked: true
                };
            } else {
                // Open for drafting
                if (!nextStage) {
                    nextStage = {
                        gameWeek: gw,
                        deadline: md.deadline,
                        isLocked: false
                    };
                    if (currentStage) break;
                }
            }
        }

        return {
            currentStage: currentStage || null,
            nextStage: nextStage || null,
            isOffSeason: !currentStage && !nextStage
        };
    } catch (error) {
        console.error("Error getting fantasy stages:", error);
        return { currentStage: null, nextStage: null, isOffSeason: true };
    }
}

export async function getParticipatingSchoolsForStage(gameWeek: string) {
    if (gameWeek === "Off-Season" || !gameWeek.startsWith("Matchday ")) return [];
    
    try {
        const dateStr = gameWeek.replace("Matchday ", "");
        
        const stageMatches = await db.select({ participants: matches.participants })
            .from(matches)
            .where(sql`DATE(${matches.scheduledAt}) = ${dateStr}::date`);
            
        const participatingSchoolIds = new Set<string>();
        
        for (const match of stageMatches) {
            const participants = match.participants as any[];
            if (participants && Array.isArray(participants)) {
                for (const p of participants) {
                    if (p.schoolId) {
                        participatingSchoolIds.add(p.schoolId);
                    }
                }
            }
        }
        
        if (participatingSchoolIds.size === 0) return [];
        
        const dbSchools = await db.select()
            .from(schools)
            .where(inArray(schools.id, Array.from(participatingSchoolIds)))
            .orderBy(schools.category, schools.name);
            
        return dbSchools.map(school => ({
            id: school.id,
            name: school.name,
            region: school.region,
            tier: school.category || 'C',
            creditCost: school.category === 'A' ? 50 : school.category === 'B' ? 30 : 20
        }));
    } catch (error) {
        console.error("Error getting participating schools:", error);
        return [];
    }
}

export async function getActiveFantasyStage() {
    const stages = await getFantasyStages();
    if (stages.currentStage) return stages.currentStage;
    if (stages.nextStage) return stages.nextStage;
    return { gameWeek: "Off-Season", deadline: null, isOffSeason: true };
}


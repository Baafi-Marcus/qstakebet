"use server"

import { db } from "@/lib/db"
import { users, schools, fantasyLineups, matches, quarterFinalPredictions, semiFinalPredictions, grandFinalPredictions } from "@/lib/db/schema"
import { eq, and, or, desc, sql, inArray, asc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { isPlayoffStage } from "@/lib/playoff-stages"

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
            pointsBreakdown: lineup.pointsBreakdown,
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

/**
 * Fetches every lineup a user has ever saved, one per matchday,
 * with resolved school details - for the My Squad history switcher.
 */
export async function getUserLineupHistory(userId: string) {
    try {
        const lineups = await db.select()
            .from(fantasyLineups)
            .where(eq(fantasyLineups.userId, userId))
            .orderBy(asc(fantasyLineups.createdAt))

        if (!lineups.length) return []

        const schoolIds = Array.from(new Set(
            lineups.flatMap(l => [l.school1Id, l.school2Id, l.school3Id]).filter(Boolean)
        ))

        const dbSchools = await db.select().from(schools).where(inArray(schools.id, schoolIds))
        type HistorySchool = { id: string; name: string; region: string; tier: string; creditCost: number }
        const schoolMap = new Map<string, HistorySchool>(dbSchools.map(s => [s.id, {
            id: s.id,
            name: s.name,
            region: s.region,
            tier: s.category || 'C',
            creditCost: s.category === 'A' ? 50 : s.category === 'B' ? 30 : 20
        }]))

        return lineups.map(l => ({
            id: l.id,
            gameWeek: l.gameWeek,
            pointsEarned: l.pointsEarned,
            rank: l.rank,
            substitutionsMade: l.substitutionsMade,
            creditsSpent: l.creditsSpent,
            status: l.status,
            pointsBreakdown: l.pointsBreakdown as any,
            createdAt: l.createdAt,
            schools: [l.school1Id, l.school2Id, l.school3Id]
                .map(id => schoolMap.get(id))
                .filter((s): s is HistorySchool => !!s)
        }))
    } catch (error) {
        console.error("Error in getUserLineupHistory:", error)
        return []
    }
}

/**
 * Explains how a school in a lineup earned its fantasy points,
 * match by match: base score + win bonus (+2) + margin bonus (+5).
 */
export async function getLineupPointsExplanation(lineupId: string, schoolId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "Not logged in" }

        const rows = await db.select()
            .from(fantasyLineups)
            .where(
                and(
                    eq(fantasyLineups.id, lineupId),
                    eq(fantasyLineups.userId, session.user.id)
                )
            )
            .limit(1)

        if (!rows.length) return { success: false, error: "Lineup not found" }

        const breakdown = (rows[0].pointsBreakdown as Record<string, any>) || {}

        // Canonical shape: { matchId: { schoolId: { base, bonus, total } } }
        const matchIds = Object.keys(breakdown).filter(key => {
            const val = breakdown[key]
            return val && typeof val === 'object'
        })

        if (matchIds.length === 0 || !schoolId) {
            return { success: true, explanations: [] as any[] }
        }

        const matchRows = await db.select()
            .from(matches)
            .where(inArray(matches.id, matchIds))

        // Only contests this school actually took part in - never other schools' contests
        const explanations = matchRows
            .filter(match => ((match.participants as any[]) || []).some((p: any) => p.schoolId === schoolId))
            .map(match => {
                const entry = (breakdown[match.id] || {})[schoolId]
                const result = (match.result as any) || {}
                const scores: Record<string, number> = result.scores || {}

                const base = typeof entry?.base === 'number' ? entry.base : Number(scores[schoolId] ?? 0)
                const isWinner = result.winner === schoolId
                const others = Object.keys(scores).filter(id => id !== schoolId)
                const margin = isWinner ? base - Math.max(...(others.length ? others.map(id => Number(scores[id] ?? 0)) : [0])) : 0

                // Round-by-round progression for THIS school (cumulative), when available
                const rounds: { label: string, score: number }[] = []
                const pushRound = (label: string, v: any) => {
                    if (typeof v === 'number' && Number.isFinite(v)) rounds.push({ label, score: v })
                }
                const genericRounds = Array.isArray(result.rounds) ? result.rounds : []
                for (const rd of genericRounds) {
                    if (rd?.scores && schoolId in rd.scores) pushRound(String(rd.label || "Round"), rd.scores[schoolId])
                }
                if (rounds.length === 0) {
                    // Fallback: quiz per-round entry data (r1..r5)
                    const qd = result.metadata?.quizDetails?.[schoolId]
                    if (qd) {
                        const defs: [string, string][] = [["r1", "Round 1"], ["r2", "Round 2"], ["r3", "Round 3"], ["r4", "Round 4"], ["r5", "Round 5"]]
                        let cum = 0
                        for (const [key, label] of defs) {
                            const v = Number(qd[key])
                            if (!Number.isFinite(v)) continue
                            cum += v
                            rounds.push({ label, score: cum })
                        }
                    }
                }

                return {
                    matchId: match.id,
                    stage: match.stage as string,
                    dateLabel: match.scheduledAt
                        ? new Date(match.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                        : "",
                    sortTs: match.scheduledAt ? new Date(match.scheduledAt).getTime() : 0,
                    yourScore: base,
                    rounds,
                    winBonus: isWinner ? 2 : 0,
                    marginBonus: isWinner && margin >= 10 ? 5 : 0,
                    total: typeof entry?.total === 'number' ? entry.total : base + (isWinner ? 2 : 0) + (isWinner && margin >= 10 ? 5 : 0)
                }
            })
            .sort((a, b) => a.sortTs - b.sortTs)

        return { success: true, explanations }
    } catch (error) {
        console.error("Error in getLineupPointsExplanation:", error)
        return { success: false, error: "Failed to load points explanation" }
    }
}

export async function getLeaderboard(gameWeek?: string) {    try {
        if (gameWeek) {
            // Retrieve points for specific game week
            const results = await db.select({
                username: sql<string>`COALESCE(${users.username}, ${users.name})`,
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
                username: sql<string>`COALESCE(${users.username}, ${users.name})`,
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
                    points += 2;
                    matchBreakdown[schoolId].bonus += 2;
                    
                    // Margin Bonus
                    // Find the second highest score to calculate margin
                    const otherScores = participatingSchoolIds
                        .filter(id => id !== winner)
                        .map(id => scores[id] || 0);
                        
                    const maxOtherScore = Math.max(...otherScores, 0);
                    const margin = schoolScore - maxOtherScore;
                    
                    if (margin >= 10) {
                        points += 5;
                        matchBreakdown[schoolId].bonus += 5;
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
            .where(sql`DATE(${matches.scheduledAt}) = ${dateStr}::date AND ${matches.status} NOT IN ('finished', 'settled', 'cancelled')`);
            
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

export async function getFantasyGameWeeks() {
    try {
        const rows = await db.select({
            scheduledAt: matches.scheduledAt,
            status: matches.status
        })
            .from(matches)
            .orderBy(asc(matches.scheduledAt));

        const matchdays = new Map<string, { dateStr: string, deadline: Date, hasOngoing: boolean }>();

        for (const m of rows) {
            if (!m.scheduledAt) continue;
            const dateStr = m.scheduledAt.toISOString().split('T')[0];
            const existing = matchdays.get(dateStr);
            if (!existing) {
                matchdays.set(dateStr, { dateStr, deadline: m.scheduledAt, hasOngoing: m.status === 'in_progress' });
            } else if (m.status === 'in_progress') {
                existing.hasOngoing = true;
            }
        }

        return Array.from(matchdays.values())
            .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
            .map(md => ({
                gameWeek: `Matchday ${md.dateStr}`,
                deadline: md.deadline,
                hasOngoing: md.hasOngoing,
                isPast: md.deadline.getTime() < Date.now() && !md.hasOngoing
            }));
    } catch (error) {
        console.error("Error getting fantasy game weeks:", error);
        return [];
    }
}

// ============================================
// QUARTER-FINAL PREDICTOR
// ============================================

export async function getQuarterFinalPrediction(userId: string) {
    try {
        const result = await db.select()
            .from(quarterFinalPredictions)
            .where(eq(quarterFinalPredictions.userId, userId))
            .limit(1);
            
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("Error in getQuarterFinalPrediction:", error);
        return null;
    }
}

export async function saveQuarterFinalPrediction(
    predictions: { matchId: string; predictedWinnerId: string }[],
    wildcardMatchId: string | null,
    masterPickSchoolId: string | null
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Please log in to save predictions" };
        }
        const userId = session.user.id;

        // Fetch existing to check if locked
        const existing = await getQuarterFinalPrediction(userId);
        if (existing?.isLocked) {
            return { success: false, error: "Your predictions are already locked and cannot be changed." };
        }

        // Global deadline check
        const qfAll = await db.select()
            .from(matches)
            .orderBy(asc(matches.scheduledAt));

        const qfMatches = qfAll.filter((m) => isPlayoffStage(m.stage, "quarterFinal"));

        if (qfMatches.length > 0) {
            const firstMatch = qfMatches[0];
            const now = new Date();
            if (firstMatch.scheduledAt && now >= firstMatch.scheduledAt) {
                 return { success: false, error: "The global deadline for Quarter-Final predictions has passed." };
            }
        }

        const id = existing?.id || `qfp-${Math.random().toString(36).substr(2, 9)}`;

        if (existing) {
            await db.update(quarterFinalPredictions)
                .set({
                    predictions,
                    wildcardMatchId,
                    masterPickSchoolId,
                    updatedAt: new Date(),
                })
                .where(eq(quarterFinalPredictions.id, existing.id));
        } else {
            await db.insert(quarterFinalPredictions).values({
                id,
                userId,
                predictions,
                wildcardMatchId,
                masterPickSchoolId,
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in saveQuarterFinalPrediction:", error);
        return { success: false, error: error.message || "Failed to save predictions" };
    }
}

export async function getQuarterFinalLeaderboard() {
    try {
        const results = await db.select({
            username: sql<string>`COALESCE(${users.username}, ${users.name})`,
            almaMater: users.almaMater,
            points: quarterFinalPredictions.pointsEarned,
            predictions: quarterFinalPredictions.predictions,
        })
            .from(quarterFinalPredictions)
            .innerJoin(users, eq(quarterFinalPredictions.userId, users.id))
            .orderBy(desc(quarterFinalPredictions.pointsEarned))
            .limit(100);

        return results;
    } catch (error) {
        console.error("Error in getQuarterFinalLeaderboard:", error);
        return [];
    }
}

// ============================================
// SEMI-FINAL PREDICTOR (CONFIDENCE CHALLENGE)
// ============================================

export async function getSemiFinalPrediction(userId: string) {
    try {
        const result = await db.select()
            .from(semiFinalPredictions)
            .where(eq(semiFinalPredictions.userId, userId))
            .limit(1);
            
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("Error in getSemiFinalPrediction:", error);
        return null;
    }
}

export async function saveSemiFinalPrediction(
    predictions: { matchId: string; predictedWinnerId: string; confidence: number }[]
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Please log in to save predictions" };
        }
        const userId = session.user.id;

        // Fetch existing to check if locked
        const existing = await getSemiFinalPrediction(userId);
        if (existing?.isLocked) {
            return { success: false, error: "Your predictions are already locked and cannot be changed." };
        }

        // Global deadline check
        const sfAll = await db.select()
            .from(matches)
            .orderBy(asc(matches.scheduledAt));

        const sfMatches = sfAll.filter((m) => isPlayoffStage(m.stage, "semiFinal"));

        if (sfMatches.length > 0) {
            const firstMatch = sfMatches[0];
            const now = new Date();
            if (firstMatch.scheduledAt && now >= firstMatch.scheduledAt) {
                 return { success: false, error: "The global deadline for Semi-Final predictions has passed." };
            }
        }

        // Validation: Confidence multipliers
        if (predictions.length !== sfMatches.length && sfMatches.length > 0) {
            return { success: false, error: `You must predict a winner for all ${sfMatches.length} Semi-Final contests.` };
        }

        const confidences = predictions.map(p => p.confidence).sort((a, b) => a - b);
        const expectedConfidences = [1, 2, 3];
        const isValidConfidences = confidences.length === expectedConfidences.length && 
            confidences.every((val, index) => val === expectedConfidences[index]);

        if (!isValidConfidences) {
            return { success: false, error: "You must use each confidence multiplier (1x, 2x, 3x) exactly once." };
        }

        const id = existing?.id || `sfp-${Math.random().toString(36).substr(2, 9)}`;

        if (existing) {
            await db.update(semiFinalPredictions)
                .set({
                    predictions,
                    updatedAt: new Date(),
                })
                .where(eq(semiFinalPredictions.id, existing.id));
        } else {
            await db.insert(semiFinalPredictions).values({
                id,
                userId,
                predictions,
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in saveSemiFinalPrediction:", error);
        return { success: false, error: error.message || "Failed to save predictions" };
    }
}

export async function getSemiFinalLeaderboard() {
    try {
        const results = await db.select({
            username: sql<string>`COALESCE(${users.username}, ${users.name})`,
            almaMater: users.almaMater,
            points: semiFinalPredictions.pointsEarned,
            predictions: semiFinalPredictions.predictions,
        })
            .from(semiFinalPredictions)
            .innerJoin(users, eq(semiFinalPredictions.userId, users.id))
            .orderBy(desc(semiFinalPredictions.pointsEarned))
            .limit(100);

        return results;
    } catch (error) {
        console.error("Error in getSemiFinalLeaderboard:", error);
        return [];
    }
}

// ============================================
// GRAND FINAL PREDICTOR (ULTIMATE PREDICTOR)
// ============================================

export async function getGrandFinalPrediction(userId: string) {
    try {
        const result = await db.select()
            .from(grandFinalPredictions)
            .where(eq(grandFinalPredictions.userId, userId))
            .limit(1);
            
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("Error in getGrandFinalPrediction:", error);
        return null;
    }
}

export async function saveGrandFinalPrediction(
    championSchoolId: string,
    runnerUpSchoolId: string,
    marginRange: string,
    finalBoost: string
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Please log in to save predictions" };
        }
        const userId = session.user.id;

        // Fetch existing to check if locked
        const existing = await getGrandFinalPrediction(userId);
        if (existing?.isLocked) {
            return { success: false, error: "Your final predictions are already locked and cannot be changed." };
        }

        // Global deadline check
        const gfAll = await db.select()
            .from(matches);

        const gfMatches = gfAll.filter((m) => isPlayoffStage(m.stage, "grandFinal"));

        if (gfMatches.length > 0) {
            const firstMatch = gfMatches[0];
            const now = new Date();
            if (firstMatch.scheduledAt && now >= firstMatch.scheduledAt) {
                 return { success: false, error: "The global deadline for Grand Final predictions has passed." };
            }
        }

        // Validation
        if (!championSchoolId || !runnerUpSchoolId || !marginRange || !finalBoost) {
            return { success: false, error: "Please make selections for Champion, Runner-Up, Margin, and Final Boost." };
        }

        if (championSchoolId === runnerUpSchoolId) {
            return { success: false, error: "The selected Runner-Up cannot be the same school selected as Champion." };
        }

        const validMargins = ['1-5', '6-10', '11-20', '21-30', '31+'];
        if (!validMargins.includes(marginRange)) {
            return { success: false, error: "Invalid margin range selected." };
        }

        const validBoosts = ['champion', 'runner_up', 'margin'];
        if (!validBoosts.includes(finalBoost)) {
            return { success: false, error: "Invalid final boost target." };
        }

        const id = existing?.id || `gfp-${Math.random().toString(36).substr(2, 9)}`;

        if (existing) {
            await db.update(grandFinalPredictions)
                .set({
                    championSchoolId,
                    runnerUpSchoolId,
                    marginRange,
                    finalBoost,
                    updatedAt: new Date(),
                })
                .where(eq(grandFinalPredictions.id, existing.id));
        } else {
            await db.insert(grandFinalPredictions).values({
                id,
                userId,
                championSchoolId,
                runnerUpSchoolId,
                marginRange,
                finalBoost,
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in saveGrandFinalPrediction:", error);
        return { success: false, error: error.message || "Failed to save predictions" };
    }
}

export async function getGrandFinalLeaderboard() {
    try {
        const results = await db.select({
            username: sql<string>`COALESCE(${users.username}, ${users.name})`,
            almaMater: users.almaMater,
            points: grandFinalPredictions.pointsEarned,
            championSchoolId: grandFinalPredictions.championSchoolId,
            runnerUpSchoolId: grandFinalPredictions.runnerUpSchoolId,
        })
            .from(grandFinalPredictions)
            .innerJoin(users, eq(grandFinalPredictions.userId, users.id))
            .orderBy(desc(grandFinalPredictions.pointsEarned))
            .limit(100);

        return results;
    } catch (error) {
        console.error("Error in getGrandFinalLeaderboard:", error);
        return [];
    }
}

// ============================================
// MY PLAYOFF PREDICTIONS TRACKER
// ============================================

type PlayoffRow = {
    matchId: string
    label: string
    predictedSchoolId: string | null
    predictedName: string | null
    actualWinnerId: string | null
    actualWinnerName: string | null
    finished: boolean
    correct: boolean | null
    points: number
    confidence?: number | null
    bonus?: string[]
}

export async function getMyPlayoffPredictions() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" };
        }
        const userId = session.user.id;

        const all = await db.select({
            id: matches.id,
            stage: matches.stage,
            status: matches.status,
            scheduledAt: matches.scheduledAt,
            participants: matches.participants,
            result: matches.result,
            metadata: matches.metadata,
        }).from(matches);

        const byStage = (stage: "quarterFinal" | "semiFinal" | "grandFinal") =>
            all
                .filter((m) => isPlayoffStage(m.stage, stage))
                .sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0));

        const qfMatches = byStage("quarterFinal");
        const sfMatches = byStage("semiFinal");
        const gfMatches = byStage("grandFinal");

        const [qfPred, sfPred, gfPred] = await Promise.all([
            getQuarterFinalPrediction(userId),
            getSemiFinalPrediction(userId),
            getGrandFinalPrediction(userId),
        ]);

        type AnyMatch = (typeof all)[number];
        const playerName = (m: AnyMatch, schoolId: string | null) => {
            if (!schoolId) return null;
            const players = (m.participants as any[]) || [];
            return players.find(p => p.schoolId === schoolId)?.name ?? null;
        };
        const qfLabel = (m: AnyMatch, idx: number) => {
            const n = (m.metadata as any)?.qfLabel;
            return n != null ? `QF${n}` : `QF${idx + 1}`;
        };

        // ---- Quarter-Final breakdown ----
        const qfBreakdown: PlayoffRow[] = qfMatches.map((m, idx) => {
            const resObj = (m.result as any) || {};
            const winnerId = resObj.winner ?? null;
            const finished = m.status === "finished";
            const preds = (qfPred?.predictions ?? []) as { matchId: string; predictedWinnerId: string }[];
            const pred = preds.find(p => p.matchId === m.id);
            const predictedId = pred?.predictedWinnerId ?? null;
            const correct = finished && winnerId !== null ? winnerId === predictedId : null;
            let points = 0;
            const bonus: string[] = [];
            if (correct) {
                points = 10;
                if (qfPred?.wildcardMatchId === m.id) { points += 30; bonus.push("Wildcard +30"); }
                if (qfPred?.masterPickSchoolId && qfPred.masterPickSchoolId === predictedId) { points += 30; bonus.push("Master Pick +30"); }
            }
            return {
                matchId: m.id,
                label: qfLabel(m, idx),
                predictedSchoolId: predictedId,
                predictedName: playerName(m, predictedId),
                actualWinnerId: winnerId,
                actualWinnerName: playerName(m, winnerId),
                finished,
                correct,
                points,
                bonus,
            };
        });
        const qfTotal = qfBreakdown.reduce((s, r) => s + r.points, 0);

        let wildcard: PlayoffRow | null = null;
        if (qfPred?.wildcardMatchId) {
            const wi = qfMatches.findIndex(m => m.id === qfPred.wildcardMatchId);
            wildcard = wi >= 0 ? qfBreakdown[wi] : null;
        }

        const masterPickSchoolId = qfPred?.masterPickSchoolId ?? null;
        const masterRow = masterPickSchoolId ? qfBreakdown.find(r => r.predictedSchoolId === masterPickSchoolId) : null;
        let masterSchoolName: string | null = null;
        if (masterPickSchoolId) {
            for (const m of qfMatches) {
                const n = playerName(m, masterPickSchoolId);
                if (n) { masterSchoolName = n; break; }
            }
        }

        // ---- Semi-Final breakdown ----
        const sfBreakdown: PlayoffRow[] = sfMatches.map((m, idx) => {
            const resObj = (m.result as any) || {};
            const winnerId = resObj.winner ?? null;
            const finished = m.status === "finished";
            const preds = (sfPred?.predictions ?? []) as { matchId: string; predictedWinnerId: string; confidence: number }[];
            const pred = preds.find(p => p.matchId === m.id);
            const predictedId = pred?.predictedWinnerId ?? null;
            const confidence = pred?.confidence ?? null;
            const correct = finished && winnerId !== null ? winnerId === predictedId : null;
            let points = 0;
            if (correct && confidence) points = 20 * confidence;
            return {
                matchId: m.id,
                label: `SF${idx + 1}`,
                predictedSchoolId: predictedId,
                predictedName: playerName(m, predictedId),
                actualWinnerId: winnerId,
                actualWinnerName: playerName(m, winnerId),
                finished,
                correct,
                points,
                confidence,
            };
        });
        const sfTotal = sfBreakdown.reduce((s, r) => s + r.points, 0);

        // ---- Grand Final breakdown ----
        const gfMatch = gfMatches[0] ?? null;
        let champion: { schoolName: string | null; correct: boolean | null; points: number } | null = null;
        let runnerUp: { schoolName: string | null; correct: boolean | null; points: number } | null = null;
        let margin: { pick: string | null; actual: string | null; correct: boolean | null; points: number } | null = null;
        let gfTotal = 0;
        let gfFinished = false;

        if (gfPred && gfMatch) {
            const resObj = (gfMatch.result as any) || {};
            const winnerId = resObj.winner ?? null;
            const runnerUpId = resObj.runnerUp ?? null;
            const scores = resObj.scores || {};
            gfFinished = gfMatch.status === "finished";

            let actualMargin: string | null = null;
            if (winnerId && runnerUpId && scores[winnerId] != null && scores[runnerUpId] != null) {
                const diff = Math.abs(Number(scores[winnerId]) - Number(scores[runnerUpId]));
                if (diff >= 1 && diff <= 5) actualMargin = "1-5";
                else if (diff >= 6 && diff <= 10) actualMargin = "6-10";
                else if (diff >= 11 && diff <= 20) actualMargin = "11-20";
                else if (diff >= 21 && diff <= 30) actualMargin = "21-30";
                else if (diff >= 31) actualMargin = "31+";
            }

            const champCorrect = gfFinished && winnerId !== null ? gfPred.championSchoolId === winnerId : null;
            const runnerCorrect = gfFinished && runnerUpId !== null ? gfPred.runnerUpSchoolId === runnerUpId : null;
            const marginCorrect = gfFinished ? gfPred.marginRange === actualMargin : null;

            let champPoints = champCorrect ? 100 : 0;
            let runnerPoints = runnerCorrect ? 50 : 0;
            let marginPoints = marginCorrect ? 40 : 0;
            if (gfPred.finalBoost === "champion") champPoints *= 2;
            else if (gfPred.finalBoost === "runner_up") runnerPoints *= 2;
            else if (gfPred.finalBoost === "margin") marginPoints *= 2;

            gfTotal = champPoints + runnerPoints + marginPoints;
            if (champCorrect && runnerCorrect && marginCorrect) gfTotal += 100;

            champion = { schoolName: playerName(gfMatch, gfPred.championSchoolId), correct: champCorrect, points: champPoints };
            runnerUp = { schoolName: playerName(gfMatch, gfPred.runnerUpSchoolId), correct: runnerCorrect, points: runnerPoints };
            margin = { pick: gfPred.marginRange, actual: actualMargin, correct: marginCorrect, points: marginPoints };
        }

        return {
            success: true,
            data: {
                quarterFinal: {
                    exists: !!qfPred,
                    hasFixtures: qfMatches.length > 0,
                    isLocked: qfPred?.isLocked ?? false,
                    lockedAt: qfPred?.lockedAt?.toISOString() ?? null,
                    allFinished: qfBreakdown.length > 0 && qfBreakdown.every(r => r.finished),
                    url: "/fantasy/quarter-final",
                    total: qfTotal,
                    max: 150,
                    breakdown: qfBreakdown,
                    wildcard,
                    masterPick: masterPickSchoolId && masterRow ? {
                        label: masterRow.label,
                        schoolName: masterSchoolName,
                        correct: masterRow.correct,
                        finished: masterRow.finished,
                    } : null,
                },
                semiFinal: {
                    exists: !!sfPred,
                    hasFixtures: sfMatches.length > 0,
                    isLocked: sfPred?.isLocked ?? false,
                    lockedAt: sfPred?.lockedAt?.toISOString() ?? null,
                    allFinished: sfBreakdown.length > 0 && sfBreakdown.every(r => r.finished),
                    url: "/fantasy/semi-final",
                    total: sfTotal,
                    max: 120,
                    breakdown: sfBreakdown,
                },
                grandFinal: {
                    exists: !!gfPred && !!gfMatch,
                    hasFixtures: gfMatches.length > 0,
                    isLocked: gfPred?.isLocked ?? false,
                    lockedAt: gfPred?.lockedAt?.toISOString() ?? null,
                    allFinished: gfFinished,
                    url: "/fantasy/grand-final",
                    total: gfTotal,
                    max: null,
                    breakdown: [],
                    champion,
                    runnerUp,
                    margin,
                    boost: gfPred?.finalBoost ?? null,
                },
            },
        };
    } catch (error: any) {
        console.error("Error in getMyPlayoffPredictions:", error);
        return { success: false, error: error.message || "Failed to load your predictions" };
    }
}

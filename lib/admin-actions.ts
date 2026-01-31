"use server"


import { db } from "./db"
import { schools, tournaments, schoolStrengths, matches } from "./db/schema"
import { eq, and, sql } from "drizzle-orm"

// import { School, Tournament } from "./types" 

/**
 * Smartly adds or updates schools in a bulk operation.
 * Helps prevent duplicates like "PRESEC" and "Presec Legon".
 */
export async function smartUpsertSchools(schoolList: string[], region: string) {
    const results = [];

    for (const name of schoolList) {
        const cleanName = name.trim();
        if (!cleanName) continue;

        // 1. Try to find existing school by exact name or similar name in same region
        // This is a simple version; real smart upsert might use fuzzy matching
        const existing = await db.select().from(schools)
            .where(and(
                eq(schools.region, region),
                sql`lower(${schools.name}) = lower(${cleanName})`
            ))
            .limit(1);

        if (existing.length > 0) {
            results.push({ ...existing[0], status: 'found' });
            continue;
        }

        // 2. If not found, create new
        const id = `sch-${Math.random().toString(36).substr(2, 9)}`;
        const newSchool = await db.insert(schools).values({
            id,
            name: cleanName,
            region: region,
        }).returning();

        results.push({ ...newSchool[0], status: 'created' });
    }

    return results;
}

export async function createTournament(data: {
    name: string,
    region: string,
    sportType: string,
    gender: string,
    year: string
}) {
    const id = `tmt-${Math.random().toString(36).substr(2, 9)}`;
    return await db.insert(tournaments).values({
        id,
        ...data,
        status: 'active'
    }).returning();
}

export async function createMatch(data: {
    tournamentId: string,
    schoolIds: string[],
    stage: string,
    startTime: string,
    sportType: string,
    gender: string
}) {
    // Parse datetime if provided
    let scheduledAt: Date | null = null;
    let status = "upcoming";
    let displayTime = data.startTime || "TBD";

    if (data.startTime) {
        try {
            scheduledAt = new Date(data.startTime);
            if (!isNaN(scheduledAt.getTime())) {
                const now = new Date();
                status = scheduledAt <= now ? "live" : "upcoming";
                displayTime = scheduledAt.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                scheduledAt = null;
            }
        } catch {
            scheduledAt = null;
        }
    }

    // 1. Calculate Odds
    const initialOdds = await calculateInitialOdds(data.schoolIds, data.sportType, data.gender);

    // 2. Fetch School Names (for simplified display/redundancy in JSON)
    const schoolDetails = await db.select().from(schools)
        .where(sql`${schools.id} IN ${data.schoolIds}`);

    // 3. Construct Participants JSON
    const participants = data.schoolIds.map(id => {
        const school = schoolDetails.find(s => s.id === id);
        return {
            schoolId: id,
            name: school?.name || "Unknown School",
            odd: initialOdds[id] || 2.00, // Fallback
            result: null
        };
    });

    const id = `mtc-${Math.random().toString(36).substr(2, 9)}`;

    return await db.insert(matches).values({
        id,
        tournamentId: data.tournamentId,
        participants: participants,
        startTime: displayTime,
        scheduledAt: scheduledAt,
        status: status,
        result: null,
        isLive: status === "live",
        stage: data.stage,
        odds: initialOdds,
        sportType: data.sportType,
        gender: data.gender,
        margin: 0.1
    }).returning();
}

/**
 * Generates automated odds based on school strengths.
 * If strengths don't exist, it defaults to balanced odds with margin.
 */
export async function calculateInitialOdds(schoolIds: string[], sportType: string, gender: string, margin: number = 0.1) {
    // 1. Fetch school ratings
    const strengths = await db.select().from(schoolStrengths)
        .where(and(
            eq(schoolStrengths.sportType, sportType),
            eq(schoolStrengths.gender, gender)
        ));

    // 2. Calculate probabilities
    let totalPower = 0;
    const schoolPowers = schoolIds.map(id => {
        const s = strengths.find(st => st.schoolId === id);
        const power = (s?.rating as { overall?: number })?.overall || 50; // Default power 50
        totalPower += power;
        return { id, power };
    });

    // 3. Convert power to odd: Odd = 1 / (Prob * (1 - Margin))
    const odds: Record<string, number> = {};
    schoolPowers.forEach(sp => {
        const prob = sp.power / totalPower;
        const rawOdd = 1 / prob;
        // Apply margin: Final Odd = Raw Odd * (1 - Margin)
        // e.g. for a 50/50, raw odd is 2.0. With 10% margin, displayed odd is 1.8
        odds[sp.id] = parseFloat((rawOdd * (1 - margin)).toFixed(2));
    });

    return odds;
}

/**
 * Update match result and trigger bet settlement
 */
export async function updateMatchResult(matchId: string, resultData: {
    scores: { [schoolId: string]: number }
    winner: string
    status: string
}) {
    try {
        const { settleMatch } = await import("./settlement")

        // Update match with result
        await db.update(matches)
            .set({
                result: {
                    scores: resultData.scores,
                    winner: resultData.winner
                },
                status: resultData.status
            })
            .where(eq(matches.id, matchId))

        // If match is finished, trigger settlement
        if (resultData.status === "finished") {
            const settlementResult = await settleMatch(matchId)
            return {
                success: true,
                message: `Match result saved. ${settlementResult.settledCount || 0} bets settled.`
            }
        }

        return { success: true, message: "Match result saved" }
    } catch (error) {
        console.error("Error updating match result:", error)
        return { success: false, error: "Failed to update match result" }
    }
}

/**
 * Bulk update match results from parsed AI data
 */
export async function bulkUpdateResults(parsedResults: Array<{
    team1: string
    team2: string
    score1?: number
    score2?: number
    winner: string
    rawText: string
}>) {
    try {
        const { fuzzyMatchSchool } = await import("./ai-result-parser")

        // Get all schools and matches for matching
        const allSchools = await db.select().from(schools)
        const allMatches = await db.select().from(matches).where(eq(matches.status, "scheduled"))

        const results: Array<{
            rawText: string
            status: "success" | "error"
            message: string
            matchId?: string
        }> = []

        for (const result of parsedResults) {
            // Find school IDs
            const team1Id = fuzzyMatchSchool(result.team1, allSchools)
            const team2Id = fuzzyMatchSchool(result.team2, allSchools)

            if (!team1Id || !team2Id) {
                results.push({
                    rawText: result.rawText,
                    status: "error",
                    message: `Could not match schools: ${result.team1} / ${result.team2}`
                })
                continue
            }

            // Find matching match in database
            const match = allMatches.find(m => {
                const participants = m.participants as Array<{ schoolId: string }> | null
                if (!participants || participants.length < 2) return false

                const ids = participants.map(p => p.schoolId)
                return (ids.includes(team1Id) && ids.includes(team2Id))
            })

            if (!match) {
                results.push({
                    rawText: result.rawText,
                    status: "error",
                    message: `No scheduled match found between ${result.team1} and ${result.team2}`
                })
                continue
            }

            // Find winner ID
            const winnerId = result.winner.toLowerCase().includes(result.team1.toLowerCase())
                ? team1Id
                : team2Id

            // Update match result
            const updateResult = await updateMatchResult(match.id, {
                scores: result.score1 !== undefined && result.score2 !== undefined
                    ? { [team1Id]: result.score1, [team2Id]: result.score2 }
                    : {},
                winner: winnerId,
                status: "finished"
            })

            results.push({
                rawText: result.rawText,
                status: updateResult.success ? "success" : "error",
                message: updateResult.success ? updateResult.message || "Updated" : updateResult.error || "Failed",
                matchId: match.id
            })
        }

        const successCount = results.filter(r => r.status === "success").length
        const errorCount = results.filter(r => r.status === "error").length

        return {
            success: true,
            results,
            summary: `${successCount} matches updated, ${errorCount} errors`
        }

    } catch (error) {
        console.error("Bulk update error:", error)
        return {
            success: false,
            error: "Failed to process bulk update",
            results: []
        }
    }
}

/**
 * Parse match results using AI (server action wrapper)
 */
export async function parseResults(text: string) {
    try {
        const { parseResultsWithAI } = await import("./ai-result-parser")
        const results = await parseResultsWithAI(text)
        return { success: true, results }
    } catch (error) {
        console.error("Parse error:", error)
        return { success: false, error: "Failed to parse results", results: [] }
    }
}

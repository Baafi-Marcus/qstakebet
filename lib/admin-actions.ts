"use server"

import { db } from "./db"
import { schools, tournaments, matches, realSchoolStats, users, pendingResults, fantasyLineups, quarterFinalPredictions, semiFinalPredictions, grandFinalPredictions } from "./db/schema"
import { eq, and, sql, inArray, ne, asc } from "drizzle-orm"
import { parseResultsWithAI, type ParsedResult } from "./ai-result-parser"
import { parseRosterWithAI } from "./ai-roster-parser"
import { settleFantasyPoints } from "./fantasy-actions"
import { settleFantasyLineups } from "./settlement"
import { auth } from "./auth"
import { revalidateTag, revalidatePath } from "next/cache"

function safeRevalidatePath(path: string) {
    try { revalidatePath(path); } catch { /* ignore outside Next.js request context */ }
}

// import { School, Tournament } from "./types" 

export async function smartUpsertSchools(schoolList: string[], region: string) {
    const results = [];

    for (const name of schoolList) {
        const cleanName = name.trim();
        if (!cleanName) continue;

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


export async function upsertTournamentRoster(tournamentId: string, rosterText: string) {
    // 1. Fetch Tournament to get level and region
    const tData = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
    if (tData.length === 0) throw new Error("Tournament not found");
    const tournament = tData[0];

    // AI Parsing
    const entities = await parseRosterWithAI(rosterText);
    const results = [];

    // Get parentId from metadata if it exists
    const metadata = (tournament.metadata as any) || {};
    const parentId = metadata.parentUniversityId;

    // Initialize group assignments if they don't exist
    const groupAssignments = metadata.groupAssignments || {};
    const tournamentGroups = new Set<string>(metadata.groups || []);

    for (const entity of entities) {
        const { schoolName: name, groupName } = entity;

        // Check if exists in this level/region
        let schoolId: string;
        const searchConditions = [
            eq(schools.region, tournament.region),
            eq(schools.level, tournament.level),
            sql`lower(${schools.name}) = lower(${name})`
        ];

        // For university level, scope by parentId to avoid collisions between campuses
        if (tournament.level === 'university' && parentId) {
            searchConditions.push(eq(schools.parentId, parentId));
        }

        const existing = await db.select().from(schools)
            .where(and(...searchConditions))
            .limit(1);

        if (existing.length > 0) {
            schoolId = existing[0].id;
            results.push({ ...existing[0], status: 'found' });
        } else {
            // Create new
            const id = `sch-${Math.random().toString(36).substr(2, 9)}`;

            // Use metadata.uniType if available (Hall vs Department)
            const type = tournament.level === 'university'
                ? (metadata.uniType || 'hall')
                : 'school';

            const newEntity = await db.insert(schools).values({
                id,
                name,
                region: tournament.region,
                level: tournament.level,
                type,
                parentId: parentId || null
            }).returning();

            schoolId = id;
            results.push({ ...newEntity[0], status: 'created' });
        }

        // Handle Group Assignment
        if (groupName) {
            groupAssignments[schoolId] = groupName;
            tournamentGroups.add(groupName);
        }
    }

    // Update Tournament Metadata
    await db.update(tournaments).set({
        metadata: {
            ...metadata,
            groupAssignments,
            groups: Array.from(tournamentGroups)
        }
    }).where(eq(tournaments.id, tournamentId));

    revalidateTag("tournaments")
    return results;
}

export async function createSchoolAction(data: {
    name: string,
    region: string,
    district?: string,
    category?: string,
    level?: string,
    parentId?: string,
    type?: string
}) {
    try {
        const id = `sch-${Math.random().toString(36).substr(2, 9)}`;
        const [newSchool] = await db.insert(schools).values({
            id,
            name: data.name,
            region: data.region,
            district: data.district,
            category: data.category,
            level: data.level || 'shs',
            parentId: data.parentId,
            type: data.type || 'school'
        }).returning();

        return { success: true, school: newSchool };
    } catch (error) {
        console.error("Create school error:", error);
        return { success: false, error: "Failed to create school" };
    }
}

export async function updateSchoolAction(id: string, data: {
    name?: string,
    region?: string,
    district?: string,
    category?: string,
    level?: string,
    type?: string,
    parentId?: string | null
}) {
    try {
        return await db.transaction(async (tx) => {
            // Update Basic Info
            if (data.name || data.region || data.district || data.category) {
                await tx.update(schools).set({
                    name: data.name,
                    region: data.region,
                    district: data.district,
                    category: data.category,
                    level: data.level,
                    type: data.type,
                    parentId: data.parentId
                }).where(eq(schools.id, id));
            }

            return { success: true };
        });
    } catch (error) {
        console.error("Update school error:", error);
        return { success: false, error: "Failed to update school" };
    }
}

export async function deleteSchoolAction(id: string) {
    try {
        return await db.transaction(async (tx) => {
            await tx.delete(realSchoolStats).where(eq(realSchoolStats.schoolId, id));
            await tx.delete(schools).where(eq(schools.id, id));
            return { success: true };
        });
    } catch (error) {
        console.error("Delete school error:", error);
        return { success: false, error: "Failed to delete school" };
    }
}

export async function createTournament(data: {
    name: string,
    region: string,
    sportType: string,
    gender: string,
    year: string,
    level?: string,
    format?: string,
    groups?: string,
    parentUniversityId?: string,
    uniType?: string,
    metadata?: any
}) {
    const id = `tmt-${Math.random().toString(36).substr(2, 9)}`;

    // Process metadata
    const metadata = data.metadata || {};
    if (data.format) metadata.format = data.format;
    if (data.groups) {
        metadata.groups = data.groups.split(',').map(g => g.trim()).filter(Boolean);
    }
    if (data.parentUniversityId) {
        metadata.parentUniversityId = data.parentUniversityId;
    }
    if (data.uniType) {
        metadata.uniType = data.uniType;
    }

    const result = await db.insert(tournaments).values({
        id,
        name: data.name,
        region: data.region,
        sportType: data.sportType,
        gender: data.gender,
        year: data.year,
        level: data.level || 'shs',
        metadata,
        status: 'active'
    }).returning();

    revalidateTag("tournaments")
    return result;
}

export async function updateTournament(id: string, data: {
    name?: string,
    region?: string,
    sportType?: string,
    gender?: string,
    year?: string,
    level?: string,
    format?: string,
    groups?: string,
    parentUniversityId?: string,
    uniType?: string,
    status?: string,
    metadata?: any
}) {
    // Process metadata
    const metadata = data.metadata || {};
    if (data.format) metadata.format = data.format;
    if (data.groups) {
        metadata.groups = data.groups.split(',').map(g => g.trim()).filter(Boolean);
    }
    if (data.parentUniversityId) {
        metadata.parentUniversityId = data.parentUniversityId;
    }
    if (data.uniType) {
        metadata.uniType = data.uniType;
    }

    const updateData: any = {
        name: data.name,
        region: data.region,
        sportType: data.sportType,
        gender: data.gender,
        year: data.year,
        level: data.level,
        status: data.status,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };

    // Remove undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const result = await db.update(tournaments)
        .set(updateData)
        .where(eq(tournaments.id, id))
        .returning();

    revalidateTag("tournaments")
    return result;
}

export async function deleteTournament(id: string) {
    // Safety check: Don't delete if matches exist
    const linkedMatches = await db.select().from(matches).where(eq(matches.tournamentId, id)).limit(1);
    if (linkedMatches.length > 0) {
        return { success: false, error: "Cannot delete tournament with existing matches. Delete the matches first." };
    }
    try {
        const result = await db.delete(tournaments).where(eq(tournaments.id, id)).returning({ deletedId: tournaments.id });
        if (result.length === 0) {
            return { success: false, error: "Tournament not found or already deleted." };
        }
        revalidateTag("tournaments")
        revalidateTag("matches")
        return { success: true };
    } catch (e) {
        console.error("Delete tournament error:", e);
        return { success: false, error: "Failed to delete tournament" };
    }
}

export async function createMatch(data: {
    tournamentId: string,
    schoolIds: string[],
    stage: string,
    startTime?: string,
    autoEndAt?: string,
    sportType: string,
    gender: string,
    group?: string,
    matchday?: string
}) {
    // Parse datetime if provided
    let scheduledAt: Date | null = null;
    let autoEndAt: Date | null = null;
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

    if (data.autoEndAt) {
        try {
            autoEndAt = new Date(data.autoEndAt);
            if (isNaN(autoEndAt.getTime())) {
                autoEndAt = null;
            }
        } catch {
            autoEndAt = null;
        }
    }

    // 1. Calculate Odds
    const initialOdds = await calculateInitialOdds(data.schoolIds, data.sportType, data.gender, data.tournamentId);

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

    const result = await db.insert(matches).values({
        id,
        tournamentId: data.tournamentId,
        participants: participants,
        startTime: displayTime,
        scheduledAt: scheduledAt,
        autoEndAt: autoEndAt,
        status: status,
        result: null,
        isLive: status === "live",
        stage: data.stage,
        group: data.group,
        matchday: data.matchday,
        odds: initialOdds,
        sportType: data.sportType,
        gender: data.gender,
        margin: 0.1
    }).returning();

    revalidateTag("matches")
    return result;
}

export async function updateMatch(id: string, data: {
    tournamentId?: string,
    schoolIds?: string[],
    stage?: string,
    startTime?: string,
    autoEndAt?: string | null,
    sportType?: string,
    gender?: string,
    group?: string,
    matchday?: string
}) {
    // 1. Process Timing
    let scheduledAt: Date | null = undefined as any;
    let autoEndAt: Date | null = undefined as any;
    let displayTime: string | null = undefined as any;

    if (data.startTime !== undefined) {
        if (!data.startTime) {
            scheduledAt = null;
            displayTime = "TBD";
        } else {
            const date = new Date(data.startTime);
            if (!isNaN(date.getTime())) {
                scheduledAt = date;
                displayTime = date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                displayTime = data.startTime;
                scheduledAt = null;
            }
        }
    }

    if (data.autoEndAt !== undefined) {
        if (!data.autoEndAt) {
            autoEndAt = null;
        } else {
            const date = new Date(data.autoEndAt);
            autoEndAt = isNaN(date.getTime()) ? null : date;
        }
    }

    // 2. Prepare Update Object
    const updateData: any = {
        tournamentId: data.tournamentId,
        stage: data.stage,
        startTime: displayTime,
        scheduledAt: scheduledAt,
        autoEndAt: autoEndAt,
        sportType: data.sportType,
        gender: data.gender,
        group: data.group,
        matchday: data.matchday
    };

    // 3. Handle School Changes (Participants & Odds)
    if (data.schoolIds && data.schoolIds.length >= 2) {
        const initialOdds = await calculateInitialOdds(
            data.schoolIds,
            data.sportType || 'football',
            data.gender || 'male',
            data.tournamentId
        );
        const schoolDetails = await db.select().from(schools).where(sql`${schools.id} IN ${data.schoolIds}`);

        const participants = data.schoolIds.map(sid => {
            const school = schoolDetails.find(s => s.id === sid);
            return {
                schoolId: sid,
                name: school?.name || "Unknown School",
                odd: initialOdds[sid] || 2.00,
                result: null
            };
        });

        updateData.participants = participants;
        updateData.odds = initialOdds;
    }

    // Remove undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const result = await db.update(matches)
        .set(updateData)
        .where(eq(matches.id, id))
        .returning();

    revalidateTag("matches")
    return result;
}

export async function deleteMatch(id: string) {
    try {
        await db.delete(matches).where(eq(matches.id, id));
        return { success: true };
    } catch (e) {
        console.error("Delete match error:", e);
        return { success: false, error: "Failed to delete match" };
    }
}

/**
 * Generates automated odds based on school strengths.
 * If strengths don't exist, it defaults to balanced odds with margin.
 */
export async function calculateInitialOdds(schoolIds: string[], sportType: string, gender: string, tournamentId?: string, margin: number = 0.1) {
    // Determine level for constraints
    let level = 'shs';
    if (tournamentId) {
        const t = await db.select({ level: tournaments.level }).from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
        if (t.length > 0) level = t[0].level;
    }

    // ACSES/University Rules: Higher Margin, Tight Caps
    const isUniversity = level === 'university';
    const effectiveMargin = isUniversity ? 0.15 : margin;
    const minOdd = isUniversity ? 1.08 : 1.01;
    const maxOdd = isUniversity ? 3.50 : 100.0;
    // 1. Base rating defaults to 50 for all schools (legacy strengths table removed)
    const baseStrengths: { schoolId: string; rating?: unknown }[] = [];

    // 1b. Fetch Live Form (Tournament Specific if available, else Global)
    let liveStats: any[] = [];
    if (tournamentId) {
        // Calculate dynamic form from this tournament's matches
        const tMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
        const schoolsInvolved = schoolIds;

        liveStats = schoolsInvolved.map(id => {
            const schoolMatches = tMatches.filter(m => (m.participants as any[]).some((p: any) => p.schoolId === id) && (m.status === 'finished' || m.status === 'settled'));
            let wins = 0, draws = 0, gf = 0, ga = 0;
            schoolMatches.forEach(m => {
                const res = m.result as any;
                if (res?.winner === id) wins++;
                else if (res?.winner === 'X') draws++;

                const p = (m.participants as any[]).find((p: any) => p.schoolId === id);
                const opp = (m.participants as any[]).find((p: any) => p.schoolId !== id);
                gf += parseInt(String(p?.result || "0")) || 0;
                ga += parseInt(String(opp?.result || "0")) || 0;
            });

            // Generate a 'currentForm' multiplier: 1.0 is base. 
            // Simple: +5% per win, -5% per loss, +2% per goal diff
            const gd = gf - ga;
            const formMultiplier = 1.0 + (wins * 0.05) + (gd * 0.02);
            return { schoolId: id, currentForm: Math.max(0.7, Math.min(1.5, formMultiplier)), matchesPlayed: schoolMatches.length };
        });
    } else {
        liveStats = await db.select().from(realSchoolStats)
            .where(and(
                inArray(realSchoolStats.schoolId, schoolIds),
                eq(realSchoolStats.sportType, sportType),
                eq(realSchoolStats.gender, gender)
            ));
    }

    // 2. Calculate probabilities
    let totalPower = 0;
    const schoolPowers = schoolIds.map(id => {
        // Base Rating (Default 50)
        const s = baseStrengths.find(st => st.schoolId === id);
        let power = (s?.rating as { overall?: number })?.overall || 50;

        // Live Form Adjustment
        const live = liveStats.find(l => l.schoolId === id);
        if (live && live.matchesPlayed && live.matchesPlayed > 0) {
            const formMultiplier = live.currentForm || 1.0;
            power = power * formMultiplier;
        }

        totalPower += power;
        return { id, power };
    });

    // 3. Convert power to odd: Odd = 1 / (Prob * (1 - Margin))
    const odds: Record<string, number> = {};
    schoolPowers.forEach(sp => {
        const prob = sp.power / totalPower;
        const rawOdd = 1 / prob;
        let finalOdd = rawOdd * (1 - effectiveMargin);

        // Apply Constraints
        finalOdd = Math.max(minOdd, Math.min(maxOdd, finalOdd));

        odds[sp.id] = parseFloat(finalOdd.toFixed(2));
    });

    // 4. Add Draw odd for relevant sports
    if (sportType === "football" || sportType === "handball") {
        // Simple logic: Draw is roughly 25-30% probability in these sports
        odds["X"] = 3.20;
    }

    return odds;
}

/**
 * Update match result and trigger bet settlement
 */
export async function updateMatchResult(matchId: string, resultData: {
    scores: { [schoolId: string]: number }
    winner: string
    status: string
    autoEndAt?: string | null
    metadata?: any
    rounds?: { label: string, scores: { [schoolId: string]: number } }[]
}) {
    try {
        const { recordMatchUpdate } = await import("./match-helpers")

        // Fetch current match state for history
        const currentMatch = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        const previousData = currentMatch[0]?.result || {}
        const previousStatus = currentMatch[0]?.status

        // Log the update to history
        await recordMatchUpdate({
            matchId,
            action: previousStatus !== resultData.status ? "status_change" : "score_update",
            previousData: { scores: (previousData as any)?.scores, status: previousStatus },
            newData: { scores: resultData.scores, status: resultData.status },
            metadata: resultData.metadata
        })

        // Update match with result
        // We also need to map the flat resultData.scores back into each participant's 'result' field
        // so that calculateGroupStandings (which expects participants[i].result) works.
        const updatedParticipants = (currentMatch[0] as any).participants.map((p: any) => ({
            ...p,
            result: resultData.scores[p.schoolId] ?? p.result
        }));

        await db.update(matches)
            .set({
                participants: updatedParticipants,
                result: {
                    scores: resultData.scores,
                    winner: resultData.winner,
                    rounds: resultData.rounds || [],
                    metadata: resultData.metadata
                },
                status: resultData.status,
                autoEndAt: resultData.autoEndAt ? new Date(resultData.autoEndAt) : null,
                lastTickAt: new Date()
            })
            .where(eq(matches.id, matchId))

        // If match is finished, trigger history update
        if (resultData.status === "finished") {

            // Update Real School Stats (Background)
            // Fetch match details to get sport type and school IDs
            const matchDetails = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
            if (matchDetails.length > 0) {
                await updateRealSchoolStats(matchDetails[0], resultData);
                // Trigger tournament outright odds recalculation
                if (matchDetails[0].tournamentId) {
                    await recalculateTournamentOutrightOdds(matchDetails[0].tournamentId);
                }
            }

            // Settle Fantasy Points
            await settleFantasyPoints(matchId, resultData);

            return {
                success: true,
                message: `Match result saved and stats updated.`
            }
        }

        return { success: true, message: "Match result saved" }
    } catch (error) {
        console.error("Error updating match result:", error)
        return { success: false, error: "Failed to update match result" }
    }
}

// Helper to update persistent cumulative stats
async function updateRealSchoolStats(match: any, resultData: { scores: any, winner: any }) {
    try {
        const participants = match.participants as any[];
        const sport = match.sportType;

        for (const p of participants) {
            const schoolId = p.schoolId;
            // Get stats for this school or create
            // Note: Postgres upsert is better but Drizzle syntax varies. simplify: select/update
            // We use 'realSchoolStats' table.

            const existing = await db.select().from(realSchoolStats)
                .where(and(
                    eq(realSchoolStats.schoolId, schoolId),
                    eq(realSchoolStats.sportType, sport),
                    eq(realSchoolStats.gender, match.gender || 'male')
                ))
                .limit(1);

            let stats = existing[0];
            if (!stats) {
                // Init
                const newId = `rss-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                [stats] = await db.insert(realSchoolStats).values({
                    id: newId,
                    schoolId: schoolId,
                    sportType: sport,
                    gender: match.gender || 'male',
                    matchesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    points: 0,
                    currentForm: 1.0
                }).returning();
            }

            // Calculate impact
            const isWin = resultData.winner === schoolId;
            const isDraw = resultData.winner === "X" || resultData.winner === "draw";
            const isLoss = !isWin && !isDraw;

            // Determine goals/points for this match
            let goalsFor = 0;
            let goalsAgainst = 0;

            if (sport === 'football' || sport === 'handball' || sport === 'basketball' || sport === 'quiz') {
                // scores is { schoolId: score }
                goalsFor = resultData.scores[schoolId] || 0;
                // find opponent score
                const opponent = participants.find((x: any) => x.schoolId !== schoolId);
                if (opponent) {
                    goalsAgainst = resultData.scores[opponent.schoolId] || 0;
                } else if (participants.length > 2) {
                    // Multi-team (quiz), opponents average? Or max?
                    // For quiz, 'goalsAgainst' is ambiguous. Maybe average of others.
                    // Let's just sum all others.
                    const others = participants.filter((x: any) => x.schoolId !== schoolId);
                    goalsAgainst = others.reduce((acc: number, x: any) => acc + (resultData.scores[x.schoolId] || 0), 0) / others.length;
                }
            } else if (sport === 'volleyball') {
                // scores is { schoolId: sets }
                goalsFor = resultData.scores[schoolId] || 0; // Sets won
                const opponent = participants.find((x: any) => x.schoolId !== schoolId);
                goalsAgainst = resultData.scores[opponent?.schoolId] || 0;
            }

            // Update Form (Simple Elo-like movement)
            let formChange = 0;
            if (isWin) formChange = 0.05;
            else if (isDraw) formChange = 0.01;
            else formChange = -0.05;

            await db.update(realSchoolStats).set({
                matchesPlayed: (stats.matchesPlayed || 0) + 1,
                wins: (stats.wins || 0) + (isWin ? 1 : 0),
                losses: (stats.losses || 0) + (isLoss ? 1 : 0),
                draws: (stats.draws || 0) + (isDraw ? 1 : 0),
                goalsFor: (stats.goalsFor || 0) + goalsFor,
                goalsAgainst: (stats.goalsAgainst || 0) + goalsAgainst,
                points: (stats.points || 0) + (isWin ? 3 : (isDraw ? 1 : 0)),
                currentForm: Math.max(0.2, (stats.currentForm || 1.0) + formChange),
                lastUpdated: new Date()
            }).where(eq(realSchoolStats.id, stats.id));
        }

    } catch (e) {
        console.error("Failed to update real school stats:", e);
        // Don't fail the request, this is background
    }
}

/**
 * Bulk update match results from parsed AI data
 */
export async function bulkUpdateResults(parsedResults: ParsedResult[]) {
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

            // Mapping AI Outcomes to Selection IDs/School IDs
            const mappedOutcomes: Record<string, string> = {}
            if (result.metadata?.outcomes) {
                Object.entries(result.metadata.outcomes).forEach(([market, winnerName]) => {
                    if (typeof winnerName === 'string') {
                        const winnerId = fuzzyMatchSchool(winnerName, allSchools)
                        if (winnerId) mappedOutcomes[market] = winnerId
                    }
                })
            }

            // Map Football Details (HT/FT) if present
            const mappedFootballDetails: any = {}
            if (result.footballDetails) {
                Object.entries(result.footballDetails).forEach(([schoolName, data]) => {
                    const sid = fuzzyMatchSchool(schoolName, allSchools)
                    if (sid) mappedFootballDetails[sid] = data
                })
            }

            // Update match result
            const updateResult = await updateMatchResult(match.id, {
                scores: result.score1 !== undefined && result.score2 !== undefined
                    ? { [team1Id]: result.score1, [team2Id]: result.score2 }
                    : {},
                winner: winnerId,
                status: "finished",
                metadata: {
                    ...result.metadata,
                    footballDetails: Object.keys(mappedFootballDetails).length > 0 ? mappedFootballDetails : undefined,
                    outcomes: mappedOutcomes
                }
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

/**
 * Generate AI market suggestions for a specific match
 */
export async function getMatchSuggestions(matchId: string) {
    try {
        const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!matchData.length) throw new Error("Match not found")

        const match = matchData[0]
        if (!match.tournamentId) throw new Error("Tournament ID missing")
        const participants = match.participants as Array<{ name: string }> | null
        const pNames = participants?.map(p => p.name).join(" vs ") || "Teams"

        // Get existing markets
        const currentOdds = (match.extendedOdds as Record<string, any>) || {}
        const currentMarkets = Object.keys(currentOdds)

        // Get tournament context for better AI logic
        const tPrevMatches = await db.select().from(matches).where(and(eq(matches.tournamentId, match.tournamentId), eq(matches.status, 'finished'))).limit(10)
        const context = tPrevMatches.map(m => {
            const [p1, p2] = m.participants as any[]
            return `${p1.name} ${p1.result}-${p2.result} ${p2.name} (${m.stage})`
        }).join("; ")

        const details = `${match.sportType} match between ${pNames}. Gender: ${match.gender}. Stage: ${match.stage}. Tournament Context: ${context}`

        const { getAIMarketSuggestions } = await import("./ai-result-parser")
        const suggestions = await getAIMarketSuggestions(details, currentMarkets)

        return { success: true, suggestions }
    } catch (error) {
        console.error("Suggestion Error:", error)
        return { success: false, error: "Failed to get suggestions" }
    }
}

/**
 * Publish approved markets to the match
 */
export async function publishMatchMarkets(matchId: string, newMarkets: Array<{
    marketName: string,
    selections: Array<{ label: string, odds: number }>
}>) {
    try {
        const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!matchData.length) throw new Error("Match not found")

        const currentOdds = (matchData[0].extendedOdds as Record<string, any>) || {}

        // Merge new markets
        newMarkets.forEach(m => {
            const selectionsMap: Record<string, number> = {}
            m.selections.forEach((s) => selectionsMap[s.label] = s.odds)
            currentOdds[m.marketName] = selectionsMap
        })

        await db.update(matches)
            .set({ extendedOdds: currentOdds })
            .where(eq(matches.id, matchId))

        return { success: true }
    } catch (error) {
        console.error("Publish Error:", error)
        return { success: false, error: "Failed to publish markets" }
    }
}

/**
 * Bulk Start Matches (Go Live)
 */
export async function startMatches(matchIds: string[]) {
    try {
        await db.update(matches)
            .set({
                status: "live",
                isLive: true,
                // We might want to set a 'startedAt' timestamp if we had one
            })
            .where(inArray(matches.id, matchIds))

        return { success: true, count: matchIds.length }
    } catch (error) {
        console.error("Bulk start error:", error)
        return { success: false, error: "Failed to start matches" }
    }
}
/**
 * Bulk Lock Matches (Disable Betting)
 */
export async function lockMatches(matchIds: string[]) {
    try {
        await db.update(matches)
            .set({
                status: "locked",
            })
            .where(inArray(matches.id, matchIds))

        return { success: true, count: matchIds.length }
    } catch (error) {
        console.error("Bulk lock error:", error)
        return { success: false, error: "Failed to lock matches" }
    }
}

/**
 * Manually adjust a user's wallet balance (Admin Only)
 */
export async function adjustUserBalance(userId: string, amount: number, reason: string) {
    return { success: false, error: "Not supported" }
}

/**
 * Detects which markets have pending bets for a specific match.
 * Used in the Admin UI to highlight markets that need settlement.
 */
export async function getActiveMarketsAction(matchId: string) {
    return { success: true, activeMarkets: [] as string[] };
}

export async function updateTournamentOutright(tournamentId: string, data: {
    isOutrightEnabled: boolean,
    outrightOdds: { schoolId: string, odd: number, status: string }[]
}) {
    try {
        const result = await db.update(tournaments)
            .set({
                isOutrightEnabled: data.isOutrightEnabled,
                outrightOdds: data.outrightOdds
            })
            .where(eq(tournaments.id, tournamentId))
            .returning();

        revalidateTag("tournaments")
        return { success: true, tournament: result[0] };
    } catch (error) {
        console.error("Error updating outright settings:", error);
        return { success: false, error: "Failed to update outright settings" };
    }
}

export async function settleTournamentWinner(tournamentId: string, winnerId: string) {
    try {
        // 1. Update tournament status and winner
        await db.update(tournaments)
            .set({
                winnerId,
                status: 'completed'
            })
            .where(eq(tournaments.id, tournamentId));

        revalidateTag("tournaments")

        return {
            success: true,
            message: `Tournament settled. Winner declared.`
        };
    } catch (error) {
        console.error("Error settling tournament winner:", error);
        return { success: false, error: "Failed to settle tournament winner" };
    }
}

export async function recalculateTournamentOutrightOdds(tournamentId: string) {
    try {
        const tData = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
        if (tData.length === 0 || !tData[0].isOutrightEnabled) return;

        const tournament = tData[0];
        const allMatches = await db.select().from(matches)
            .where(and(eq(matches.tournamentId, tournamentId), inArray(matches.status, ['finished', 'settled'])));

        const currentOdds = tournament.outrightOdds || [];
        if (currentOdds.length === 0) return;

        const updatedOdds = currentOdds.map(item => {
            const schoolMatches = allMatches.filter(m => (m.participants as any[]).some((p: any) => p.schoolId === item.schoolId));
            if (schoolMatches.length === 0) return item;

            let wins = 0, draws = 0, gf = 0, ga = 0;
            schoolMatches.forEach(m => {
                const res = m.result as any;
                if (res?.winner === item.schoolId) wins++;
                else if (res?.winner === 'X') draws++;

                const p = (m.participants as any[]).find((p: any) => p.schoolId === item.schoolId);
                const opp = (m.participants as any[]).find((p: any) => p.schoolId !== item.schoolId);
                gf += parseInt(String(p?.result || "0")) || 0;
                ga += parseInt(String(opp?.result || "0")) || 0;
            });

            const gd = gf - ga;
            // Simplified dynamic odds logic: 
            // Better performance (wins/gd) = Lower odds
            // Base odd is multiplied by a factor derived from performance
            // factor: 1.0 (starting), -5% per win, -1% per goal diff
            const winFactor = Math.pow(0.95, wins);
            const gdFactor = Math.pow(0.99, Math.max(0, gd)); // only decrease odds for positive gd
            const negativeGdFactor = Math.pow(1.02, Math.abs(Math.min(0, gd))); // increase odds for negative gd

            const newOdd = item.odd * winFactor * gdFactor * negativeGdFactor;

            return {
                ...item,
                odd: parseFloat(Math.max(1.01, Math.min(100, newOdd)).toFixed(2))
            };
        });

        await db.update(tournaments)
            .set({ outrightOdds: updatedOdds })
            .where(eq(tournaments.id, tournamentId));

        revalidateTag("tournaments");
    } catch (error) {
        console.error("Error recalculating tournament odds:", error);
    }
}

export async function approvePendingResult(id: string, matchId: string) {
    try {
        const pending = await db.select().from(pendingResults).where(eq(pendingResults.id, id)).limit(1);
        if (pending.length === 0) return { success: false, error: "Result not found" };

        const parsed = pending[0].parsedData as any;
        
        // Find the match
        const match = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
        if (match.length === 0) return { success: false, error: "Match not found" };

        // 1. Extract scores from parsed data and map to actual school IDs
        const customScores: Record<string, number> = {};
        const participants = (match[0].participants as any[]) || [];
        
        if (parsed.scores && Array.isArray(parsed.scores)) {
            for (const parsedScore of parsed.scores) {
                // Find matching participant (case-insensitive substring match)
                const participant = participants.find(p => 
                    p.name.toLowerCase().includes(parsedScore.schoolName.toLowerCase()) || 
                    parsedScore.schoolName.toLowerCase().includes(p.name.toLowerCase())
                );
                
                if (participant) {
                    customScores[participant.schoolId] = parsedScore.score;
                }
            }
        }

        if (Object.keys(customScores).length === 0) {
            return { success: false, error: "Could not auto-map any schools from the parsed data to the match participants." };
        }

        // 2. Save the mapped scores directly to the match
        const existingResult = (match[0].result as any) || {};
        await db.update(matches)
            .set({ 
                result: { ...existingResult, scores: customScores } 
            })
            .where(eq(matches.id, matchId));

        // 3. Settle fantasy points for all users automatically
        await settleFantasyLineups(matchId, { customScores });
        
        // 4. Mark the queue item as approved
        await db.update(pendingResults)
            .set({ status: 'approved' })
            .where(eq(pendingResults.id, id));

        return { success: true };
    } catch (error) {
        console.error("Error approving pending result:", error);
        return { success: false, error: "Failed to approve result" };
    }
}

export async function rejectPendingResult(id: string) {
    try {
        await db.update(pendingResults)
            .set({ status: 'rejected' })
            .where(eq(pendingResults.id, id));
        return { success: true };
    } catch (error) {
        console.error("Error rejecting pending result:", error);
        return { success: false, error: "Failed to reject result" };
    }
}

type ParsedRound = { label: string, scores: Record<string, number> }
type AiContestResult = {
    scores: { schoolName: string, score: number }[]
    winnerName: string | null
    isFinal?: boolean
    rounds?: { label: string, scores: Record<string, string | number> }[]
}

function normalizeSchoolName(name: string) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/shts$/, "shs")   // SHTS ↔ SHS
        .replace(/ths$/, "shs")    // THS ↔ SHS
        .replace(/technical$/, "") // drop "technical" suffix
        .replace(/tech$/, "")      // drop "tech" suffix
}

function schoolMatchesSegment(schoolKey: string, segmentLower: string): boolean {
    if (segmentLower.includes(schoolKey)) return true;
    const firstWord = schoolKey.split(" ")[0];
    if (firstWord.length >= 3 && segmentLower.includes(firstWord)) return true;
    // Try first 5 chars for abbreviations
    if (schoolKey.length > 5 && segmentLower.includes(schoolKey.slice(0, 5))) return true;
    // Also check with SHTS/SHS variants
    const shtsVariant = schoolKey.endsWith("shs") ? schoolKey + "t" : schoolKey;
    const shsVariant = schoolKey.endsWith("shts") ? schoolKey.slice(0, -1) : schoolKey;
    return segmentLower.includes(shtsVariant) || segmentLower.includes(shsVariant);
}

function buildPrompt(text: string, participants: any[]) {
    return `You are an NSMQ (Ghana National Science & Maths Quiz) result extractor.
The user gives you raw social media coverage of ONE contest between listed schools.
The text may be round-by-round updates posted during the contest, or a single end-of-contest summary.
It may be PARTIAL coverage (only some rounds so far, contest still ongoing).
Extract the important facts and IGNORE everything else (replies, hashtags, commentary).

Return ONLY valid JSON in this exact shape:
{"scores": [{"schoolName": "<school name>", "score": <latest known total>}], "winnerName": "<winning school or null>", "isFinal": <true|false>, "rounds": [{"label": "<round label>", "scores": {"<school name>": <points that round>}}]}

Rules:
- "scores" must contain exactly one entry per participating school with its LATEST KNOWN total score.
- NSMQ contests ALWAYS run 5 rounds (Round 1 through Round 5). A contest is NEVER final before Round 5.
- "isFinal" must be true ONLY if BOTH hold: (a) the coverage explicitly marks the END of the contest — e.g. "End of Round 5", "End of quiz/contest", "final scores", "full-time", or a winner/qualification announcement at the conclusion; AND (b) the rounds detected are consistent with a completed contest.
- If the coverage only shows Round 1, Round 2, Round 3 or Round 4 results, the contest IS ONGOING: "isFinal" MUST be false and "winnerName" MUST be null.
- Never guess or assume the final result from partial rounds. Leading after Round 1 does NOT mean winning.
- When multiple values exist for the same school across rounds, the latest one wins.
- Include "rounds" entries for every distinct round mentioned in the coverage.
- Use school names EXACTLY as given in the participant list where possible.

Participating schools:
${participants.map(p => `- ${p.name}`).join("\n")}

Contest coverage:
${text}`
}

export async function extractMatchResultFromText(text: string, matchId: string) {
    try {
        // 1. Get Match from DB
        const match = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
        if (match.length === 0) return { success: false, error: "Match not found" };

        const participants = (match[0].participants as any[]) || [];
        if (participants.length === 0) return { success: false, error: "Match has no participants" };

        // 2. Call AI via unified rotating client (gemini -> github_models -> openai)
        const { callLLM } = await import("./ai-client");

        const llmResult = await callLLM({ prompt: buildPrompt(text, participants) });
        if (!llmResult.ok) {
            return { success: false, error: llmResult.error || "AI extraction failed" };
        }

        const cleaned = llmResult.content.replace(/```json/g, "").replace(/```/g, "").trim();
        let parsed: AiContestResult;
        try {
            parsed = JSON.parse(cleaned) as AiContestResult;
        } catch {
            return { success: false, error: "AI returned unparseable output — try rephrasing the paste." };
        }

        // Map extracted school names to participant ids
        const customScores: Record<string, number> = {};
        for (const entry of parsed.scores || []) {
            const norm = normalizeSchoolName(entry.schoolName);
            const participant = participants.find(p => {
                const pn = normalizeSchoolName(p.name);
                return pn.includes(norm) || norm.includes(pn);
            });
            if (participant) {
                customScores[participant.schoolId] = Number(entry.score) || 0;
            }
        }

        if (Object.keys(customScores).length === 0) {
            return { success: false, error: "Could not map extracted scores to the match participants." };
        }

        let winnerSchoolId: string | null = null;
        if (parsed.winnerName) {
            const wNorm = normalizeSchoolName(parsed.winnerName);
            const winner = participants.find(p => {
                const pn = normalizeSchoolName(p.name);
                return pn.includes(wNorm) || wNorm.includes(pn);
            });
            winnerSchoolId = winner?.schoolId ?? null;
        }

        const rounds: ParsedRound[] = (parsed.rounds || []).map(r => ({
            label: r.label,
            scores: Object.fromEntries(
                Object.entries(r.scores || {}).map(([name, val]) => {
                    const n = normalizeSchoolName(name);
                    const p = participants.find(pt => {
                        const pn = normalizeSchoolName(pt.name);
                        return pn.includes(n) || n.includes(pn);
                    });
                    return p ? [p.schoolId, Number(val) || 0] : null;
                }).filter(Boolean) as [string, number][]
            )
        })).filter(r => Object.keys(r.scores).length > 0);

        // Backstop: NSMQ contests always run 5 rounds. Never trust an AI "final" verdict on
        // short coverage unless the paste itself explicitly declares the end of the contest.
        const endMarkerRe = /end of (round\s*5|quiz|contest|competition|the game)|final scores?|full[\s-]?time|wins? the (contest|quiz)|qualifies for the quarter/i;
        const hasEndMarker = endMarkerRe.test(text);
        let isFinal = parsed.isFinal === true;
        if (isFinal && rounds.length < 5 && !hasEndMarker) {
            console.warn(`[extract] downgraded isFinal=true -> false (${rounds.length} rounds, no end marker)`);
            isFinal = false;
        }
        // An ongoing contest cannot have a winner yet — clear it so previews stay honest.
        if (!isFinal) {
            winnerSchoolId = null;
        }

        return { success: true, customScores, winnerSchoolId, rounds, isFinal };
    } catch (error: any) {        console.error("Error extracting text:", error);
        return { success: false, error: error.message || "Failed to extract result" };
    }
}

const WIN_BONUS = 2;
const MARGIN_BONUS = 5;

function sumBreakdown(breakdown: Record<string, any>): number {
    let sum = 0;
    for (const val of Object.values(breakdown)) {
        if (typeof val === "number") {
            sum += val;
        } else if (val && typeof val === "object") {
            for (const inner of Object.values(val as Record<string, any>)) {
                if (typeof inner === "number") sum += inner;
                else if (inner && typeof inner === "object") sum += Number((inner as any).total) || 0;
            }
        }
    }
    return sum;
}

export async function applyMatchResult(matchId: string, data: {
    customScores: Record<string, number>;
    winnerSchoolId?: string | null;
    rounds?: ParsedRound[];
}) {
    try {
        const matchRows = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
        if (matchRows.length === 0) return { success: false, error: "Match not found" };
        const match = matchRows[0];

        if (!data.customScores || Object.keys(data.customScores).length === 0) {
            return { success: false, error: "No scores to apply" };
        }

        // Resolve winner: explicit override wins, else unique top scorer
        let winnerId = data.winnerSchoolId ?? null;
        if (!winnerId) {
            const sorted = Object.entries(data.customScores).sort((a, b) => b[1] - a[1]);
            if (sorted.length >= 2 && sorted[0][1] > sorted[1][1]) winnerId = sorted[0][0];
            else if (sorted.length === 1) winnerId = sorted[0][0];
        }

        const margin = (() => {
            const sorted = Object.values(data.customScores).sort((a, b) => b - a);
            return sorted.length >= 2 ? sorted[0] - sorted[1] : 0;
        })();

        // Canonical fantasy rules: base = raw score, win bonus +2, margin bonus +5 (win by >=10)
        const schoolTotals: Record<string, { base: number, bonus: number, total: number }> = {};
        for (const [schoolId, base] of Object.entries(data.customScores)) {
            let bonus = 0;
            if (winnerId && schoolId === winnerId) {
                bonus += WIN_BONUS;
                if (margin >= 10) bonus += MARGIN_BONUS;
            }
            schoolTotals[schoolId] = { base, bonus, total: base + bonus };
        }

        // Persist full result onto the match
        const participants = ((match.participants as any[]) || []).map(p => ({
            ...p,
            result: String(data.customScores[p.schoolId] ?? p.result ?? "")
        }));

        await db.update(matches)
            .set({
                participants,
                result: {
                    scores: data.customScores,
                    ...(winnerId ? { winner: winnerId } : {}),
                    rounds: (data.rounds || []).map(r => ({ label: r.label, scores: r.scores }))
                },
                status: "settled"
            })
            .where(eq(matches.id, matchId));

        // Settle lineups for THIS matchday (gameWeek = Matchday YYYY-MM-DD)
        if (!match.scheduledAt) return { success: true, updatedLineupsCount: 0, warning: "No scheduled date; lineups not settled" };
        const gameWeek = `Matchday ${match.scheduledAt.toISOString().slice(0, 10)}`;

        const lineups = await db.select()
            .from(fantasyLineups)
            .where(eq(fantasyLineups.gameWeek, gameWeek));

        let updatedCount = 0;

        for (const lineup of lineups) {
            const squad = [lineup.school1Id, lineup.school2Id, lineup.school3Id].filter(Boolean) as string[];
            const relevant = squad.filter(id => schoolTotals[id]);
            if (relevant.length === 0) continue;

            const breakdown = { ...((lineup.pointsBreakdown as Record<string, any>) || {}) };
            const matchBreakdown: Record<string, any> = {};

            for (const id of squad) {
                if (schoolTotals[id]) {
                    matchBreakdown[id] = { ...schoolTotals[id] };
                } else if (breakdown[matchId]?.[id]) {
                    matchBreakdown[id] = breakdown[matchId][id];
                }
            }

            breakdown[matchId] = matchBreakdown;
            const newTotal = sumBreakdown(breakdown);
            const delta = newTotal - (lineup.pointsEarned || 0);

            await db.update(fantasyLineups)
                .set({
                    pointsBreakdown: breakdown,
                    pointsEarned: newTotal,
                    status: "settled",
                    updatedAt: new Date()
                })
                .where(eq(fantasyLineups.id, lineup.id));

            if (delta !== 0) {
                await db.update(users)
                    .set({ totalFantasyPoints: sql`${users.totalFantasyPoints} + ${delta}` })
                    .where(eq(users.id, lineup.userId));
            }

            updatedCount++;
        }

        safeRevalidatePath("/leaderboard");
        return { success: true, updatedLineupsCount: updatedCount, winnerId, margin };
    } catch (error) {
        console.error("Error applying match result:", error);
        return { success: false, error: "Failed to apply match result" };
    }
}



export async function saveRunningResult(matchId: string, data: {
    customScores: Record<string, number>;
    rounds?: ParsedRound[];
}) {
    try {
        const matchRows = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
        if (matchRows.length === 0) return { success: false, error: "Match not found" };
        const match = matchRows[0];

        if (match.status === "settled") return { success: false, error: "Match already settled" };

        // Reflect progress publicly: users watching see live scores round by round
        await db.update(matches)
            .set({
                result: {
                    scores: data.customScores,
                    rounds: (data.rounds || []).map(r => ({ label: r.label, scores: r.scores }))
                },
                participants: ((match.participants as any[]) || []).map(p => ({
                    ...p,
                    result: String(data.customScores[p.schoolId] ?? p.result ?? "")
                })),
                status: "live",
                isLive: true,
                currentRound: (data.rounds || []).length
            })
            .where(eq(matches.id, matchId));

        safeRevalidatePath("/matches");
        safeRevalidatePath("/live");
        return { success: true };
    } catch (error) {
        console.error("Error saving running result:", error);
        return { success: false, error: "Failed to save running result" };
    }
}


// ──────────────────────────────────────────────────────────────────────────────
// Batch extract: paste multi-contest coverage once, split & extract per match
// ──────────────────────────────────────────────────────────────────────────────

type BatchResult = {
    matchId: string
    stage: string
    tournamentName: string
    participants: { schoolId: string; name: string; odd?: number }[]
    customScores: Record<string, number>
    winnerSchoolId: string | null
    rounds: { label: string; scores: Record<string, number> }[]
    isFinal: boolean
}

export async function batchExtractResults(text: string): Promise<{
    success: boolean
    results?: BatchResult[]
    error?: string
    warning?: string
}> {
    try {
        if (!text.trim()) return { success: false, error: "No coverage text provided" };

        // 1. Fetch all non-settled matches with participants
        const allMatches = await db.select({
            match: matches,
            tournamentName: tournaments.name,
        })
            .from(matches)
            .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
            .where(ne(matches.status, "settled"));

        if (allMatches.length === 0) return { success: false, error: "No pending matches found" };

        // 2. Build per-match lookup by school names (lowercase, stripped)
        type MatchInfo = { id: string; stage: string; tournamentName: string; schoolKeys: string[]; participants: any[] }
        const matchInfos: MatchInfo[] = allMatches.map(r => {
            const parts = (r.match.participants as any[]) || [];
            return {
                id: r.match.id,
                stage: r.match.stage || "Unknown",
                tournamentName: r.tournamentName || "Unknown",
                schoolKeys: parts.map(p => normalizeSchoolName(p.name)),
                participants: parts,
            };
        });

        // 3. Split coverage into segments by common NSMQ separators
        const segments = text
            .split(/(?=End of (?:Round|contest|quiz)|MAIN AUDITORIUM|SMS Auditorium|CNC AUDITORIUM|Problem of the Day|Sponsored by)/i)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // 4. Route each segment to the best-matching contest (≥2 school name hits)
        const contestChunks: Record<string, string[]> = {};
        for (const seg of segments) {
            const lowerSeg = seg.toLowerCase();
            let bestMatch: MatchInfo | null = null;
            let bestCount = 0;

            for (const mi of matchInfos) {
                const hits = mi.schoolKeys.filter(sk =>
                    schoolMatchesSegment(sk, lowerSeg)
                ).length;
                if (hits > bestCount) {
                    bestCount = hits;
                    bestMatch = mi;
                }
            }

            if (bestMatch && bestCount >= 2) {
                if (!contestChunks[bestMatch.id]) contestChunks[bestMatch.id] = [];
                contestChunks[bestMatch.id].push(seg);
            }
        }

        // 5. Extract per matched contest using existing extraction
        const { callLLM } = await import("./ai-client");
        const results: BatchResult[] = [];
        const skipped: string[] = [];

        for (const mi of matchInfos) {
            const chunks = contestChunks[mi.id];
            if (!chunks || chunks.length === 0) continue;

            const contestText = chunks.join("\n\n");
            const extracted = await extractMatchResultFromText(contestText, mi.id);
            if (!extracted.success || !extracted.customScores) {
                skipped.push(mi.participants.map((p: any) => p.name).join(" vs "));
                console.warn(`[batch] skipped ${mi.id}: ${extracted.error || "no scores"}`);
                continue;
            }

            results.push({
                matchId: mi.id,
                stage: mi.stage,
                tournamentName: mi.tournamentName,
                participants: mi.participants,
                customScores: extracted.customScores,
                winnerSchoolId: (extracted as any).winnerSchoolId ?? null,
                rounds: (extracted as any).rounds || [],
                isFinal: (extracted as any).isFinal === true,
            });
        }

        if (results.length === 0) {
            return { success: false, error: "Could not match any coverage to pending contests. Check that school names in the coverage match the database." };
        }

        const warning = skipped.length > 0
            ? ` (${skipped.length} contest${skipped.length === 1 ? "" : "s"} failed extraction — retry by pasting again)`
            : "";

        return { success: true, results, warning: warning || undefined };
    } catch (error: any) {
        console.error("Batch extraction error:", error);
        return { success: false, error: error.message || "Batch extraction failed" };
    }
}

export async function applyBatchResults(results: BatchResult[]): Promise<{
    success: boolean
    appliedCount?: number
    error?: string
}> {
    try {
        let count = 0;
        for (const r of results) {
            const res = await applyMatchResult(r.matchId, {
                customScores: r.customScores,
                winnerSchoolId: r.winnerSchoolId,
                rounds: r.rounds,
            });
            if (res.success) count++;
        }
        return { success: true, appliedCount: count };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to apply batch results" };
    }
}

// ============================================
// QUARTER-FINAL ADMIN ACTIONS
// ============================================

export async function lockQuarterFinalPredictions() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        await db.update(quarterFinalPredictions)
            .set({ isLocked: true, lockedAt: new Date() })
            .where(eq(quarterFinalPredictions.isLocked, false));

        return { success: true, message: "All Quarter-Final predictions have been locked." };
    } catch (error: any) {
        console.error("Error in lockQuarterFinalPredictions:", error);
        return { success: false, error: error.message || "Failed to lock predictions." };
    }
}

export async function calculateQuarterFinalScores() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        // Fetch all QF matches that are finished
        const qfMatches = await db.select()
            .from(matches)
            .where(and(
                eq(matches.stage, "Quarter Final"),
                eq(matches.status, "finished")
            ));

        const matchResults = new Map<string, string>(); // matchId -> winnerSchoolId
        for (const match of qfMatches) {
            const res = match.result as any;
            if (res && res.winner) {
                matchResults.set(match.id, res.winner);
            }
        }

        // Fetch all QF predictions
        const allPredictions = await db.select().from(quarterFinalPredictions);

        let count = 0;

        for (const userPred of allPredictions) {
            let totalPoints = 0;
            const preds = userPred.predictions as { matchId: string, predictedWinnerId: string }[];

            for (const p of preds) {
                const actualWinner = matchResults.get(p.matchId);
                if (actualWinner && actualWinner === p.predictedWinnerId) {
                    // Correct Pick
                    let points = 10;
                    
                    // Wildcard Bonus
                    if (userPred.wildcardMatchId === p.matchId) {
                        points += 10; // Total 20
                    }

                    // Master Pick Bonus
                    if (userPred.masterPickSchoolId === p.predictedWinnerId) {
                        points += 30; // Total 40 (or 50 if wildcard + master pick)
                    }

                    totalPoints += points;
                }
            }

            // Update user prediction record
            await db.update(quarterFinalPredictions)
                .set({ pointsEarned: totalPoints })
                .where(eq(quarterFinalPredictions.id, userPred.id));
                
            await recalculateUserTotalFantasyPoints(userPred.userId);
            count++;
        }

        return { success: true, message: `Successfully recalculated scores for ${count} users.` };
    } catch (error: any) {
        console.error("Error in calculateQuarterFinalScores:", error);
        return { success: false, error: error.message || "Failed to calculate scores." };
    }
}

export async function lockSemiFinalPredictions() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        await db.update(semiFinalPredictions)
            .set({ isLocked: true, lockedAt: new Date() })
            .where(eq(semiFinalPredictions.isLocked, false));

        return { success: true, message: "All Semi-Final predictions have been locked." };
    } catch (error: any) {
        console.error("Error in lockSemiFinalPredictions:", error);
        return { success: false, error: error.message || "Failed to lock predictions." };
    }
}

export async function calculateSemiFinalScores() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        // Fetch all Semi-Final matches that are finished
        const sfMatches = await db.select()
            .from(matches)
            .where(and(
                eq(matches.stage, "Semi Final"),
                eq(matches.status, "finished")
            ));

        const matchResults = new Map<string, string>(); // matchId -> winnerSchoolId
        for (const match of sfMatches) {
            const res = match.result as any;
            if (res && res.winner) {
                matchResults.set(match.id, res.winner);
            }
        }

        const allPredictions = await db.select().from(semiFinalPredictions);
        let count = 0;

        for (const userPred of allPredictions) {
            let totalPoints = 0;
            const preds = userPred.predictions as { matchId: string; predictedWinnerId: string; confidence: number }[];

            for (const p of preds) {
                const actualWinner = matchResults.get(p.matchId);
                if (actualWinner && actualWinner === p.predictedWinnerId) {
                    totalPoints += 20 * p.confidence;
                }
            }

            await db.update(semiFinalPredictions)
                .set({ pointsEarned: totalPoints })
                .where(eq(semiFinalPredictions.id, userPred.id));

            await recalculateUserTotalFantasyPoints(userPred.userId);
            count++;
        }

        return { success: true, message: `Successfully calculated Semi-Final scores for ${count} users.` };
    } catch (error: any) {
        console.error("Error in calculateSemiFinalScores:", error);
        return { success: false, error: error.message || "Failed to calculate Semi-Final scores." };
    }
}

export async function lockGrandFinalPredictions() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        await db.update(grandFinalPredictions)
            .set({ isLocked: true, lockedAt: new Date() })
            .where(eq(grandFinalPredictions.isLocked, false));

        return { success: true, message: "Grand Final predictions locked." };
    } catch (error: any) {
        console.error("Error in lockGrandFinalPredictions:", error);
        return { success: false, error: error.message || "Failed to lock Grand Final predictions." };
    }
}

export async function calculateGrandFinalScores() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const gfMatches = await db.select()
            .from(matches)
            .where(and(
                eq(matches.stage, "Final"),
                eq(matches.status, "finished")
            ))
            .limit(1);

        if (gfMatches.length === 0) {
            return { success: false, error: "No finished Grand Final match found." };
        }

        const match = gfMatches[0];
        const res = match.result as any;
        const actualWinner = res?.winner;
        const actualRunnerUp = res?.runnerUp;
        const scores = res?.scores || {};

        if (!actualWinner || !actualRunnerUp) {
            return { success: false, error: "Grand Final results are incomplete (missing champion or runner-up in match result)." };
        }

        const winnerScore = Number(scores[actualWinner] || 0);
        const runnerUpScore = Number(scores[actualRunnerUp] || 0);
        const margin = Math.abs(winnerScore - runnerUpScore);

        // Determine margin range
        let actualMarginRange = "";
        if (margin >= 1 && margin <= 5) actualMarginRange = "1-5";
        else if (margin >= 6 && margin <= 10) actualMarginRange = "6-10";
        else if (margin >= 11 && margin <= 20) actualMarginRange = "11-20";
        else if (margin >= 21 && margin <= 30) actualMarginRange = "21-30";
        else if (margin >= 31) actualMarginRange = "31+";

        const allPredictions = await db.select().from(grandFinalPredictions);
        let count = 0;

        for (const userPred of allPredictions) {
            const championCorrect = userPred.championSchoolId === actualWinner;
            const runnerUpCorrect = userPred.runnerUpSchoolId === actualRunnerUp;
            const marginCorrect = userPred.marginRange === actualMarginRange;

            let champPoints = championCorrect ? 100 : 0;
            let runnerPoints = runnerUpCorrect ? 50 : 0;
            let marginPoints = marginCorrect ? 40 : 0;

            // Apply Final Boost (2x points)
            if (userPred.finalBoost === "champion") {
                champPoints *= 2;
            } else if (userPred.finalBoost === "runner_up") {
                runnerPoints *= 2;
            } else if (userPred.finalBoost === "margin") {
                marginPoints *= 2;
            }

            let totalPoints = champPoints + runnerPoints + marginPoints;

            // Perfect Prediction Bonus (+100)
            if (championCorrect && runnerUpCorrect && marginCorrect) {
                totalPoints += 100;
            }

            await db.update(grandFinalPredictions)
                .set({ pointsEarned: totalPoints })
                .where(eq(grandFinalPredictions.id, userPred.id));

            await recalculateUserTotalFantasyPoints(userPred.userId);
            count++;
        }

        return { success: true, message: `Successfully calculated Grand Final scores for ${count} users.` };
    } catch (error: any) {
        console.error("Error in calculateGrandFinalScores:", error);
        return { success: false, error: error.message || "Failed to calculate Grand Final scores." };
    }
}

export async function recalculateUserTotalFantasyPoints(userId: string) {
    try {
        // 1. Sum Matchday points from fantasyLineups
        const matchdayResult = await db.select({
            total: sql<number>`COALESCE(SUM(${fantasyLineups.pointsEarned}), 0)`
        })
        .from(fantasyLineups)
        .where(eq(fantasyLineups.userId, userId));
        const matchdayPoints = Number(matchdayResult[0]?.total || 0);

        // 2. Get QF points
        const qfResult = await db.select({
            points: quarterFinalPredictions.pointsEarned
        })
        .from(quarterFinalPredictions)
        .where(eq(quarterFinalPredictions.userId, userId))
        .limit(1);
        const qfPoints = qfResult[0]?.points || 0;

        // 3. Get SF points
        const sfResult = await db.select({
            points: semiFinalPredictions.pointsEarned
        })
        .from(semiFinalPredictions)
        .where(eq(semiFinalPredictions.userId, userId))
        .limit(1);
        const sfPoints = sfResult[0]?.points || 0;

        // 4. Get GF points
        const gfResult = await db.select({
            points: grandFinalPredictions.pointsEarned
        })
        .from(grandFinalPredictions)
        .where(eq(grandFinalPredictions.userId, userId))
        .limit(1);
        const gfPoints = gfResult[0]?.points || 0;

        const grandTotal = matchdayPoints + qfPoints + sfPoints + gfPoints;

        await db.update(users)
            .set({ totalFantasyPoints: grandTotal })
            .where(eq(users.id, userId));
            
        return { success: true, total: grandTotal };
    } catch (error: any) {
        console.error(`Error recalculating points for user ${userId}:`, error);
        return { success: false, error: error.message };
    }
}

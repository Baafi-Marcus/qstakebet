"use server"

import { db } from "./db"
import { schools, tournaments, schoolStrengths, matches, virtualSchoolStats, realSchoolStats, users, wallets, transactions, bets } from "./db/schema"
import { eq, and, sql, inArray } from "drizzle-orm"
import { type ParsedResult } from "./ai-result-parser"
import { parseRosterWithAI } from "./ai-roster-parser"
import { auth } from "./auth"

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
        const existing = await db.select().from(schools)
            .where(and(
                eq(schools.region, tournament.region),
                eq(schools.level, tournament.level),
                sql`lower(${schools.name}) = lower(${name})`
            ))
            .limit(1);

        if (existing.length > 0) {
            schoolId = existing[0].id;
            results.push({ ...existing[0], status: 'found' });
        } else {
            // Create new
            const id = `sch-${Math.random().toString(36).substr(2, 9)}`;
            const type = tournament.level === 'university' ? 'hall' : 'school';

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

        // Initialize Virtual Stats
        const vssId = `vss-${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(virtualSchoolStats).values({
            id: vssId,
            schoolId: id,
            currentForm: 1.0,
            volatilityIndex: 0.1,
            matchesPlayed: 0,
            wins: 0
        });

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
    parentId?: string | null,
    currentForm?: number,
    volatilityIndex?: number
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

            // Update AI Stats
            if (data.currentForm !== undefined || data.volatilityIndex !== undefined) {
                const existing = await tx.select().from(virtualSchoolStats).where(eq(virtualSchoolStats.schoolId, id)).limit(1);
                if (existing.length > 0) {
                    await tx.update(virtualSchoolStats).set({
                        currentForm: data.currentForm,
                        volatilityIndex: data.volatilityIndex,
                        lastUpdated: new Date()
                    }).where(eq(virtualSchoolStats.schoolId, id));
                } else {
                    const vssId = `vss-${Math.random().toString(36).substr(2, 9)}`;
                    await tx.insert(virtualSchoolStats).values({
                        id: vssId,
                        schoolId: id,
                        currentForm: data.currentForm || 1.0,
                        volatilityIndex: data.volatilityIndex || 0.1
                    });
                }
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
            await tx.delete(virtualSchoolStats).where(eq(virtualSchoolStats.schoolId, id));
            await tx.delete(realSchoolStats).where(eq(realSchoolStats.schoolId, id));
            await tx.delete(schoolStrengths).where(eq(schoolStrengths.schoolId, id));
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

    return await db.insert(tournaments).values({
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

    const updateData: any = {
        name: data.name,
        region: data.region,
        sportType: data.sportType,
        gender: data.gender,
        year: data.year,
        level: data.level,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };

    // Remove undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    return await db.update(tournaments)
        .set(updateData)
        .where(eq(tournaments.id, id))
        .returning();
}

export async function deleteTournament(id: string) {
    // Safety check: Don't delete if matches exist
    const linkedMatches = await db.select().from(matches).where(eq(matches.tournamentId, id)).limit(1);
    if (linkedMatches.length > 0) {
        return { success: false, error: "Cannot delete tournament with existing matches. Delete the matches first." };
    }

    try {
        await db.delete(tournaments).where(eq(tournaments.id, id));
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

    return await db.insert(matches).values({
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

    return await db.update(matches)
        .set(updateData)
        .where(eq(matches.id, id))
        .returning();
}

export async function deleteMatch(id: string) {
    // Safety check: Don't delete if bets exist
    const linkedBets = await db.select().from(bets).limit(1);
    // Note: Since 'bets' table uses JSONB for selections, we filter in JS for now or use SQL JSON search
    // For large scale, we'd use: where(sql`exists (select 1 from jsonb_array_elements(${bets.selections}) as s where s->>'matchId' = ${id})`)

    // Quick JS filter for safety in intermediate scale
    const allPendingBets = await db.select().from(bets).where(eq(bets.status, "pending"));
    const hasBets = allPendingBets.some(b => {
        const selections = b.selections as any[];
        return selections.some(s => s.matchId === id);
    });

    if (hasBets) {
        return { success: false, error: "Cannot delete match with active bets. Void the bets first." };
    }

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
    // 1. Fetch school ratings (Base Seed)
    const baseStrengths = await db.select().from(schoolStrengths)
        .where(and(
            eq(schoolStrengths.sportType, sportType),
            eq(schoolStrengths.gender, gender)
        ));

    // 1b. Fetch Live Form (Real Stats)
    const liveStats = await db.select().from(realSchoolStats)
        .where(and(
            inArray(realSchoolStats.schoolId, schoolIds),
            eq(realSchoolStats.sportType, sportType),
            eq(realSchoolStats.gender, gender)
        ));

    // 2. Calculate probabilities
    let totalPower = 0;
    const schoolPowers = schoolIds.map(id => {
        // Base Rating (Default 50)
        const s = baseStrengths.find(st => st.schoolId === id);
        let power = (s?.rating as { overall?: number })?.overall || 50;

        // Live Form Adjustment
        const live = liveStats.find(l => l.schoolId === id);
        if (live && live.matchesPlayed && live.matchesPlayed > 0) {
            // FormFactor: 1.0 is neutral. Range 0.5 to 2.0.
            // Blend: 70% Base + 30% Form? Or direct multiplier?
            // Let's use Multiplier for dynamic drift.
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
}) {
    try {
        const { settleMatch } = await import("./settlement")
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
        await db.update(matches)
            .set({
                result: {
                    scores: resultData.scores,
                    winner: resultData.winner,
                    metadata: resultData.metadata
                },
                status: resultData.status,
                autoEndAt: resultData.autoEndAt ? new Date(resultData.autoEndAt) : null,
                lastTickAt: new Date()
            })
            .where(eq(matches.id, matchId))

        // If match is finished, trigger settlement + Update History Stats
        if (resultData.status === "finished") {
            const settlementResult = await settleMatch(matchId)

            // Update Real School Stats (Background)
            // Fetch match details to get sport type and school IDs
            const matchDetails = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
            if (matchDetails.length > 0) {
                await updateRealSchoolStats(matchDetails[0], resultData);
            }

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
        const participants = match.participants as Array<{ name: string }> | null
        const pNames = participants?.map(p => p.name).join(" vs ") || "Teams"

        // Get existing markets
        const currentOdds = (match.extendedOdds as Record<string, any>) || {}
        const currentMarkets = Object.keys(currentOdds)

        const details = `${match.sportType} match between ${pNames}. Gender: ${match.gender}. Stage: ${match.stage}.`

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
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        // Verify admin
        const admin = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { id: true, role: true }
        })
        if (admin?.role !== 'admin') throw new Error("Forbidden")

        const userWallet = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)
        if (!userWallet.length) throw new Error("Wallet not found")

        const wallet = userWallet[0]
        const balanceBefore = Number(wallet.balance)
        const balanceAfter = balanceBefore + amount

        await db.update(wallets)
            .set({ balance: balanceAfter, updatedAt: new Date() })
            .where(eq(wallets.id, wallet.id))

        await db.insert(transactions).values({
            id: `txn-${Math.random().toString(36).substr(2, 9)}`,
            userId: userId,
            walletId: wallet.id,
            amount: amount,
            type: amount > 0 ? "bonus" : "withdrawal",
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            reference: `admin-adj-${admin.id}`,
            description: `Admin Adjustment: ${reason}`
        })

        return { success: true, newBalance: balanceAfter }
    } catch (error) {
        console.error("Balance adjustment error:", error)
        return { success: false, error: "Failed to adjust balance" }
    }
}

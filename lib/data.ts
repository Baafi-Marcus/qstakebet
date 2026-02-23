"use server"

import { db } from "@/lib/db"
import { matches, schools, tournaments } from "@/lib/db/schema"
import { Match } from "@/lib/types"
import { eq, like, desc, and, or, ne, gt, sql } from "drizzle-orm"
import { getVirtualMatchById } from "./virtuals"
import { unstable_cache } from "next/cache"

// Helper to cast DB result to Match type
function mapDbMatchToMatch(dbMatch: unknown): Match {
    const m = dbMatch as Record<string, unknown>;
    return {
        id: m.id as string,
        tournamentId: (m.tournamentId as string) || null,
        startTime: (m.startTime as string) || "",
        scheduledAt: m.scheduledAt ? new Date(m.scheduledAt as string | Date).toISOString() : null,
        status: (m.status as string) || "upcoming",
        isLive: Boolean(m.isLive),
        isVirtual: Boolean(m.isVirtual),
        stage: (m.stage as string) || "",
        sportType: (m.sportType as string) || "football",
        gender: (m.gender as string) || "male",
        participants: (m.participants as Match['participants']) || [],
        odds: (m.odds as Match['odds']) || {},
        extendedOdds: (m.extendedOdds as Match['extendedOdds']) || undefined,
        margin: typeof m.margin === 'number' ? m.margin : 0.1,
        currentRound: typeof m.currentRound === 'number' ? m.currentRound : 0,
        liveMetadata: m.liveMetadata || null,
        result: (m.result as Match['result']) || null,
    }
}

// Reuseable filter for "Active/Recent" matches
const getActiveMatchFilter = (twentyFourHoursAgo: Date) => {
    return and(
        eq(matches.isVirtual, false),
        or(
            // 1. Matches that are NOT finished, settled, or cancelled
            and(
                ne(matches.status, "finished"),
                ne(matches.status, "settled"),
                ne(matches.status, "cancelled")
            ),
            // 2. Finished or Settled matches within last 24h
            and(
                or(eq(matches.status, "finished"), eq(matches.status, "settled")),
                or(
                    gt(matches.lastTickAt, twentyFourHoursAgo),
                    and(sql`${matches.lastTickAt} IS NULL`, gt(matches.createdAt, twentyFourHoursAgo))
                )
            ),
            // 3. Cancelled matches within last 24h
            and(
                eq(matches.status, "cancelled"),
                gt(matches.createdAt, twentyFourHoursAgo)
            )
        )
    )
}

export const getAllMatches = unstable_cache(
    async (): Promise<Match[]> => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const results = await db.select({
            match: matches,
            region: tournaments.region,
            level: tournaments.level
        })
            .from(matches)
            .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
            .where(getActiveMatchFilter(twentyFourHoursAgo))

        return results.map(r => ({
            ...mapDbMatchToMatch(r.match),
            region: r.region || undefined,
            level: r.level || undefined
        }))
    },
    ["matches-all"],
    { revalidate: 30, tags: ["matches"] }
)

export async function getAllMatchesWithTournaments() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const results = await db.select({
        match: matches,
        region: tournaments.region,
        level: tournaments.level
    })
        .from(matches)
        .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
        .where(getActiveMatchFilter(twentyFourHoursAgo))

    return results.map(r => ({
        ...mapDbMatchToMatch(r.match),
        region: r.region,
        level: r.level
    }))
}

export async function getVirtualMatches(): Promise<Match[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const results = await db.select().from(matches).where(
        and(
            eq(matches.isVirtual, true),
            or(
                ne(matches.status, "finished"),
                ne(matches.status, "settled"),
                and(
                    or(eq(matches.status, "finished"), eq(matches.status, "settled")),
                    gt(matches.createdAt, twentyFourHoursAgo)
                )
            )
        )
    )
    return results.map(mapDbMatchToMatch)
}

export const getFeaturedMatches = unstable_cache(
    async (): Promise<Match[]> => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const results = await db.select({
            match: matches,
            tournamentName: tournaments.name,
            level: tournaments.level,
            region: tournaments.region
        })
            .from(matches)
            .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
            .where(getActiveMatchFilter(twentyFourHoursAgo))
            .orderBy(desc(matches.isLive), desc(matches.startTime))
            .limit(10)

        return results.map(r => ({
            ...mapDbMatchToMatch(r.match),
            tournamentName: r.tournamentName || null,
            level: r.level || undefined,
            region: r.region || undefined
        }))
    },
    ["matches-featured"],
    { revalidate: 60, tags: ["matches"] }
)

export async function getMatchById(id: string): Promise<Match | undefined> {
    if (id.startsWith("vmt-")) {
        const schoolsData = await getAllSchools();
        const schools = schoolsData.map(s => ({ name: s.name, region: s.region }));
        const vMatch = getVirtualMatchById(id, schools);
        if (!vMatch) return undefined;

        // Map virtual match to the new generalized Match interface
        return {
            id: vMatch.id,
            tournamentId: null,
            participants: (vMatch.participants as Record<string, unknown>[]) || vMatch.odds ? Object.entries(vMatch.odds as Record<string, number>).map(([name, odd]) => ({
                schoolId: name,
                name: name,
                odd: odd as number
            })) : [],
            startTime: "Virtual",
            isLive: true,
            isVirtual: true,
            stage: vMatch.stage,
            odds: vMatch.odds as Match['odds'],
            extendedOdds: vMatch.extendedOdds,
            sportType: "quiz",
            gender: "male",
            margin: 0.1
        };
    }

    const results = await db.select().from(matches).where(eq(matches.id, id))
    if (results.length === 0) return undefined
    return mapDbMatchToMatch(results[0])
}

export async function getMatchesByStage(stageSlug: string): Promise<Match[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const results = await db.select().from(matches).where(
        and(
            like(matches.stage, `%${stageSlug}%`),
            or(
                ne(matches.status, "finished"),
                ne(matches.status, "settled"),
                and(
                    or(eq(matches.status, "finished"), eq(matches.status, "settled")),
                    or(
                        gt(matches.lastTickAt, twentyFourHoursAgo),
                        and(sql`${matches.lastTickAt} IS NULL`, gt(matches.createdAt, twentyFourHoursAgo))
                    )
                )
            )
        )
    )
    return results.map(mapDbMatchToMatch)
}

export async function getAllSchools() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing in technical environment");
    }
    try {
        const result = await db.select().from(schools);
        console.log(`✅ Successfully fetched ${result.length} schools`);
        return result;
    } catch (error) {
        console.error("❌ Failed to fetch schools from database:", error);
        throw error;
    }
}

export async function getTournamentWithStandings(tournamentId: string) {
    const tData = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
    if (tData.length === 0) return null;
    const tournament = tData[0];

    const matchData = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
    const schoolIds = Array.from(new Set(matchData.flatMap(m => (m.participants as any[]).map((p: any) => p.schoolId))));

    const schoolData = schoolIds.length > 0
        ? await db.select().from(schools).where(sql`${schools.id} = ANY(${schoolIds})`)
        : [];

    return { tournament, matches: matchData, schools: schoolData };
}

export async function getAllActiveTournaments() {
    return db.select().from(tournaments).where(eq(tournaments.status, 'active'));
}

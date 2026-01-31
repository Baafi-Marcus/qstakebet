"use server"

import { db } from "@/lib/db"
import { matches, schools, tournaments } from "@/lib/db/schema"
import { Match } from "@/lib/types"
import { eq, like, desc } from "drizzle-orm"
import { getVirtualMatchById } from "./virtuals"

// Helper to cast DB result to Match type (handles JSON fields validation if needed)
// Helper to cast DB result to Match type
function mapDbMatchToMatch(dbMatch: unknown): Match {
    const m = dbMatch as Record<string, unknown>;
    return {
        ...m,
        id: m.id as string,
        tournamentId: m.tournamentId as string | null,
        startTime: m.startTime as string,
        isLive: m.isLive as boolean,
        isVirtual: m.isVirtual as boolean,
        stage: m.stage as string,
        sportType: m.sportType as string,
        gender: m.gender as string,
        participants: m.participants as Match['participants'],
        odds: m.odds as Match['odds'],
        extendedOdds: m.extendedOdds as Match['extendedOdds'],
        margin: typeof m.margin === 'number' ? m.margin : 0.1,
    }
}

export async function getAllMatches(): Promise<Match[]> {
    const results = await db.select().from(matches).where(eq(matches.isVirtual, false))
    return results.map(mapDbMatchToMatch)
}

export async function getVirtualMatches(): Promise<Match[]> {
    const results = await db.select().from(matches).where(eq(matches.isVirtual, true))
    return results.map(mapDbMatchToMatch)
}

export async function getFeaturedMatches(): Promise<Match[]> {
    const results = await db.select({
        match: matches,
        tournamentName: tournaments.name
    })
        .from(matches)
        .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
        .where(eq(matches.isVirtual, false))
        .orderBy(desc(matches.isLive), desc(matches.startTime))
        .limit(10)

    return results.map(r => ({
        ...mapDbMatchToMatch(r.match),
        tournamentName: r.tournamentName || null
    }))
}

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
    const results = await db.select().from(matches).where(like(matches.stage, `%${stageSlug}%`))
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

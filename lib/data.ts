import { db } from "@/lib/db"
import { matches, schools } from "@/lib/db/schema"
import { Match } from "@/lib/types"
import { eq, like, desc } from "drizzle-orm"
import { getVirtualMatchById } from "./virtuals"

// Helper to cast DB result to Match type (handles JSON fields validation if needed)
function mapDbMatchToMatch(dbMatch: typeof matches.$inferSelect): Match {
    return {
        ...dbMatch,
        odds: dbMatch.odds as Match['odds'],
        extendedOdds: dbMatch.extendedOdds as Match['extendedOdds'],
        isVirtual: dbMatch.isVirtual
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
    // For now, return Live matches or the top 4 recent ones, excluding virtuals
    const results = await db.select().from(matches)
        .where(eq(matches.isVirtual, false))
        .orderBy(desc(matches.isLive), desc(matches.startTime))
        .limit(4)
    return results.map(mapDbMatchToMatch)
}

export async function getMatchById(id: string): Promise<Match | undefined> {
    if (id.startsWith("vmt-")) {
        const schoolsData = await getAllSchools();
        const schools = schoolsData.map(s => ({ name: s.name, region: s.region }));
        return getVirtualMatchById(id, schools);
    }

    const results = await db.select().from(matches).where(eq(matches.id, id))
    if (results.length === 0) return undefined
    return mapDbMatchToMatch(results[0])
}

export async function getMatchesByStage(stageSlug: string): Promise<Match[]> {
    const term = stageSlug === 'regional' ? 'Regional'
        : stageSlug === 'semi-final' ? 'Semi-Final'
            : stageSlug === 'national' ? 'National'
                : ''

    if (!term) return []

    const results = await db.select().from(matches).where(like(matches.stage, `%${term}%`))
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

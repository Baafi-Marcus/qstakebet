import { db } from "@/lib/db"
import { tournaments, schools, matches } from "@/lib/db/schema"
import { eq, or, sql, and } from "drizzle-orm"
import { Tournament, School, Match } from "@/lib/types"
import { TournamentDetailClient } from "./TournamentDetailClient"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // 1. Fetch Tournament
    const tData = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1)
    if (tData.length === 0) return notFound()

    const tournament = tData[0] as unknown as Tournament

    // 2. Fetch Matches for this tournament
    const matchesData = await db.select().from(matches).where(eq(matches.tournamentId, id))

    // 3. Fetch Schools involved (filter by level and parent if applicable)
    const parentId = (tournament.metadata as any)?.parentUniversityId;

    // We filter by level ALWAYS
    // If it's university and has a parent, we filter by parent too
    const schoolQuery = db.select().from(schools).where(
        and(
            eq(schools.level, tournament.level),
            parentId ? eq(schools.parentId, parentId) : undefined,
            eq(schools.region, tournament.region)
        )
    )

    const allSchools = await schoolQuery;

    return (
        <TournamentDetailClient
            tournament={tournament}
            matches={matchesData as unknown as Match[]}
            schools={allSchools as unknown as School[]}
        />
    )
}

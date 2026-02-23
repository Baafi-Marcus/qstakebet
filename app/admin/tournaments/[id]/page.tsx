import { db } from "@/lib/db"
import { tournaments, schools, matches } from "@/lib/db/schema"
import { eq, or, sql, and, inArray } from "drizzle-orm"
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

    // 3. Fetch Schools involved
    const metadata = (tournament.metadata as any) || {};
    const groupAssignments = metadata.groupAssignments || {};
    const assignedSchoolIds = Object.keys(groupAssignments);

    // Also include schools from matches just in case metadata is out of sync
    const matchSchoolIds = new Set<string>();
    matchesData.forEach((m: any) => {
        m.participants?.forEach((p: any) => {
            if (p.schoolId) matchSchoolIds.add(p.schoolId);
        });
    });

    const allRelevantIds = Array.from(new Set([...assignedSchoolIds, ...Array.from(matchSchoolIds)]));

    let allSchools: School[] = [];
    if (allRelevantIds.length > 0) {
        allSchools = await db.select().from(schools).where(inArray(schools.id, allRelevantIds));
    }

    return (
        <TournamentDetailClient
            tournament={tournament}
            matches={matchesData as unknown as Match[]}
            schools={allSchools as unknown as School[]}
        />
    )
}

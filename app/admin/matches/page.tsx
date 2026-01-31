
import { db } from "@/lib/db"
import { matches, tournaments, schools } from "@/lib/db/schema"
import { Match, Tournament, School } from "@/lib/types"
import { MatchesClient } from "./MatchesClient"
import { desc } from "drizzle-orm"

export const dynamic = 'force-dynamic'

export default async function MatchesPage() {
    const allMatches = await db.select().from(matches).orderBy(desc(matches.createdAt))
    const allTournaments = await db.select().from(tournaments).orderBy(desc(tournaments.createdAt))
    const allSchools = await db.select().from(schools).orderBy(schools.name)

    return <MatchesClient
        initialMatches={allMatches as unknown as Match[]}
        tournaments={allTournaments as unknown as Tournament[]}
        schools={allSchools as unknown as School[]}
    />
}

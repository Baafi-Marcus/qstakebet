
import { db } from "@/lib/db"
import { matches, tournaments, schools } from "@/lib/db/schema"
import { MatchesClient } from "./MatchesClient"
import { desc } from "drizzle-orm"
import { Match } from "@/lib/types"

export const dynamic = 'force-dynamic'

export default async function MatchesPage() {
    const allMatches = (await db.select().from(matches).orderBy(desc(matches.createdAt))) as Match[]
    const allTournaments = await db.select().from(tournaments).orderBy(desc(tournaments.createdAt))
    const allSchools = await db.select().from(schools).orderBy(schools.name)

    return <MatchesClient
        initialMatches={allMatches}
        tournaments={allTournaments}
        schools={allSchools}
    />
}

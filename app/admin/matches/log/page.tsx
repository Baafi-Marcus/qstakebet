import { db } from "@/lib/db"
import { matches, tournaments, schools } from "@/lib/db/schema"
import { Match, Tournament, School } from "@/lib/types"
import { desc, eq } from "drizzle-orm"
import { LogClient } from "./LogClient"

export const dynamic = 'force-dynamic'

export default async function MatchLogPage() {
    const allMatches = await db.select().from(matches)
        .where(eq(matches.status, 'finished'))
        .orderBy(desc(matches.createdAt))

    const allTournaments = await db.select().from(tournaments).orderBy(desc(tournaments.createdAt))
    const allSchools = await db.select().from(schools).orderBy(schools.name)

    return (
        <LogClient
            initialMatches={allMatches as unknown as Match[]}
            tournaments={allTournaments as unknown as Tournament[]}
            schools={allSchools as unknown as School[]}
        />
    )
}

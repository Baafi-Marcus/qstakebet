import { Tournament, School } from "@/lib/types"
import { db } from "@/lib/db"
import { tournaments, schools } from "@/lib/db/schema"
import { TournamentsClient } from "./TournamentsClient"
import { desc, and, eq } from "drizzle-orm"

export const dynamic = 'force-dynamic'

export default async function TournamentsPage() {
    const allTournaments = await db.select().from(tournaments).orderBy(desc(tournaments.createdAt))

    // Fetch Universities for the creation modal
    const allUniversities = await db.select().from(schools).where(
        and(
            eq(schools.level, 'university'),
            eq(schools.type, 'school')
        )
    )

    return (
        <TournamentsClient
            initialTournaments={allTournaments as unknown as Tournament[]}
            universities={allUniversities as unknown as School[]}
        />
    )
}


import { db } from "@/lib/db"
import { tournaments } from "@/lib/db/schema"
import { TournamentsClient } from "./TournamentsClient"
import { desc } from "drizzle-orm"
import { Tournament } from "@/lib/types"

export const dynamic = 'force-dynamic'

export default async function TournamentsPage() {
    const allTournaments = await db.select().from(tournaments).orderBy(desc(tournaments.createdAt))
    return <TournamentsClient initialTournaments={allTournaments as any} />
}

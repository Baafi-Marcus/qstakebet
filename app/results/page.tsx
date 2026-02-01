import { db } from "@/lib/db"
import { matches } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { ResultsClient } from "./ResultsClient"
import { Match } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function ResultsPage() {
    // Fetch all finished matches, ordered by most recently updated/finished
    const finishedMatchesRaw = await db.select().from(matches)
        .where(eq(matches.status, "finished"))
        .orderBy(desc(matches.scheduledAt))

    const finishedMatches = finishedMatchesRaw.map(m => ({
        ...m,
        participants: m.participants as any[],
        result: m.result as any
    })) as unknown as Match[]

    return (
        <div className="min-h-screen bg-background pb-20">
            <ResultsClient initialMatches={finishedMatches} />
        </div>
    )
}

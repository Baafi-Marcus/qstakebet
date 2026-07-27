import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { matches, tournaments } from "@/lib/db/schema"
import { eq, ne } from "drizzle-orm"
import { VerifyResultsClient } from "./VerifyResultsClient"

export const dynamic = 'force-dynamic'

export default async function AdminVerifyResultsPage() {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
        redirect("/admin/login")
    }

    // Load active matches that are not settled yet
    const activeMatches = await db.select({
        match: matches,
        tournamentName: tournaments.name,
    })
        .from(matches)
        .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
        .where(ne(matches.status, "settled"))

    const mappedMatches = activeMatches.map(r => ({
        ...r.match,
        tournamentName: r.tournamentName || "Unknown Tournament"
    }))

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8">
            <VerifyResultsClient initialMatches={mappedMatches} />
        </div>
    )
}

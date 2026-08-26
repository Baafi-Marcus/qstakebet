import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { matches, tournaments, pendingResults } from "@/lib/db/schema"
import { eq, ne } from "drizzle-orm"
import { VerifyResultsClient } from "./VerifyResultsClient"
import { ApprovalQueue } from "@/components/admin/ApprovalQueue"

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

    // Load pending results
    const pending = await db.select().from(pendingResults).where(eq(pendingResults.status, 'pending'))

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Social Media Sync Queue</h1>
                <p className="text-gray-400 mb-6">Approve or reject automated result extractions from social media.</p>
                <ApprovalQueue initialPending={pending} matches={mappedMatches} />
            </div>

            <div className="pt-8 border-t border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-6">Paste & Auto-Settle Results</h2>
                <VerifyResultsClient initialMatches={mappedMatches} />
            </div>
        </div>
    )
}

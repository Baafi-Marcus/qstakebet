import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getLeaderboard, getActiveFantasyStage, getFantasyGameWeeks } from "@/lib/fantasy-actions"
import { LeaderboardClient } from "./LeaderboardClient"

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ gw?: string }> }) {
    const params = await searchParams
    const [activeStage, gameWeeks] = await Promise.all([getActiveFantasyStage(), getFantasyGameWeeks()])

    const requested = params?.gw
    const validGw = gameWeeks.some(gw => gw.gameWeek === requested) ? requested : null
    const selectedGameWeek = validGw || activeStage.gameWeek

    // Load standings for the selected matchday plus lifetime totals
    const weeklyStandings = await getLeaderboard(selectedGameWeek)
    const lifetimeStandings = await getLeaderboard()

    let viewerAlmaMater: string | null = null
    const session = await auth()
    if (session?.user?.id) {
        const rows = await db.select({ almaMater: users.almaMater }).from(users).where(eq(users.id, session.user.id)).limit(1)
        viewerAlmaMater = rows[0]?.almaMater ?? null
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <LeaderboardClient
                initialWeekly={weeklyStandings}
                initialLifetime={lifetimeStandings}
                gameWeek={selectedGameWeek}
                allGameWeeks={gameWeeks}
                viewerAlmaMater={viewerAlmaMater}
            />
        </div>
    )
}

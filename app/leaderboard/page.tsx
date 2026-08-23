import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getLeaderboard, getActiveFantasyStage } from "@/lib/fantasy-actions"
import { LeaderboardClient } from "./LeaderboardClient"

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
    const activeStage = await getActiveFantasyStage()

    // Load both weekly and lifetime leaderboards
    const weeklyStandings = await getLeaderboard(activeStage.gameWeek)
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
                gameWeek={activeStage.gameWeek}
                viewerAlmaMater={viewerAlmaMater}
            />
        </div>
    )
}

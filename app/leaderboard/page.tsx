import { getLeaderboard, getActiveFantasyStage } from "@/lib/fantasy-actions"
import { LeaderboardClient } from "./LeaderboardClient"

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
    const activeStage = await getActiveFantasyStage()
    
    // Load both weekly and lifetime leaderboards
    const weeklyStandings = await getLeaderboard(activeStage.gameWeek)
    const lifetimeStandings = await getLeaderboard()

    return (
        <div className="min-h-screen bg-background text-foreground">
            <LeaderboardClient
                initialWeekly={weeklyStandings}
                initialLifetime={lifetimeStandings}
                gameWeek={activeStage.gameWeek}
            />
        </div>
    )
}

import { getLeaderboard } from "@/lib/fantasy-actions"
import { LeaderboardClient } from "./LeaderboardClient"

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
    const activeGameWeek = "National Finals"
    
    // Load both weekly and lifetime leaderboards
    const weeklyStandings = await getLeaderboard(activeGameWeek)
    const lifetimeStandings = await getLeaderboard()

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <LeaderboardClient
                initialWeekly={weeklyStandings}
                initialLifetime={lifetimeStandings}
                gameWeek={activeGameWeek}
            />
        </div>
    )
}

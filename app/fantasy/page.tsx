import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { schools, matches } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUserLineup, getUserLineupHistory, getFantasyStages, getParticipatingSchoolsForStage } from "@/lib/fantasy-actions"
import { isPlayoffStage } from "@/lib/playoff-stages"
import { FantasyClient } from "./FantasyClient"
import PlayoffPredictionsPanel from "./PlayoffPredictionsPanel"

export const dynamic = 'force-dynamic'

export default async function FantasyPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/auth/login?callbackUrl=/fantasy")
    }

    const stages = await getFantasyStages()
    const lineupHistory = await getUserLineupHistory(session.user.id)
    
    // Data for Current Stage
    let currentSchools: any[] = []
    let currentLineup = null
    if (stages.currentStage) {
        currentSchools = await getParticipatingSchoolsForStage(stages.currentStage.gameWeek)
        currentLineup = await getUserLineup(session.user.id, stages.currentStage.gameWeek)
    }

    // Data for Next Stage
    let nextSchools: any[] = []
    let nextLineup = null
    if (stages.nextStage) {
        nextSchools = await getParticipatingSchoolsForStage(stages.nextStage.gameWeek)
        nextLineup = await getUserLineup(session.user.id, stages.nextStage.gameWeek)
    }

    // Check which playoff stages currently have any scheduled matches
    const allMatches = await db.select({ id: matches.id, stage: matches.stage }).from(matches)
    const hasQF = allMatches.some(m => isPlayoffStage(m.stage, "quarterFinal"))
    const hasSF = allMatches.some(m => isPlayoffStage(m.stage, "semiFinal"))
    const hasGF = allMatches.some(m => isPlayoffStage(m.stage, "grandFinal"))

    return (
        <div className="min-h-screen bg-background text-foreground">
            <FantasyClient
                stages={stages}
                currentSchools={currentSchools}
                currentLineup={currentLineup}
                nextSchools={nextSchools}
                nextLineup={nextLineup}
                lineupHistory={lineupHistory}
                hasQF={hasQF}
                hasSF={hasSF}
                hasGF={hasGF}
            />
            <PlayoffPredictionsPanel />
        </div>
    )
}

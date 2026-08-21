import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { schools } from "@/lib/db/schema"
import { getUserLineup, getFantasyStages, getParticipatingSchoolsForStage } from "@/lib/fantasy-actions"
import { FantasyClient } from "./FantasyClient"

export const dynamic = 'force-dynamic'

export default async function FantasyPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/auth/login?callbackUrl=/fantasy")
    }

    const stages = await getFantasyStages()
    
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

    return (
        <div className="min-h-screen bg-background text-foreground">
            <FantasyClient
                stages={stages}
                currentSchools={currentSchools}
                currentLineup={currentLineup}
                nextSchools={nextSchools}
                nextLineup={nextLineup}
            />
        </div>
    )
}

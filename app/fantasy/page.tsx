import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { schools } from "@/lib/db/schema"
import { getUserLineup, getActiveFantasyStage, getParticipatingSchoolsForStage } from "@/lib/fantasy-actions"
import { FantasyClient } from "./FantasyClient"

export const dynamic = 'force-dynamic'

export default async function FantasyPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/auth/login?callbackUrl=/fantasy")
    }

    // Determine the active game week/stage from upcoming fixtures
    const activeStage = await getActiveFantasyStage()
    
    // Load only schools that are playing in the active stage
    const allSchools = await getParticipatingSchoolsForStage(activeStage.gameWeek)
    const currentLineup = await getUserLineup(session.user.id, activeStage.gameWeek)

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <FantasyClient
                initialSchools={allSchools}
                currentLineup={currentLineup}
                activeGameWeek={activeStage.gameWeek}
                deadline={activeStage.deadline}
            />
        </div>
    )
}

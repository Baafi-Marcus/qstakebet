import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { schools } from "@/lib/db/schema"
import { getUserLineup } from "@/lib/fantasy-actions"
import { FantasyClient } from "./FantasyClient"

export const dynamic = 'force-dynamic'

export default async function FantasyPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/auth/login?callbackUrl=/fantasy")
    }

    // Load schools
    const dbSchools = await db.select().from(schools).orderBy(schools.category, schools.name)
    
    // Map to client schema
    const allSchools = dbSchools.map(school => ({
        id: school.id,
        name: school.name,
        region: school.region,
        tier: school.category || 'C',
        creditCost: school.category === 'A' ? 30 : school.category === 'B' ? 20 : 15
    }))

    // Current active Game Week is set to "National Finals"
    const activeGameWeek = "National Finals"
    const currentLineup = await getUserLineup(session.user.id, activeGameWeek)

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <FantasyClient
                initialSchools={allSchools}
                currentLineup={currentLineup}
                activeGameWeek={activeGameWeek}
            />
        </div>
    )
}

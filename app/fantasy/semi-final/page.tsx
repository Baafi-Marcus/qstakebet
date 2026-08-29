import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { matches } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { getSemiFinalPrediction } from "@/lib/fantasy-actions"
import { isPlayoffStage } from "@/lib/playoff-stages"
import SemiFinalClient from "./SemiFinalClient"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Semi-Final Confidence Challenge | QSTAKEbet",
    description: "Predict the Semi-Final winners and assign confidence levels.",
}

export default async function SemiFinalPage() {
    const session = await auth()
    
    if (!session?.user) {
        redirect("/auth/login?callbackUrl=/fantasy/semi-final")
    }

    // 1. Fetch Semi-Final Contests
    const sfAll = await db.select({
        id: matches.id,
        stage: matches.stage,
        scheduledAt: matches.scheduledAt,
        status: matches.status,
        participants: matches.participants,
        result: matches.result
    })
    .from(matches)
    .orderBy(asc(matches.scheduledAt))

    const sfMatches = sfAll.filter((m) => isPlayoffStage(m.stage, "semiFinal"))

    // Determine if the global deadline has passed
    let isDeadlinePassed = false;
    let firstMatchDate = null;

    if (sfMatches.length > 0) {
        const firstMatch = sfMatches[0];
        if (firstMatch.scheduledAt) {
            firstMatchDate = firstMatch.scheduledAt;
            if (new Date() >= firstMatch.scheduledAt) {
                isDeadlinePassed = true;
            }
        }
    }

    // 2. Format Contests
    const formattedContests = sfMatches.map((m) => {
        const participants = (m.participants as any[]) || [];
        const resultObj = (m.result as any) || {};
        
        return {
            id: m.id,
            scheduledAt: m.scheduledAt,
            status: m.status,
            actualWinnerId: resultObj.winner || null,
            schools: participants.map(p => ({
                id: p.schoolId,
                name: p.name,
                actualScore: resultObj.scores ? resultObj.scores[p.schoolId] : null
            }))
        }
    })

    // 3. Fetch User's Current Prediction
    const userPrediction = await getSemiFinalPrediction(session.user.id)

    const isLocked = userPrediction?.isLocked || isDeadlinePassed;

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <span className="text-3xl">🔥</span> 
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            Semi-Final Confidence Challenge
                        </span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        Predict the winner of each Semi-Final contest. Assign your confidence multipliers ⚡ 1×, ⭐ 2×, and 🔥 3× exactly once!
                    </p>
                </div>

                <SemiFinalClient 
                    contests={formattedContests} 
                    initialPrediction={userPrediction}
                    isLocked={isLocked}
                    deadline={firstMatchDate ? firstMatchDate.toISOString() : null}
                />
            </div>
        </div>
    )
}

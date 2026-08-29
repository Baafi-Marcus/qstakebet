import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { matches, schools } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { getQuarterFinalPrediction } from "@/lib/fantasy-actions"
import { isPlayoffStage } from "@/lib/playoff-stages"
import QuarterFinalClient from "./QuarterFinalClient"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Quarter-Final Predictor | QSTAKEbet",
    description: "Predict the Quarter-Final winners for NSMQ Fantasy.",
}

export default async function QuarterFinalPage() {
    const session = await auth()
    
    if (!session?.user) {
        redirect("/auth/login?callbackUrl=/fantasy/quarter-final")
    }

    // 1. Fetch Quarter-Final Contests
    const allMatches = await db.select({
        id: matches.id,
        stage: matches.stage,
        scheduledAt: matches.scheduledAt,
        status: matches.status,
        participants: matches.participants,
        result: matches.result
    })
    .from(matches)
    .orderBy(asc(matches.scheduledAt))

    const qfMatches = allMatches.filter((m) => isPlayoffStage(m.stage, "quarterFinal"))

    // Determine if the global deadline has passed
    // Global deadline = scheduled time of the first QF match
    let isDeadlinePassed = false;
    let firstMatchDate = null;

    if (qfMatches.length > 0) {
        const firstMatch = qfMatches[0];
        if (firstMatch.scheduledAt) {
            firstMatchDate = firstMatch.scheduledAt;
            if (new Date() >= firstMatch.scheduledAt) {
                isDeadlinePassed = true;
            }
        }
    }

    // 2. Format Contests
    const formattedContests = qfMatches.map((m) => {
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
    const userPrediction = await getQuarterFinalPrediction(session.user.id)

    // A user's prediction is locked if it's explicitly locked OR if the global deadline has passed
    const isLocked = userPrediction?.isLocked || isDeadlinePassed;

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        Quarter-Final Predictor
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        Predict the winner of each contest. Use your Wildcard on one contest for a +30 bonus and choose one Master Pick school for another +30.
                    </p>
                </div>

                <QuarterFinalClient 
                    contests={formattedContests} 
                    initialPrediction={userPrediction}
                    isLocked={isLocked}
                    deadline={firstMatchDate ? firstMatchDate.toISOString() : null}
                />
            </div>
        </div>
    )
}

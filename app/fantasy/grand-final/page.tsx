import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { matches } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getGrandFinalPrediction } from "@/lib/fantasy-actions"
import { isPlayoffStage } from "@/lib/playoff-stages"
import GrandFinalClient from "./GrandFinalClient"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Ultimate NSMQ Predictor | QSTAKEbet",
    description: "Make your final predictions for the Grand Final.",
}

export default async function GrandFinalPage() {
    const session = await auth()
    
    if (!session?.user) {
        redirect("/auth/login?callbackUrl=/fantasy/grand-final")
    }

    // 1. Fetch Grand Final Match
    const gfAll = await db.select({
        id: matches.id,
        stage: matches.stage,
        scheduledAt: matches.scheduledAt,
        status: matches.status,
        participants: matches.participants,
        result: matches.result
    })
    .from(matches)

    const gfMatches = gfAll
        .filter((m) => isPlayoffStage(m.stage, "grandFinal"))
        .slice(0, 1)

    if (gfMatches.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
                <h1 className="text-2xl font-black font-russo uppercase mb-2">Grand Final pending</h1>
                <p className="text-slate-400 text-sm">The finalists have not been scheduled yet. Check back soon!</p>
            </div>
        )
    }

    const match = gfMatches[0];
    const resultObj = (match.result as any) || {};
    const participants = (match.participants as any[]) || [];

    // Determine if the global deadline has passed
    let isDeadlinePassed = false;
    let matchDate = null;

    if (match.scheduledAt) {
        matchDate = match.scheduledAt;
        if (new Date() >= match.scheduledAt) {
            isDeadlinePassed = true;
        }
    }

    // 2. Format Contest Schools
    const schoolsList = participants.map(p => ({
        id: p.schoolId,
        name: p.name,
        actualScore: resultObj.scores ? resultObj.scores[p.schoolId] : null
    }));

    // 3. Fetch User's Current Prediction
    const userPrediction = await getGrandFinalPrediction(session.user.id)

    const isLocked = userPrediction?.isLocked || isDeadlinePassed;

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        Ultimate NSMQ Predictor
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        Welcome to the Grand Final! Predict the Champion, Runner-Up, and Winning Margin. Boost one selection for double points!
                    </p>
                </div>

                <GrandFinalClient 
                    schools={schoolsList}
                    initialPrediction={userPrediction}
                    isLocked={isLocked}
                    deadline={matchDate ? matchDate.toISOString() : null}
                    matchResult={resultObj}
                />
            </div>
        </div>
    )
}

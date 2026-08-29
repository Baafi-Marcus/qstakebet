"use client"

import { useState, useEffect } from "react"
import { saveQuarterFinalPrediction } from "@/lib/fantasy-actions"
import { Star, Flame, Lock, CheckCircle2 } from "lucide-react"

type School = {
    id: string
    name: string
    actualScore?: number | null
}

type Contest = {
    id: string
    scheduledAt: Date | null
    status: string
    actualWinnerId: string | null
    schools: School[]
}

type Prediction = {
    matchId: string
    predictedWinnerId: string
}

export default function QuarterFinalClient({
    contests,
    initialPrediction,
    isLocked,
    deadline
}: {
    contests: Contest[]
    initialPrediction: any
    isLocked: boolean
    deadline: string | null
}) {
    const [predictions, setPredictions] = useState<Prediction[]>(
        initialPrediction?.predictions || []
    )
    const [wildcardMatchId, setWildcardMatchId] = useState<string | null>(
        initialPrediction?.wildcardMatchId || null
    )
    const [masterPickSchoolId, setMasterPickSchoolId] = useState<string | null>(
        initialPrediction?.masterPickSchoolId || null
    )
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSelectWinner = (matchId: string, schoolId: string) => {
        if (isLocked) return

        setPredictions(prev => {
            const existing = prev.findIndex(p => p.matchId === matchId)
            if (existing >= 0) {
                const newPreds = [...prev]
                newPreds[existing] = { matchId, predictedWinnerId: schoolId }
                return newPreds
            }
            return [...prev, { matchId, predictedWinnerId: schoolId }]
        })

        // If this match was the master pick but we changed the winner, we should clear the master pick 
        // IF the new winner is different. Wait, Master pick is linked to the school.
        // If they pick a new winner, and the old winner was the master pick, reset it.
        const prevPred = predictions.find(p => p.matchId === matchId)
        if (prevPred && prevPred.predictedWinnerId === masterPickSchoolId) {
            setMasterPickSchoolId(null)
        }
    }

    const handleSelectWildcard = (matchId: string) => {
        if (isLocked) return
        setWildcardMatchId(matchId === wildcardMatchId ? null : matchId)
    }

    const handleSelectMasterPick = (schoolId: string) => {
        if (isLocked) return
        setMasterPickSchoolId(schoolId === masterPickSchoolId ? null : schoolId)
    }

    const handleSave = async () => {
        if (isLocked) return
        
        // Validation
        if (predictions.length !== 9 && contests.length === 9) {
            setError("Please predict a winner for all 9 Quarter-Final contests.")
            return
        }
        if (!wildcardMatchId) {
            setError("Please select one contest to use your Wildcard on.")
            return
        }
        if (!masterPickSchoolId) {
            setError("Please select one school as your Master Pick.")
            return
        }

        setIsSaving(true)
        setError(null)
        setSuccess(false)

        const res = await saveQuarterFinalPrediction(
            predictions,
            wildcardMatchId,
            masterPickSchoolId
        )

        setIsSaving(false)

        if (res.success) {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
            window.location.reload(); // Reflect the now-locked state
        } else {
            setError(res.error || "Failed to save predictions.")
        }
    }

    const getPredictedWinnerId = (matchId: string) => {
        return predictions.find(p => p.matchId === matchId)?.predictedWinnerId
    }

    const isAllPredicted = predictions.length === (contests.length || 9)

    return (
        <div className="space-y-6">
            {isLocked && (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-bold text-slate-200">Predictions Locked</h3>
                        <p className="text-sm text-slate-400">The deadline has passed and your predictions are locked.</p>
                    </div>
                </div>
            )}

            {/* Error & Success Messages */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}
            
            <div className="space-y-8">
                {contests.map((contest, idx) => {
                    const predictedId = getPredictedWinnerId(contest.id)
                    const isWildcard = wildcardMatchId === contest.id
                    const isFinished = contest.status === "finished"

                    return (
                        <div key={contest.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-hidden relative">
                            {isWildcard && (
                                <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-500 text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-500" />
                                    WILDCARD
                                </div>
                            )}

                            <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
                                Quarter-Final {idx + 1}
                            </h3>

                            <div className="flex flex-col gap-2">
                                {contest.schools.map((school) => {
                                    const isSelected = predictedId === school.id
                                    const isMasterPick = masterPickSchoolId === school.id
                                    const isActualWinner = isFinished && contest.actualWinnerId === school.id

                                    return (
                                        <button
                                            key={school.id}
                                            onClick={() => handleSelectWinner(contest.id, school.id)}
                                            disabled={isLocked}
                                            className={`
                                                w-full text-left p-4 rounded-xl flex items-center justify-between transition-standard hover:-translate-y-0.5 relative overflow-hidden
                                                ${isSelected 
                                                    ? 'bg-blue-600 border border-blue-500' 
                                                    : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800'}
                                                ${isLocked && !isSelected ? 'opacity-50 grayscale' : ''}
                                            `}
                                        >
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-white' : 'border-slate-500'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                </div>
                                                <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                    {school.name}
                                                </span>
                                            </div>

                                            {/* Show Actual Result if Finished */}
                                            {isFinished && isActualWinner && (
                                                <span className="text-emerald-400 font-bold text-sm bg-emerald-400/10 px-2 py-1 rounded">Winner</span>
                                            )}
                                            
                                            {/* Master Pick Selection / Indicator */}
                                            {isSelected && (
                                                <div className="flex gap-2">
                                                    {isMasterPick && (
                                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                                            <Flame className="w-3 h-3 fill-white" /> Master Pick
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Options below the match (Wildcard & Master Pick) */}
                            {predictedId && !isLocked && !isFinished && (
                                <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                                    <button
                                        onClick={() => handleSelectWildcard(contest.id)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-standard hover:-translate-y-0.5 ${
                                            isWildcard 
                                                ? 'bg-amber-500 text-slate-950' 
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-amber-400'
                                        }`}
                                    >
                                        <Star className={`w-4 h-4 ${isWildcard ? 'fill-slate-950' : ''}`} />
                                        {isWildcard ? 'Wildcard Selected' : 'Make Wildcard'}
                                    </button>

                                    <button
                                        onClick={() => handleSelectMasterPick(predictedId)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-standard hover:-translate-y-0.5 ${
                                            masterPickSchoolId === predictedId 
                                                ? 'bg-red-500 text-white' 
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-red-400'
                                        }`}
                                    >
                                        <Flame className={`w-4 h-4 ${masterPickSchoolId === predictedId ? 'fill-white' : ''}`} />
                                        {masterPickSchoolId === predictedId ? 'Master Pick Selected' : 'Make Master Pick'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Bottom Bar */}
            {!isLocked && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 z-50">
                    <div className="max-w-3xl mx-auto flex items-center gap-4">
                        <div className="flex-1">
                            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                                Progress
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${(predictions.length / (contests.length || 9)) * 100}%` }}
                                />
                            </div>
                            <div className="text-xs text-slate-300 mt-1 flex justify-between">
                                <span>{predictions.length} / {contests.length || 9} Winners</span>
                                {wildcardMatchId && <span className="font-bold uppercase text-[10px] text-amber-400">Wildcard set</span>}
                                {masterPickSchoolId && <span className="font-bold uppercase text-[10px] text-red-400">Master set</span>}
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !isAllPredicted || !wildcardMatchId || !masterPickSchoolId}
                            className={`
                                py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-standard hover:-translate-y-0.5
                                ${isAllPredicted && wildcardMatchId && masterPickSchoolId
                                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                            `}
                        >
                            {isSaving ? (
                                'Saving...'
                            ) : success ? (
                                <><CheckCircle2 className="w-5 h-5" /> Saved!</>
                            ) : (
                                'Lock Predictions'
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

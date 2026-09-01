"use client"

import { useState, useEffect } from "react"
import { saveSemiFinalPrediction } from "@/lib/fantasy-actions"
import { Clock, Lock, CheckCircle2, Pencil, Info, Zap } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

function formatDeadline(deadline: string | null) {
    if (!deadline) return null
    const d = new Date(deadline)
    if (isNaN(d.getTime())) return null
    const dateStr = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
    }).format(d)
    return `${dateStr} UTC`
}

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
    confidence: number | null
}

export default function SemiFinalClient({
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
    // Standardize initial predictions structure
    const initialPreds: Prediction[] = contests.map(c => {
        const existing = (initialPrediction?.predictions || []).find((p: any) => p.matchId === c.id);
        return {
            matchId: c.id,
            predictedWinnerId: existing?.predictedWinnerId || "",
            confidence: existing?.confidence || null
        };
    });

    const [predictions, setPredictions] = useState<Prediction[]>(initialPreds)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [timeLeft, setTimeLeft] = useState("")

    const isSaved = Boolean(initialPrediction?.id)
    const [isEditing, setIsEditing] = useState(() => !isSaved)
    const isEditable = !isLocked && isEditing
    const [showHowTo, setShowHowTo] = useState(() => {
        if (typeof window === "undefined") return false
        return !sessionStorage.getItem("sf-howto-seen")
    })
    const deadlineFormatted = formatDeadline(deadline)

    useEffect(() => {
        if (!deadline || isLocked) return;
        const target = new Date(deadline).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft("Locked");
                return;
            }

            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`Predictions close in ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [deadline, isLocked]);

    const handleSelectWinner = (matchId: string, schoolId: string) => {
        if (!isEditable) return

        setPredictions(prev => prev.map(p => {
            if (p.matchId === matchId) {
                return { ...p, predictedWinnerId: schoolId };
            }
            return p;
        }));
        setError(null);
    }

    const handleSelectConfidence = (matchId: string, confidence: number) => {
        if (!isEditable) return

        setPredictions(prev => prev.map(p => {
            if (p.matchId === matchId) {
                return { ...p, confidence };
            }
            // If another match already had this confidence level, clear it (shift strategy)
            if (p.confidence === confidence) {
                return { ...p, confidence: null };
            }
            return p;
        }));
        setError(null);
    }

    const getUsedConfidences = () => {
        return predictions.map(p => p.confidence).filter((c): c is number => c !== null);
    }

    const usedConfidences = getUsedConfidences();
    const remainingConfidences = [1, 2, 3].filter(c => !usedConfidences.includes(c));

    const handleSave = async () => {
        if (isLocked) return
        
        // Validation
        const complete = predictions.every(p => p.predictedWinnerId && p.confidence !== null);
        if (!complete) {
            setError("Please select a winner and confidence level for all 3 Semi-Final contests.");
            return;
        }

        setIsSaving(true)
        setError(null)
        setSuccess(false)

        const formatted = predictions.map(p => ({
            matchId: p.matchId,
            predictedWinnerId: p.predictedWinnerId,
            confidence: p.confidence as number
        }));

        const res = await saveSemiFinalPrediction(formatted)
        setIsSaving(false)

        if (res.success) {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
            window.location.reload(); // Refresh the page to reflect locked status or fresh state
        } else {
            setError(res.error || "Failed to save predictions.");
        }
    }

    const getConfidenceLabel = (level: number | null) => {
        if (level === 1) return "1x";
        if (level === 2) return "2x";
        if (level === 3) return "3x";
        return "";
    }

    return (
        <div className="space-y-6 text-white">
            <div className="flex justify-end">
                <button
                    onClick={() => setShowHowTo(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700 hover:text-white transition-standard cursor-pointer"
                >
                    <Info className="w-4 h-4" /> How to Play
                </button>
            </div>

            {isLocked ? (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-bold text-slate-200">Predictions Locked</h3>
                        <p className="text-sm text-slate-400">The Semi-Final matches have started and your predictions are locked.</p>
                    </div>
                </div>
            ) : (
                deadline && (
                    <div className="bg-slate-900/60 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span className="text-sm font-extrabold tracking-wide uppercase text-amber-300">
                            {timeLeft || "Loading deadline..."}
                        </span>
                    </div>
                )
            )}

            {/* Error & Success Messages */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-sm font-semibold">
                    {error}
                </div>
            )}

            {isSaved && !isLocked && !isEditing && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="font-bold text-emerald-400">Predictions Saved</h3>
                            <p className="text-sm text-slate-400">You can edit your picks until the deadline — they lock automatically at kickoff.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-standard hover:-translate-y-0.5 shrink-0 cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" /> Edit Prediction
                    </button>
                </div>
            )}

            {/* Confidence remaining panel */}
            {isEditable && (
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Multipliers Remaining:</span>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(c => {
                            const isUsed = usedConfidences.includes(c);
                            return (
                                <span 
                                    key={c} 
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                                        isUsed 
                                            ? "bg-slate-800/40 text-slate-600 border-slate-900 line-through" 
                                            : c === 1 ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                                            : c === 2 ? "bg-amber-600/10 border-amber-500/30 text-amber-400"
                                            : "bg-red-600/10 border-red-500/30 text-red-400"
                                    }`}
                                >
                                    {getConfidenceLabel(c)}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Contests Grid */}
            <div className="space-y-8">
                {contests.map((contest, idx) => {
                    const prediction = predictions.find(p => p.matchId === contest.id);
                    const selectedWinnerId = prediction?.predictedWinnerId;
                    const selectedConfidence = prediction?.confidence;
                    const isFinished = contest.status === "finished";

                    return (
                        <div key={contest.id} className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                            
                            {/* Header info */}
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                                    Semi-Final {idx + 1}
                                </span>
                                {selectedConfidence && (
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                        selectedConfidence === 1 ? "bg-blue-500/10 border-blue-500/25 text-blue-400"
                                        : selectedConfidence === 2 ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                                        : "bg-red-500/10 border-red-500/25 text-red-400"
                                    }`}>
                                        Confidence: {getConfidenceLabel(selectedConfidence)}
                                    </span>
                                )}
                            </div>

                            <p className="text-slate-300 text-sm font-bold mb-4">Who will win?</p>

                            {/* Schools Selection */}
                            <div className="flex flex-col gap-2.5">
                                {contest.schools.map((school) => {
                                    const isSelected = selectedWinnerId === school.id;
                                    const isActualWinner = isFinished && contest.actualWinnerId === school.id;

                                    return (
                                        <button
                                            key={school.id}
                                            disabled={!isEditable}
                                            onClick={() => handleSelectWinner(contest.id, school.id)}
                                            className={`w-full text-left p-4 rounded-xl flex items-center justify-between border transition-standard hover:-translate-y-0.5 ${
                                                isSelected 
                                                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-black' 
                                                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-amber-400' : 'border-slate-600'}`}>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                                                </div>
                                                <span>{school.name}</span>
                                            </div>

                                            {isFinished && isActualWinner && (
                                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                                    Winner
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Confidence Selectors */}
                            {selectedWinnerId && (
                                <div className="mt-5 pt-5 border-t border-slate-800/80">
                                    <p className="text-slate-300 text-xs font-bold mb-3">How confident are you?</p>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map(c => {
                                            const isCurrent = selectedConfidence === c;
                                            const isUsedElsewhere = usedConfidences.includes(c) && !isCurrent;
                                            const disabled = !isEditable || isUsedElsewhere;

                                            return (
                                                <button
                                                    key={c}
                                                    disabled={disabled}
                                                    onClick={() => handleSelectConfidence(contest.id, c)}
                                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                                        isCurrent
                                                            ? c === 1 ? 'bg-blue-600 border-blue-500 text-white'
                                                              : c === 2 ? 'bg-amber-500 border-amber-400 text-slate-950'
                                                              : 'bg-red-500 border-red-400 text-white'
                                                            : isUsedElsewhere
                                                                ? 'bg-slate-800/20 border-slate-900 text-slate-600 cursor-not-allowed opacity-30'
                                                                : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                                >
                                                    {getConfidenceLabel(c)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>

            {/* Review Panel */}
            {predictions.some(p => p.predictedWinnerId) && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-lg">
                    <h3 className="text-lg font-black uppercase text-amber-400 tracking-wider mb-4 font-russo">
                        Review Your Semi-Final Predictions
                    </h3>
                    <div className="divide-y divide-slate-800/80 mb-6">
                        {contests.map((contest, idx) => {
                            const pred = predictions.find(p => p.matchId === contest.id);
                            const winner = contest.schools.find(s => s.id === pred?.predictedWinnerId);
                            const conf = pred?.confidence;

                            return (
                                <div key={contest.id} className="py-3 flex items-center justify-between text-sm">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SF {idx + 1}</span>
                                        <span className="font-bold text-slate-200">{winner ? winner.name : "Not selected"}</span>
                                    </div>
                                    <span className="text-slate-300 font-extrabold">
                                        {conf ? getConfidenceLabel(conf) : <span className="text-slate-500 font-normal italic">No confidence selected</span>}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-widest font-black mb-6">
                        <span>Max possible score:</span>
                        <span className="text-emerald-400 font-extrabold text-sm">120 points</span>
                    </div>

                    {isEditable && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !predictions.every(p => p.predictedWinnerId && p.confidence !== null)}
                            className={`w-full py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-standard hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                                predictions.every(p => p.predictedWinnerId && p.confidence !== null)
                                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-600/20 hover:bg-amber-400'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-900'
                            }`}
                        >
                            {isSaving ? (
                                'Saving predictions...'
                            ) : success ? (
                                <><CheckCircle2 className="w-5 h-5" /> Saved!</>
                            ) : (
                                <><CheckCircle2 className="w-4 h-4" /> SAVE MY PREDICTIONS</>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* How to Play Modal */}
            <Dialog
                open={showHowTo}
                onOpenChange={(open) => {
                    setShowHowTo(open)
                    if (!open) {
                        try { sessionStorage.setItem("sf-howto-seen", "1") } catch {}
                    }
                }}
            >
                <DialogContent className="max-w-md rounded-2xl border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="font-russo uppercase tracking-wider text-amber-400 text-base">
                            How to Play
                        </DialogTitle>
                        <DialogDescription className="text-xs uppercase tracking-widest font-bold text-slate-500">
                            Semi-Final Confidence Challenge
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 text-sm text-slate-300">
                        <div>
                            <span className="font-bold text-white">Predict the winner of every Semi-Final contest.</span>{" "}
                            There are <span className="font-bold text-white">3 contests</span>, pick one winner in each.
                        </div>
                        <div>
                            <span className="font-bold text-white flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Confidence Multipliers</span>
                            Assign your <span className="font-bold text-white">1x, 2x, and 3x</span> multipliers
                            exactly once across the 3 contests. A correct pick scores{" "}
                            <span className="font-bold text-emerald-400">20 × multiplier</span>.
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg py-2 text-xs">
                                <span className="font-black text-blue-400">1x</span>
                                <div className="text-slate-400 font-bold">+20 pts</div>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg py-2 text-xs">
                                <span className="font-black text-amber-400">2x</span>
                                <div className="text-slate-400 font-bold">+40 pts</div>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/25 rounded-lg py-2 text-xs">
                                <span className="font-black text-red-400">3x</span>
                                <div className="text-slate-400 font-bold">+60 pts</div>
                            </div>
                        </div>
                        <div>
                            Wrong picks score <span className="font-bold text-red-400">0 pts</span> — so put your{" "}
                            <span className="font-bold text-white">highest multiplier on the contest you are most sure about</span>.
                        </div>
                        <div className="pt-2 border-t border-slate-800">
                            Maximum score: <span className="font-bold text-amber-400">120 points</span>.
                        </div>
                        <div>
                            {deadlineFormatted ? (
                                <>
                                    Deadline is <span className="font-bold text-white">{deadlineFormatted}</span>{" "}
                                    (before the first contest).
                                </>
                            ) : (
                                <>
                                    Deadline is <span className="font-bold text-white">before the first contest</span>.
                                </>
                            )}{" "}
                            You can edit your picks anytime until the deadline — they lock automatically at kickoff.
                        </div>
                    </div>

                    <button
                        onClick={() => setShowHowTo(false)}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wider text-sm transition-standard hover:-translate-y-0.5 cursor-pointer"
                    >
                        Got it
                    </button>
                </DialogContent>
            </Dialog>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { saveGrandFinalPrediction } from "@/lib/fantasy-actions"
import { Trophy, Award, Target, Star, Flame, Clock, Lock, CheckCircle2, ChevronRight, RefreshCw, Pencil } from "lucide-react"

type School = {
    id: string
    name: string
    actualScore?: number | null
}

const MARGIN_RANGES = [
    { value: "1-5", label: "1 to 5 points" },
    { value: "6-10", label: "6 to 10 points" },
    { value: "11-20", label: "11 to 20 points" },
    { value: "21-30", label: "21 to 30 points" },
    { value: "31+", label: "31+ points" }
];

export default function GrandFinalClient({
    schools,
    initialPrediction,
    isLocked,
    deadline,
    matchResult
}: {
    schools: School[]
    initialPrediction: any
    isLocked: boolean
    deadline: string | null
    matchResult: any
}) {
    const [championId, setChampionId] = useState<string>(initialPrediction?.championSchoolId || "")
    const [runnerUpId, setRunnerUpId] = useState<string>(initialPrediction?.runnerUpSchoolId || "")
    const [marginRange, setMarginRange] = useState<string>(initialPrediction?.marginRange || "")
    const [finalBoost, setFinalBoost] = useState<string>(initialPrediction?.finalBoost || "")

    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [timeLeft, setTimeLeft] = useState("")

    const isSaved = Boolean(initialPrediction?.id)
    const [isEditing, setIsEditing] = useState(() => !isSaved)
    const isEditable = !isLocked && isEditing

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

            setTimeLeft(`Final predictions close in ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [deadline, isLocked]);

    const handleSelectChampion = (id: string) => {
        if (!isEditable) return;
        setChampionId(id);
        if (runnerUpId === id) setRunnerUpId("");
        setError(null);
    }

    const handleSelectRunnerUp = (id: string) => {
        if (!isEditable) return;
        if (id === championId) return;
        setRunnerUpId(id);
        setError(null);
    }

    const handleSave = async () => {
        if (!isEditable) return;

        if (!championId || !runnerUpId || !marginRange || !finalBoost) {
            setError("Please fill out all predictions and select a Final Boost.");
            return;
        }

        setIsSaving(true)
        setError(null)
        setSuccess(false)

        const res = await saveGrandFinalPrediction(championId, runnerUpId, marginRange, finalBoost)
        setIsSaving(false)

        if (res.success) {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
            window.location.reload();
        } else {
            setError(res.error || "Failed to save predictions.");
        }
    }

    const isAllPredicted = championId && runnerUpId && marginRange && finalBoost;
    const isFinished = matchResult?.winner && matchResult?.runnerUp;

    return (
        <div className="space-y-8 text-white">
            {isLocked ? (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-bold text-slate-200">Predictions Locked</h3>
                        <p className="text-sm text-slate-400">The Grand Final has commenced. Your predictions are immutable.</p>
                    </div>
                </div>
            ) : (
                deadline && (
                    <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-extrabold tracking-wide uppercase text-amber-400">
                            {timeLeft || "Loading deadline..."}
                        </span>
                    </div>
                )
            )}

            {/* Error Message */}
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

            {/* Step 1 — Choose Your Champion */}
            <div className="space-y-4">
                <h2 className="text-lg font-black uppercase text-amber-400 tracking-wider flex items-center gap-2 font-russo">
                    <Trophy className="w-5 h-5 text-amber-400" /> Step 1: Choose Your Champion (+100 pts)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {schools.map(s => {
                        const isSelected = championId === s.id;
                        return (
                            <button
                                key={s.id}
                                disabled={!isEditable}
                                onClick={() => handleSelectChampion(s.id)}
                                className={`p-6 rounded-2xl border text-center transition-standard flex flex-col items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 ${
                                    isSelected 
                                        ? "bg-amber-500/15 border-amber-500 text-amber-300 font-black" 
                                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                }`}
                            >
                                <Trophy className={`w-8 h-8 ${isSelected ? 'text-amber-500 fill-amber-500' : 'text-slate-700'}`} />
                                <span className="text-sm font-bold leading-tight">{s.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Step 2 — Choose Your Runner-Up */}
            <div className="space-y-4">
                <h2 className="text-lg font-black uppercase text-amber-400 tracking-wider flex items-center gap-2 font-russo">
                    <Award className="w-5 h-5 text-amber-400" /> Step 2: Choose Your Runner-Up (+50 pts)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {schools.map(s => {
                        const isSelected = runnerUpId === s.id;
                        const isChamp = championId === s.id;
                        return (
                            <button
                                key={s.id}
                                disabled={!isEditable || isChamp}
                                onClick={() => handleSelectRunnerUp(s.id)}
                                className={`p-6 rounded-2xl border text-center transition-standard flex flex-col items-center justify-center gap-2 hover:-translate-y-0.5 ${
                                    isChamp 
                                        ? "bg-slate-900/10 border-slate-950 text-slate-700 opacity-20 cursor-not-allowed" 
                                        : isSelected
                                            ? "bg-slate-500/15 border-slate-300 text-slate-100 font-black cursor-pointer"
                                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
                                }`}
                            >
                                <Award className={`w-8 h-8 ${isSelected ? 'text-slate-200 fill-slate-200' : 'text-slate-700'}`} />
                                <span className="text-sm font-bold leading-tight">{s.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Step 3 — Predict the Winning Margin */}
            <div className="space-y-4">
                <h2 className="text-lg font-black uppercase text-amber-400 tracking-wider flex items-center gap-2 font-russo">
                    <Target className="w-5 h-5 text-amber-400" /> Step 3: Predict the Winning Margin (+40 pts)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {MARGIN_RANGES.map(range => {
                        const isSelected = marginRange === range.value;
                        return (
                            <button
                                key={range.value}
                                disabled={!isEditable}
                                onClick={() => setMarginRange(range.value)}
                                className={`p-4 rounded-xl border text-center transition-standard flex flex-col items-center justify-center gap-1 cursor-pointer hover:-translate-y-0.5 ${
                                    isSelected
                                        ? "bg-blue-600/15 border-blue-500 text-blue-300 font-black"
                                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                }`}
                            >
                                <span className="text-xs font-bold">{range.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Step 4 — Activate Your Final Boost */}
            <div className="space-y-4">
                <h2 className="text-lg font-black uppercase text-amber-400 tracking-wider flex items-center gap-2 font-russo">
                    <Flame className="w-5 h-5 text-amber-400" /> Step 4: Activate Your Final Boost (2x points)
                </h2>
                <p className="text-xs text-slate-400">Which prediction are you most confident about? Boost its score to 2x!</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { value: "champion", label: "Champion Prediction", desc: "100 pts x2" },
                        { value: "runner_up", label: "Runner-Up Prediction", desc: "50 pts x2" },
                        { value: "margin", label: "Margin Prediction", desc: "40 pts x2" }
                    ].map(boost => {
                        const isSelected = finalBoost === boost.value;
                        return (
                            <button
                                key={boost.value}
                                disabled={!isEditable}
                                onClick={() => setFinalBoost(boost.value)}
                                className={`p-5 rounded-2xl border text-left transition-standard flex flex-col justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5 ${
                                    isSelected
                                        ? "bg-red-500/15 border-red-500 text-red-300 font-black"
                                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Star className={`w-4 h-4 ${isSelected ? 'text-red-500 fill-red-500' : 'text-slate-600'}`} />
                                    <span className="text-sm font-bold">{boost.label}</span>
                                </div>
                                <span className="text-xs text-slate-400">{boost.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Review Panel */}
            {isAllPredicted && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-6">
                    <h3 className="text-lg font-black uppercase text-amber-400 tracking-wider font-russo flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" /> Review Your Final Predictions
                    </h3>

                    <div className="divide-y divide-slate-800/80">
                        <div className="py-3.5 flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-medium">Champion:</span>
                            <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                                {schools.find(s => s.id === championId)?.name}
                                {finalBoost === "champion" && <span className="text-[10px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded">BOOSTED</span>}
                            </span>
                        </div>
                        <div className="py-3.5 flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-medium">Runner-Up:</span>
                            <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                                {schools.find(s => s.id === runnerUpId)?.name}
                                {finalBoost === "runner_up" && <span className="text-[10px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded">BOOSTED</span>}
                            </span>
                        </div>
                        <div className="py-3.5 flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-medium">Margin:</span>
                            <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                                {MARGIN_RANGES.find(m => m.value === marginRange)?.label}
                                {finalBoost === "margin" && <span className="text-[10px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded">BOOSTED</span>}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-widest font-black pt-4 border-t border-slate-800/60">
                        <span>Max possible score (with Boost & Perfect Bonus):</span>
                        <span className="text-emerald-400 font-black text-base">390 points</span>
                    </div>

                    {isEditable && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition-standard hover:-translate-y-0.5 cursor-pointer"
                        >
                            {isSaving ? (
                                'Saving final predictions...'
                            ) : success ? (
                                <><CheckCircle2 className="w-5 h-5" /> Saved!</>
                            ) : (
                                <><CheckCircle2 className="w-4 h-4" /> SAVE MY FINAL PREDICTIONS</>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

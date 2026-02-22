import React, { useState, useMemo, useEffect } from "react"
import { X, Trophy, Loader2, Brain, Zap, Target, HelpCircle, Sparkles, Plus, Minus, AlertTriangle, Clock } from "lucide-react"
import { updateMatchResult } from "@/lib/admin-actions"
import { validateScores } from "@/lib/match-utils"

interface MatchResultModalProps {
    match: {
        id: string
        sportType: string
        participants: Array<{
            schoolId: string
            name: string
        }>
        autoEndAt?: Date | string | null
    }
    onClose: () => void
    onSuccess: () => void
}

export function MatchResultModal({ match, onClose, onSuccess }: MatchResultModalProps) {
    const isQuiz = match.sportType === "quiz"
    const isFootball = match.sportType === "football" || match.sportType === "handball"
    const isBasketball = match.sportType === "basketball"
    const isVolleyball = match.sportType === "volleyball"
    const isAthletics = match.sportType === "athletics"

    const [scores, setScores] = useState<{ [key: string]: number }>({})
    const [winner, setWinner] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [validationWarnings, setValidationWarnings] = useState<string[]>([])
    const [autoEndAt, setAutoEndAt] = useState<string>(() => {
        if (!match.autoEndAt) return ""
        const date = new Date(match.autoEndAt)
        return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16)
    })

    // Quiz Data
    const [quizData, setQuizData] = useState<{
        [schoolId: string]: { r1: number, r2: number, r3: number, r4: number, r5: number }
    }>(() => {
        const initial: any = {}
        match.participants.forEach(p => { initial[p.schoolId] = { r1: NaN, r2: NaN, r3: NaN, r4: NaN, r5: NaN } })
        return initial
    })

    // Football Data
    const [footballData, setFootballData] = useState<{
        [schoolId: string]: { ht: number, ft: number }
    }>(() => {
        const initial: any = {}
        match.participants.forEach(p => { initial[p.schoolId] = { ht: NaN, ft: NaN } })
        return initial
    })

    // Basketball Data
    const [basketballData, setBasketballData] = useState<{
        [schoolId: string]: { q1: number, q2: number, q3: number, q4: number }
    }>(() => {
        const initial: any = {}
        match.participants.forEach(p => { initial[p.schoolId] = { q1: NaN, q2: NaN, q3: NaN, q4: NaN } })
        return initial
    })

    // Volleyball Data
    const [volleyballData, setVolleyballData] = useState<{
        [schoolId: string]: { s1: number, s2: number, s3: number, setWins: number }
    }>(() => {
        const initial: any = {}
        match.participants.forEach(p => { initial[p.schoolId] = { s1: NaN, s2: NaN, s3: NaN, setWins: NaN } })
        return initial
    })

    // Athletics Data (Rankings)
    const [athleticsData, setAthleticsData] = useState<{ [schoolId: string]: number }>({})

    // --- AUTO CALCULATIONS ---

    const [isLiveUpdate, setIsLiveUpdate] = useState(false)
    const [timerData, setTimerData] = useState({ minute: 0, period: "1H" })

    // ... (rest of state)

    // --- AUTO CALCULATIONS ---
    // (Existing calculations remain same) 
    const quizTotals = useMemo(() => {
        const totals: { [key: string]: number } = {}
        match.participants.forEach(p => {
            const d = quizData[p.schoolId]
            totals[p.schoolId] = d.r1 + d.r2 + d.r3 + d.r4 + d.r5
        })
        return totals
    }, [quizData, match.participants])

    const footballTotals = useMemo(() => {
        const totals: { [key: string]: number } = {}
        match.participants.forEach(p => { totals[p.schoolId] = footballData[p.schoolId].ft })
        return totals
    }, [footballData, match.participants])

    const basketballTotals = useMemo(() => {
        const totals: { [key: string]: number } = {}
        match.participants.forEach(p => {
            const d = basketballData[p.schoolId]
            totals[p.schoolId] = d.q1 + d.q2 + d.q3 + d.q4
        })
        return totals
    }, [basketballData, match.participants])

    const volleyballTotals = useMemo(() => {
        // First determine set wins
        const p1 = match.participants[0].schoolId
        const p2 = match.participants[1].schoolId
        const d1 = volleyballData[p1]
        const d2 = volleyballData[p2]

        let w1 = 0, w2 = 0
        if (d1.s1 > d2.s1 && (d1.s1 > 0 || d2.s1 > 0)) w1++
        else if (d2.s1 > d1.s1 && (d1.s1 > 0 || d2.s1 > 0)) w2++

        if (d1.s2 > d2.s2 && (d1.s2 > 0 || d2.s2 > 0)) w1++
        else if (d2.s2 > d1.s2 && (d1.s2 > 0 || d2.s2 > 0)) w2++

        if (d1.s3 > d2.s3 && (d1.s3 > 0 || d2.s3 > 0)) w1++
        else if (d2.s3 > d1.s3 && (d1.s3 > 0 || d2.s3 > 0)) w2++

        return { [p1]: w1, [p2]: w2 }
    }, [volleyballData, match.participants])

    // --- AUTO WINNER SELECTION (Only for Full Settlement) ---
    useEffect(() => {
        if (isLiveUpdate) return; // Don't auto-set winner in live mode

        if (isQuiz) {
            const totals = Object.entries(quizTotals)
            const sorted = totals.sort((a, b) => b[1] - a[1])
            if (sorted[0][1] > sorted[1]?.[1]) setWinner(sorted[0][0])
            else setWinner("")
        } else if (isFootball) {
            const p1 = match.participants[0].schoolId
            const p2 = match.participants[1].schoolId
            const s1 = footballData[p1].ft
            const s2 = footballData[p2].ft
            if (s1 > s2) setWinner(p1)
            else if (s2 > s1) setWinner(p2)
            else setWinner("X") // Draw
        } else if (isBasketball) {
            const totals = Object.entries(basketballTotals)
            const sorted = totals.sort((a, b) => b[1] - a[1])
            if (sorted[0][1] > sorted[1]?.[1]) setWinner(sorted[0][0])
            else setWinner("")
        } else if (isVolleyball) {
            const totals = Object.entries(volleyballTotals)
            const sorted = totals.sort((a, b) => b[1] - a[1])
            if (sorted[0][1] >= 2) setWinner(sorted[0][0])
            else setWinner("")
        } else if (isAthletics) {
            const rank1 = Object.entries(athleticsData).find(([_, rank]) => rank === 1)
            if (rank1) setWinner(rank1[0])
        }
    }, [quizTotals, footballData, basketballTotals, volleyballTotals, athleticsData, isQuiz, isFootball, isBasketball, isVolleyball, isAthletics, match.participants, isLiveUpdate])

    // --- REAL-TIME VALIDATION ---
    useEffect(() => {
        if (isLiveUpdate) return; // Skip validation for live updates

        const metadata: any = {
            ...(match.sportType === 'football' ? { footballDetails: footballData } : {}),
            ...(match.sportType === 'basketball' ? { basketballDetails: basketballData } : {}),
            ...(match.sportType === 'volleyball' ? { volleyballDetails: volleyballData } : {}),
            ...(match.sportType === 'quiz' ? { quizDetails: quizData } : {}),
        }

        const validation = validateScores(match.sportType, {}, metadata)
        setValidationWarnings(validation.warnings)
    }, [footballData, basketballData, volleyballData, quizData, match.sportType, isLiveUpdate])

    // --- QUICK ACTION HELPERS ---
    const setHalfTime = () => {
        if (!isFootball) return
        setTimerData({ minute: 45, period: "HT" })
    }

    const setFullTime = () => {
        if (!isFootball) return
        setTimerData({ minute: 90, period: "2H" })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // Validation only for Final Settlement
        if (!isLiveUpdate && !winner) { setError("Please select or confirm a winner"); return }

        setLoading(true)

        try {
            let finalScores = scores
            const metadata: any = {
                ...(match.sportType === 'football' ? { footballDetails: footballData } : {}),
                ...(match.sportType === 'basketball' ? { basketballDetails: basketballData } : {}),
                ...(match.sportType === 'volleyball' ? { volleyballDetails: volleyballData } : {}),
                ...(match.sportType === 'quiz' ? { quizDetails: quizData } : {}),
                ...(match.sportType === 'athletics' ? { athleticsDetails: athleticsData } : {}),
            }

            if (isQuiz) { finalScores = quizTotals; }
            if (isFootball) { finalScores = footballTotals; }
            if (isBasketball) { finalScores = basketballTotals; }
            if (isVolleyball) { finalScores = volleyballTotals; }
            if (isAthletics) {
                finalScores = athleticsData;
                // Construct podium metadata: [1st Name, 2nd Name, 3rd Name]
                const sortedByRank = Object.entries(athleticsData)
                    .filter(([_, rank]) => rank > 0)
                    .sort((a, b) => a[1] - b[1]);

                metadata.podium = sortedByRank.slice(0, 3).map(([schoolId]) => {
                    return match.participants.find(p => p.schoolId === schoolId)?.name || "";
                });
            }

            // Add Time Metadata for Live Updates
            if (isLiveUpdate && !isQuiz) {
                metadata.currentMinute = timerData.minute
                metadata.period = timerData.period
                metadata.lastUpdated = new Date().toISOString()
            }

            const result = await updateMatchResult(match.id, {
                scores: finalScores,
                winner: isLiveUpdate ? "" : winner,
                status: isLiveUpdate ? "live" : "finished",
                autoEndAt: autoEndAt || null,
                metadata
            } as any)

            if (result.success) { onSuccess(); onClose() }
            else setError(result.error || "Failed to save result")
        } catch { setError("An error occurred") }
        finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className={`bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden w-full ${isQuiz || isBasketball || isVolleyball ? 'max-w-4xl' : 'max-w-md'}`}>
                {/* Header with Toggle */}
                <div className="p-8 border-b border-white/5 flex flex-col gap-4 bg-gradient-to-r from-purple-600/10 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 text-primary">
                                {isQuiz ? <Brain /> : isFootball ? <Trophy /> : isBasketball ? <Zap /> : isVolleyball ? <Target /> : isAthletics ? <Sparkles /> : <Trophy />}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                    {isLiveUpdate ? "LIVE UPDATE" : "SETTLE MATCH"}
                                </h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                    {isLiveUpdate ? "Update scores & time without finishing" : "Finalize results & pay out bets"}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X className="h-5 w-5" /></button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 self-start">
                        <button
                            type="button"
                            onClick={() => setIsLiveUpdate(true)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isLiveUpdate ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            Live Update
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLiveUpdate(false)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isLiveUpdate ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            Final Settle
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black uppercase text-center">{error}</div>}

                    {/* Validation Warnings */}
                    {validationWarnings.length > 0 && !isLiveUpdate && (
                        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Validation Warnings</span>
                            </div>
                            {validationWarnings.map((warning, idx) => (
                                <div key={idx} className="text-[10px] text-amber-400 font-bold">• {warning}</div>
                            ))}
                        </div>
                    )}

                    {/* Quick Actions (Live Mode Only) */}
                    {isLiveUpdate && isFootball && (
                        <div className="mb-6 flex gap-2">
                            <button
                                type="button"
                                onClick={setHalfTime}
                                className="flex-1 h-10 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <Clock className="h-3 w-3" />
                                Set Half Time
                            </button>
                            <button
                                type="button"
                                onClick={setFullTime}
                                className="flex-1 h-10 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <Clock className="h-3 w-3" />
                                Set Full Time
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* TIMER INPUT (Live Mode Only, Non-Quiz) */}
                        {isLiveUpdate && !isQuiz && (
                            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">Match Timer</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Period</label>
                                        <select
                                            value={timerData.period}
                                            onChange={(e) => setTimerData({ ...timerData, period: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl h-10 px-3 text-white text-xs font-bold focus:outline-none focus:border-red-500/50"
                                        >
                                            <option value="1H">1st Half</option>
                                            <option value="HT">Half Time</option>
                                            <option value="2H">2nd Half</option>
                                            <option value="ET">Extra Time</option>
                                            <option value="P">Penalties</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Minute</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={timerData.minute}
                                                onChange={(e) => setTimerData({ ...timerData, minute: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl h-10 pl-3 pr-8 text-white text-xs font-bold focus:outline-none focus:border-red-500/50"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">&apos;</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-red-500/10">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Auto End Match At (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={autoEndAt}
                                        onChange={(e) => setAutoEndAt(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl h-10 px-3 text-white text-xs font-bold focus:outline-none focus:border-red-500/50 border-dashed"
                                    />
                                    <p className="text-[8px] text-slate-600 mt-1 uppercase tracking-tight">Setting this will automatically move the match to pending at the specified time.</p>
                                </div>
                            </div>
                        )}

                        {/* 1. SPORT SPECIFIC INPUTS */}
                        {isQuiz && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {match.participants.map(p => (
                                    <div key={p.schoolId} className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                                        <div className="text-sm font-black text-white truncate uppercase border-b border-white/5 pb-2">{p.name}</div>
                                        {['r1', 'r2', 'r3', 'r4', 'r5'].map(r => (
                                            <div key={r} className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500">
                                                <span>{r === 'r1' ? 'General' : r === 'r2' ? 'Speed' : r === 'r3' ? 'Problem' : r === 'r4' ? 'T/F' : 'Riddles'}</span>
                                                <input type="number" className="w-14 h-8 bg-black/40 border border-white/5 rounded-lg text-center text-white font-black" value={isNaN(quizData[p.schoolId][r as keyof typeof quizData[string]]) ? '' : quizData[p.schoolId][r as keyof typeof quizData[string]]} onChange={e => setQuizData({ ...quizData, [p.schoolId]: { ...quizData[p.schoolId], [r]: parseInt(e.target.value) || 0 } })} placeholder="0" />
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-white/5 flex justify-between font-black"><span className="text-primary">Total</span><span className="text-xl">{quizTotals[p.schoolId]}</span></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isFootball && (
                            <div className="space-y-6">
                                {match.participants.map(p => (
                                    <div key={p.schoolId} className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                        <h3 className="text-sm font-black text-white uppercase mb-4">{p.name}</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Half Time (HT)</label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ht: Math.max(0, (footballData[p.schoolId].ht || 0) - 1) } })}
                                                        className="h-12 w-12 bg-black/40 border border-white/10 rounded-xl text-white hover:bg-white/5 flex items-center justify-center"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <input type="number" min="0" className="flex-1 h-12 bg-black/40 border border-white/10 rounded-xl text-center text-white font-black" value={isNaN(footballData[p.schoolId].ht) ? '' : footballData[p.schoolId].ht} onChange={e => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ht: parseInt(e.target.value) || 0 } })} placeholder="0" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ht: (footballData[p.schoolId].ht || 0) + 1 } })}
                                                        className="h-12 w-12 bg-black/40 border border-white/10 rounded-xl text-white hover:bg-white/5 flex items-center justify-center"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Full Time (FT)</label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ft: Math.max(0, (footballData[p.schoolId].ft || 0) - 1) } })}
                                                        className="h-12 w-12 bg-black/40 border border-white/10 rounded-xl text-white hover:bg-white/5 flex items-center justify-center"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <input type="number" min="0" className="flex-1 h-12 bg-black/40 border border-white/10 rounded-xl text-center text-white font-black" value={isNaN(footballData[p.schoolId].ft) ? '' : footballData[p.schoolId].ft} onChange={e => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ft: parseInt(e.target.value) || 0 } })} placeholder="0" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ft: (footballData[p.schoolId].ft || 0) + 1 } })}
                                                        className="h-12 w-12 bg-black/40 border border-white/10 rounded-xl text-white hover:bg-white/5 flex items-center justify-center"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isBasketball && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {match.participants.map(p => (
                                    <div key={p.schoolId} className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                                        <div className="text-sm font-black text-white uppercase border-b border-white/5 pb-2">{p.name}</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['q1', 'q2', 'q3', 'q4'].map(q => (
                                                <div key={q} className="text-center">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase">{q}</span>
                                                    <input type="number" className="w-full h-10 bg-black/40 border border-white/5 rounded-lg text-center text-white font-black" value={isNaN(basketballData[p.schoolId][q as keyof typeof basketballData[string]]) ? '' : basketballData[p.schoolId][q as keyof typeof basketballData[string]]} onChange={e => setBasketballData({ ...basketballData, [p.schoolId]: { ...basketballData[p.schoolId], [q]: parseInt(e.target.value) || 0 } })} placeholder="0" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-2 border-t border-white/5 flex justify-between font-black"><span className="text-primary uppercase tracking-widest text-[10px]">Total Score</span><span className="text-2xl">{basketballTotals[p.schoolId]}</span></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isVolleyball && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {match.participants.map(p => (
                                    <div key={p.schoolId} className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                                        <div className="text-sm font-black text-white uppercase border-b border-white/5 pb-2">{p.name}</div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['s1', 's2', 's3'].map(s => (
                                                <div key={s} className="text-center">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase">Set {s[1]}</span>
                                                    <input type="number" className="w-full h-10 bg-black/40 border border-white/5 rounded-lg text-center text-white font-black" value={isNaN(volleyballData[p.schoolId][s as keyof typeof volleyballData[string]]) ? '' : volleyballData[p.schoolId][s as keyof typeof volleyballData[string]]} onChange={e => setVolleyballData({ ...volleyballData, [p.schoolId]: { ...volleyballData[p.schoolId], [s]: parseInt(e.target.value) || 0 } })} placeholder="0" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-2 border-t border-white/5 flex justify-between font-black"><span className="text-primary uppercase text-[10px]">Sets Won</span><span className="text-2xl">{volleyballTotals[p.schoolId]}</span></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isAthletics && (
                            <div className="space-y-4">
                                {match.participants.map(p => (
                                    <div key={p.schoolId} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <span className="text-sm font-black text-white uppercase">{p.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Rank</span>
                                            <input type="number" min="1" max={match.participants.length} className="w-16 h-10 bg-black/40 border border-white/10 rounded-xl text-center text-white font-black" value={athleticsData[p.schoolId] || ""} onChange={e => setAthleticsData({ ...athleticsData, [p.schoolId]: parseInt(e.target.value) || 0 })} placeholder="1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 2. WINNER OVERRIDE / SELECTION (HIDDEN IN LIVE MODE) */}
                        {!isLiveUpdate && (
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Decision Point (Select Winner)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {match.participants.map(p => (
                                        <button key={p.schoolId} type="button" onClick={() => setWinner(p.schoolId)} className={`p-5 rounded-3xl border flex items-center gap-4 transition-all ${winner === p.schoolId ? "bg-primary text-slate-950 border-primary" : "bg-white/5 border-white/5 text-slate-400"}`}>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${winner === p.schoolId ? 'border-black/20' : 'border-slate-800'}`}>{winner === p.schoolId && <div className="w-2 h-2 bg-slate-950 rounded-full" />}</div>
                                            <span className="text-[10px] font-black uppercase truncate">{p.name}</span>
                                        </button>
                                    ))}
                                    {isFootball && (
                                        <button type="button" onClick={() => setWinner("X")} className={`p-5 rounded-3xl border flex items-center gap-4 transition-all ${winner === "X" ? "bg-primary text-slate-950 border-primary" : "bg-white/5 border-white/5 text-slate-400"}`}>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${winner === "X" ? 'border-black/20' : 'border-slate-800'}`}>{winner === "X" && <div className="w-2 h-2 bg-slate-950 rounded-full" />}</div>
                                            <span className="text-[10px] font-black uppercase truncate">Draw (X)</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. ACTIONS */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                            <button type="button" onClick={onClose} className="h-16 px-8 rounded-3xl bg-white/5 border border-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/10">Abort</button>

                            {!isLiveUpdate && (
                                <>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to VOID this match? All bets will be refunded.")) return;
                                            setLoading(true);
                                            await updateMatchResult(match.id, {
                                                scores: {},
                                                winner: 'void',
                                                status: 'cancelled',
                                                metadata: { voided: true }
                                            });
                                            setLoading(false);
                                            onSuccess();
                                            onClose();
                                        }}
                                        className="h-16 px-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/20"
                                    >
                                        Void Match
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!confirm("End match as PENDING? Match will show 'Full Time - Awaiting Result' until you enter final scores.")) return;
                                            setLoading(true);
                                            await updateMatchResult(match.id, {
                                                scores: {},
                                                winner: '',
                                                status: 'pending',
                                                metadata: { pendingSince: new Date().toISOString() }
                                            });
                                            setLoading(false);
                                            onSuccess();
                                            onClose();
                                        }}
                                        className="h-16 px-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black uppercase tracking-widest text-[10px] hover:bg-amber-500/20"
                                    >
                                        End (Pending)
                                    </button>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 h-16 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] shadow-xl disabled:opacity-50 ${isLiveUpdate ? "bg-red-600 text-white shadow-red-900/20" : "bg-primary text-slate-950 shadow-primary/20"}`}
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isLiveUpdate ? "Update Live Score" : "Authorize Settlement"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

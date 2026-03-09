import React, { useState, useMemo, useEffect } from "react"
import { X, Trophy, Loader2, Brain, Zap, Target, HelpCircle, Sparkles, Plus, Minus, AlertTriangle, Clock } from "lucide-react"
import { updateMatchResult, getActiveMarketsAction, getSettlementPreview } from "@/lib/admin-actions"
import { CheckCircle, AlertCircle } from "lucide-react"
import { validateScores } from "@/lib/match-utils"
import { cn } from "@/lib/utils"

interface MatchResultModalProps {
    match: {
        id: string
        sportType: string
        participants: Array<{
            schoolId: string
            name: string
            odd?: number
        }>
        extendedOdds?: Record<string, Record<string, number | null>>
        metadata?: any
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
    const [timerData, setTimerData] = useState({
        minute: match.metadata?.currentMinute || 0,
        period: match.metadata?.period || "1H"
    })
    const [activeTab, setActiveTab] = useState<"scores" | "markets">("scores")
    const [manualOutcomes, setManualOutcomes] = useState<Record<string, string>>(() => {
        return match.metadata?.outcomes || {}
    })
    const [activeMarkets, setActiveMarkets] = useState<string[]>([])
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [firstScorerId, setFirstScorerId] = useState<string>(match.metadata?.firstScorerId || "")
    const [previewData, setPreviewData] = useState<any[]>([])
    const [showPreview, setShowPreview] = useState(false)

    // Fetch active markets on mount
    useEffect(() => {
        const fetchActive = async () => {
            const res = await getActiveMarketsAction(match.id)
            if (res.success) setActiveMarkets(res.activeMarkets || [])
        }
        fetchActive()
    }, [match.id])

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

    // Refresh preview when manual outcomes change while showing preview
    useEffect(() => {
        if (showPreview) {
            const refreshPreview = async () => {
                let finalScores = scores
                if (isQuiz) { finalScores = quizTotals; }
                if (isFootball) { finalScores = footballTotals; }
                if (isBasketball) { finalScores = basketballTotals; }
                if (isVolleyball) { finalScores = volleyballTotals; }
                if (isAthletics) { finalScores = athleticsData; }

                const res = await getSettlementPreview(match.id, {
                    scores: finalScores,
                    winner,
                    metadata: { outcomes: manualOutcomes }
                })
                if (res.success) {
                    setPreviewData(res.preview || [])
                }
            }
            refreshPreview()
        }
    }, [manualOutcomes, showPreview, match.id, winner, scores, footballTotals, quizTotals, basketballTotals, volleyballTotals, athleticsData, isQuiz, isFootball, isBasketball, isVolleyball, isAthletics])

    const handleToggleSelection = (marketName: string, label: string, currentStatus: string) => {
        const key = `${marketName}:${label}`.toLowerCase().trim()
        const nextStatus: Record<string, string> = {
            'pending': 'won',
            'won': 'lost',
            'lost': 'void',
            'void': 'pending' // back to auto
        }

        const newStatus = nextStatus[currentStatus] || 'won'

        setManualOutcomes(prev => {
            const next = { ...prev }
            if (newStatus === 'pending') {
                delete next[key]
            } else {
                next[key] = newStatus
            }
            return next
        })
    }

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

    // --- DERIVED OUTCOMES FOR CONFIRMATION ---
    const derivedOutcomes = useMemo(() => {
        if (isLiveUpdate) return [];
        const outcomes: { market: string, result: string, type: 'auto' | 'manual' }[] = [];

        // Winner (Standard)
        if (winner) {
            const winnerName = winner === 'X' ? 'Draw' : match.participants.find(p => p.schoolId === winner)?.name || winner;
            outcomes.push({ market: 'Match Winner', result: winnerName, type: 'auto' });
        }

        // Football Specific Derived Markets
        if (isFootball) {
            const p1 = match.participants[0]
            const p2 = match.participants[1]
            const h1 = footballData[p1.schoolId].ht
            const a1 = footballData[p2.schoolId].ht
            const h2 = footballData[p1.schoolId].ft
            const a2 = footballData[p2.schoolId].ft
            const total = h2 + a2

            // BTTS
            const btts = h2 > 0 && a2 > 0 ? "Yes" : "No"
            outcomes.push({ market: 'Both Teams to Score', result: btts, type: 'auto' })

            // Over/Under 2.5 (Common)
            outcomes.push({ market: 'Total Goals Over/Under 2.5', result: total > 2.5 ? "Over 2.5" : "Under 2.5", type: 'auto' })

            // HT/FT
            const htRes = h1 > a1 ? '1' : (a1 > h1 ? '2' : 'X')
            const ftRes = h2 > a2 ? '1' : (a2 > h2 ? '2' : 'X')
            outcomes.push({ market: 'HT/FT', result: `${htRes}/${ftRes}`, type: 'auto' })

            // First Scorer
            if (total > 0) {
                const firstScorerName = match.participants.find(p => p.schoolId === firstScorerId)?.name || "Not Selected"
                outcomes.push({ market: 'First Team to Score', result: firstScorerName, type: 'auto' })
            } else {
                outcomes.push({ market: 'First Team to Score', result: "No Goal", type: 'auto' })
            }

            // Winning Margin
            const diff = Math.abs(h2 - a2)
            if (diff === 0) outcomes.push({ market: 'Winning Margin', result: 'Draw', type: 'auto' })
            else outcomes.push({ market: 'Winning Margin', result: `${h2 > a2 ? p1.name : p2.name} by ${diff}`, type: 'auto' })
        }

        // Add manual ones
        Object.entries(manualOutcomes).forEach(([market, selection]) => {
            if (selection) {
                outcomes.push({ market, result: selection, type: 'manual' });
            }
        });

        return outcomes;
    }, [isLiveUpdate, winner, manualOutcomes, match.participants, isFootball, footballData, firstScorerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // Validation only for Final Settlement
        if (!isLiveUpdate && !winner) { setError("Please select or confirm a winner"); return }

        // Unresolved Markets Validation
        if (!isLiveUpdate) {
            const extendedMarkets = Object.keys(match.extendedOdds || {});

            // Whitelist of markets that the system handles through outcome-based logic
            const automatedMarkets = [
                "handicap", "spread", "hcap", "hc", "over/under", "total goals", "total points",
                "total point", "total", "tg", "tp", "gls", "ou",
                "both teams to score", "btts", "bts", "both score",
                "double chance", "dc", "double res", "draw no bet", "dnb", "draw no",
                "ht/ft", "half time / full time", "htft", "halftimefulltime",
                "winning margin", "margin", "first team to score", "first goal",
                "team to score first", "fg", "1st goal", "odd/even", "oddeven", "odd", "even",
                "winner", "first half", "1st half", "ht", "1h", "1sthalf", "1x2", "result", "moneyline"
            ];

            const unresolvedMarkets = extendedMarkets.filter(m => {
                const normalizedM = m.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

                // If it's manual resolved, it's not unresolved
                if (manualOutcomes[m] || manualOutcomes[m] === "void") return false;

                // If it matches an automated type, it's not unresolved
                if (automatedMarkets.some(type => {
                    const normalizedType = type.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
                    return normalizedM.includes(normalizedType);
                })) return false;

                // Special case for "Match Winner" matches
                if (normalizedM === "matchwinner") return false;

                return true;
            });

            if (unresolvedMarkets.length > 0) {
                setError(`Please resolve or void all custom markets. Unresolved: ${unresolvedMarkets.join(', ')}`);
                setActiveTab("markets"); // Switch them to the markets tab
                return;
            }
        }

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
        }

        // --- NEW PREVIEW LOGIC ---
        if (!isLiveUpdate && !showPreview) {
            setLoading(true)
            try {
                const res = await getSettlementPreview(match.id, {
                    scores: finalScores,
                    winner,
                    metadata: { ...metadata, outcomes: manualOutcomes }
                })
                if (res.success) {
                    setPreviewData(res.preview || [])
                    setShowPreview(true)
                } else {
                    setError(res.error || "Failed to generate preview")
                }
            } catch (err) {
                setError("Preview generation failed")
            } finally {
                setLoading(false)
            }
            return
        }

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

            if (isFootball) {
                metadata.firstScorerId = firstScorerId
            }

            const result = await updateMatchResult(match.id, {
                scores: finalScores,
                winner: isLiveUpdate ? "" : winner,
                status: isLiveUpdate ? "live" : "finished",
                autoEndAt: autoEndAt || null,
                metadata: {
                    ...metadata,
                    outcomes: manualOutcomes
                }
            } as any)

            if (result.success) { onSuccess(); onClose() }
            else setError(result.error || "Failed to save result")
        } catch { setError("An error occurred") }
        finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-[#050608]/90 backdrop-blur-xl flex justify-center items-start z-[100] p-4 overflow-y-auto custom-scrollbar-hide">
            {/* Animated background glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <div className={`relative bg-[#0f1115] rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden w-full transition-all duration-500 animate-in zoom-in-95 ${isQuiz || isBasketball || isVolleyball ? 'max-w-5xl' : 'max-w-2xl'}`}>
                {/* Visual Header Enhancement */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-purple-600/5 to-transparent pointer-events-none" />

                {/* Header Section */}
                <div className="relative p-6 sm:p-10 border-b border-white/5 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center border border-white/10 text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {isQuiz ? <Brain className="h-7 w-7" /> : isFootball ? <Trophy className="h-7 w-7" /> : isBasketball ? <Zap className="h-7 w-7" /> : isVolleyball ? <Target className="h-7 w-7" /> : isAthletics ? <Sparkles className="h-7 w-7" /> : <Trophy className="h-7 w-7" />}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                                    {isLiveUpdate ? "Live Update" : "Final Settlement"}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        ID: {match.id.split('-')[1] || match.id}
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                        {isLiveUpdate ? "Streaming Intelligence" : "Payment Authorization"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-white/10 hover:rotate-90 rounded-full transition-all duration-300 text-slate-400 hover:text-white border border-white/5 shadow-xl"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation/Modes Tabs */}
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 h-14">
                            <button
                                type="button"
                                onClick={() => setIsLiveUpdate(true)}
                                className={`px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 ${isLiveUpdate ? "bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)]" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${isLiveUpdate ? 'bg-white animate-ping' : 'bg-slate-700'}`} />
                                Live Update
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsLiveUpdate(false)}
                                className={`px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 ${!isLiveUpdate ? "bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${!isLiveUpdate ? 'bg-white' : 'bg-slate-700'}`} />
                                Final Settle
                            </button>
                        </div>

                        <div className="h-10 w-[1px] bg-white/10 hidden sm:block" />

                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 h-14">
                            <button
                                type="button"
                                onClick={() => setActiveTab("scores")}
                                className={`px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 ${activeTab === "scores" ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
                            >
                                <Zap className="h-3.5 w-3.5" />
                                Scores
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("markets")}
                                className={`px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 ${activeTab === "markets" ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
                            >
                                <Target className="h-3.5 w-3.5" />
                                Markets
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-10">
                    {error && (
                        <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] flex items-center gap-4 animate-in slide-in-from-top-4">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-[11px] font-black text-red-500 uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    {/* Validation Warnings */}
                    {validationWarnings.length > 0 && !isLiveUpdate && (
                        <div className="mb-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] space-y-4 shadow-inner">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-amber-500/20 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                </div>
                                <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Protocol Warnings</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {validationWarnings.map((warning, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                        <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        <div className="text-[10px] text-amber-200/60 font-medium leading-relaxed uppercase tracking-tight">{warning}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions (Live Mode Only) - Professional HUD Style */}
                    {isLiveUpdate && isFootball && (
                        <div className="mb-10 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={setHalfTime}
                                className="group relative h-14 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-3 overflow-hidden shadow-sm"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Clock className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 group-hover:text-blue-300 transition-colors">Phase: Half Time</span>
                            </button>
                            <button
                                type="button"
                                onClick={setFullTime}
                                className="group relative h-14 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-3 overflow-hidden shadow-sm"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Trophy className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 group-hover:text-indigo-300 transition-colors">Phase: Full Time</span>
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-12">
                        {/* TIMER INPUT (Live Mode Only, Non-Quiz) - Mission Control Aesthetics */}
                        {isLiveUpdate && !isQuiz && (
                            <div className="relative group perspective-1000">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-transparent rounded-[2.5rem] blur opacity-50" />
                                <div className="relative bg-black/40 border border-white/5 rounded-[2.5rem] p-10 space-y-8 backdrop-blur-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Temporal Synchronization</span>
                                        </div>
                                        <div className="px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20 text-[8px] font-black text-red-500 uppercase tracking-widest">Live Engine Active</div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Period</label>
                                            <div className="relative">
                                                <select
                                                    value={timerData.period}
                                                    onChange={(e) => setTimerData({ ...timerData, period: e.target.value })}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-14 px-5 text-sm font-bold text-white focus:outline-none focus:border-red-500/50 appearance-none transition-all cursor-pointer hover:bg-white/[0.05]"
                                                >
                                                    <option value="1H">1st Half</option>
                                                    <option value="HT">Half Time</option>
                                                    <option value="2H">2nd Half</option>
                                                    <option value="ET">Extra Time</option>
                                                    <option value="P">Penalties</option>
                                                </select>
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                    <Zap className="w-3 h-3 fill-current" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Elapsed Minutes</label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    value={timerData.minute}
                                                    onChange={(e) => setTimerData({ ...timerData, minute: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-14 pl-6 pr-12 text-lg font-black text-white focus:outline-none focus:border-red-500/50 transition-all font-mono"
                                                />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xl">&apos;</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Automated Termination Override</label>
                                            <div className="p-2 bg-white/5 rounded-lg">
                                                <Sparkles className="h-3 w-3 text-slate-600" />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={autoEndAt}
                                                onChange={(e) => setAutoEndAt(e.target.value)}
                                                className="w-full bg-white/[0.02] border border-white/5 border-dashed rounded-2xl h-14 px-6 text-xs font-bold text-slate-400 focus:outline-none focus:border-red-500/30 focus:text-white transition-all"
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-600 mt-3 uppercase tracking-tight font-medium ml-1">Precision Scheduling: Move match to pending state at specific timestamp automatically.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 1. TAB CONTENT - Professional Data Entry HUD */}
                        {activeTab === "scores" ? (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Participant Performance Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {match.participants.map((participant: any, index: number) => (
                                        <div key={participant.schoolId} className="group relative">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                            <div className="relative p-8 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-6 backdrop-blur-xl shadow-2xl overflow-hidden">
                                                <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none font-black text-6xl">
                                                    0{index + 1}
                                                </div>

                                                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white font-black text-[10px] tracking-tighter">
                                                        ENT
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[140px]">
                                                            {participant.name}
                                                        </h4>
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Assigned Competitor</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Aggregate Score</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={scores[participant.schoolId] || 0}
                                                            onChange={(e) => setScores({ ...scores, [participant.schoolId]: Number(e.target.value) })}
                                                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-3xl font-black text-white focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none placeholder:text-slate-800 font-mono shadow-inner"
                                                            placeholder="0"
                                                        />
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setScores({ ...scores, [participant.schoolId]: Math.max(0, (scores[participant.schoolId] || 0) - 1) })}
                                                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all border border-white/5"
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setScores({ ...scores, [participant.schoolId]: (scores[participant.schoolId] || 0) + 1 })}
                                                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all border border-white/5"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mini Stats / Odds Context */}
                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Odds</span>
                                                    </div>
                                                    <span className="text-xs font-black text-white font-mono">{participant.odd?.toFixed(2) || '1.00'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Detailed Sport Analysis Phase Breakdown */}
                                {isQuiz && (
                                    <div className="p-6 sm:p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] sm:rounded-[3rem] shadow-inner relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                            <Brain className="w-40 h-40" />
                                        </div>

                                        <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                                <Zap className="h-6 w-6 text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Round Breakdown</h3>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Granular scoring protocol for NSMQ intelligence</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                            {match.participants.map((p: any) => (
                                                <div key={p.schoolId} className="space-y-6 p-8 bg-black/40 rounded-[2rem] border border-white/5 hover:border-purple-500/20 transition-colors shadow-xl">
                                                    <h5 className="text-[11px] font-black text-purple-400 uppercase tracking-[0.25em] mb-4 flex items-center gap-3 overflow-hidden">
                                                        <div className="w-4 h-[1px] bg-purple-500/30 shrink-0" />
                                                        <span className="truncate">{p.name.split(' ')[0]}</span>
                                                    </h5>
                                                    <div className="space-y-4">
                                                        {['r1', 'r2', 'r3', 'r4', 'r5'].map(r => (
                                                            <div key={r} className="flex items-center justify-between group/row">
                                                                <span className="text-[10px] uppercase font-black text-slate-500 group-hover/row:text-slate-300 transition-colors">
                                                                    {r === 'r1' ? 'General' : r === 'r2' ? 'Speed' : r === 'r3' ? 'Problem' : r === 'r4' ? 'T/F' : 'Riddles'}
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    className="w-16 h-10 bg-white/5 border border-white/5 rounded-xl text-center text-white text-sm font-black focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all placeholder:text-slate-800"
                                                                    value={isNaN(quizData[p.schoolId][r as keyof typeof quizData[string]]) ? '' : quizData[p.schoolId][r as keyof typeof quizData[string]]}
                                                                    onChange={e => setQuizData({ ...quizData, [p.schoolId]: { ...quizData[p.schoolId], [r]: parseInt(e.target.value) || 0 } })}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Aggregate</span>
                                                        <span className="text-2xl font-black text-white font-mono">{quizTotals[p.schoolId]}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isFootball && (
                                    <div className="grid grid-cols-1 gap-8">
                                        {match.participants.map((p: any) => (
                                            <div key={p.schoolId} className="bg-white/[0.02] rounded-[2.5rem] p-10 border border-white/5 shadow-inner">
                                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-white font-black">
                                                            P
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{p.name}</h3>
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Football Participant</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 w-full lg:w-auto">
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Half Time (HT)</label>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ht: Math.max(0, (footballData[p.schoolId].ht || 0) - 1) } })}
                                                                    className="h-14 w-14 bg-black/40 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center shadow-sm shrink-0"
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </button>
                                                                <input type="number" min="0" className="flex-1 h-14 bg-black/40 border border-white/10 rounded-2xl text-center text-xl font-black text-white focus:border-blue-500/50 outline-none transition-all font-mono" value={isNaN(footballData[p.schoolId].ht) ? '' : footballData[p.schoolId].ht} onChange={e => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ht: parseInt(e.target.value) || 0 } })} placeholder="0" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ht: (footballData[p.schoolId].ht || 0) + 1 } })}
                                                                    className="h-14 w-14 bg-black/40 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center shadow-sm shrink-0"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Time (FT)</label>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ft: Math.max(0, (footballData[p.schoolId].ft || 0) - 1) } })}
                                                                    className="h-14 w-14 bg-black/40 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center shadow-sm shrink-0"
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </button>
                                                                <input type="number" min="0" className="flex-1 h-14 bg-black/40 border border-white/10 rounded-2xl text-center text-xl font-black text-white focus:border-emerald-500/50 outline-none transition-all font-mono" value={isNaN(footballData[p.schoolId].ft) ? '' : footballData[p.schoolId].ft} onChange={e => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ft: parseInt(e.target.value) || 0 } })} placeholder="0" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFootballData({ ...footballData, [p.schoolId]: { ...footballData[p.schoolId], ft: (footballData[p.schoolId].ft || 0) + 1 } })}
                                                                    className="h-14 w-14 bg-black/40 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center shadow-sm shrink-0"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* First Scorer Selection */}
                                                {!isLiveUpdate && (footballTotals[match.participants[0].schoolId] + footballTotals[match.participants[1].schoolId] > 0) && (
                                                    <div className="mt-8 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 space-y-4">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                                            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">First Team To Score</h4>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {match.participants.map(p => (
                                                                <button
                                                                    key={p.schoolId}
                                                                    type="button"
                                                                    onClick={() => setFirstScorerId(p.schoolId)}
                                                                    className={cn(
                                                                        "p-4 rounded-2xl border text-sm font-bold transition-all flex items-center justify-center gap-3",
                                                                        firstScorerId === p.schoolId
                                                                            ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                                                                            : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"
                                                                    )}
                                                                >
                                                                    <div className={cn("h-2 w-2 rounded-full", firstScorerId === p.schoolId ? "bg-white" : "bg-slate-600")} />
                                                                    {p.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isBasketball && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {match.participants.map((p: any) => (
                                            <div key={p.schoolId} className="bg-white/[0.02] rounded-[3rem] p-10 border border-white/5 space-y-8 shadow-inner overflow-hidden relative">
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                                    <Zap className="w-24 h-24" />
                                                </div>
                                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                                    <Trophy className="h-6 w-6 text-orange-500" />
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tight truncate max-w-[200px]">{p.name}</h3>
                                                </div>
                                                <div className="grid grid-cols-4 gap-4">
                                                    {['q1', 'q2', 'q3', 'q4'].map((q, idx) => (
                                                        <div key={q} className="space-y-3">
                                                            <div className="text-[10px] font-black text-slate-500 uppercase text-center tracking-widest">Q0{idx + 1}</div>
                                                            <input type="number" className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl text-center text-white text-lg font-black focus:border-orange-500/50 outline-none transition-all font-mono shadow-inner" value={isNaN(basketballData[p.schoolId][q as keyof typeof basketballData[string]]) ? '' : basketballData[p.schoolId][q as keyof typeof basketballData[string]]} onChange={e => setBasketballData({ ...basketballData, [p.schoolId]: { ...basketballData[p.schoolId], [q]: parseInt(e.target.value) || 0 } })} placeholder="0" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-6 border-t border-white/5 flex justify-between items-center group/total">
                                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Game Aggregate</span>
                                                    <span className="text-4xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">{basketballTotals[p.schoolId]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isVolleyball && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {match.participants.map((p: any) => (
                                            <div key={p.schoolId} className="bg-white/[0.02] rounded-[3rem] p-10 border border-white/5 space-y-8 shadow-inner relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                                    <Target className="w-24 h-24" />
                                                </div>
                                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                                    <Sparkles className="h-6 w-6 text-blue-400" />
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tight truncate max-w-[200px]">{p.name}</h3>
                                                </div>
                                                <div className="grid grid-cols-3 gap-6">
                                                    {['s1', 's2', 's3', 's4', 's5'].slice(0, 3).map((s, idx) => (
                                                        <div key={s} className="space-y-3">
                                                            <div className="text-[10px] font-black text-slate-500 uppercase text-center tracking-widest">Set 0{idx + 1}</div>
                                                            <input type="number" className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl text-center text-white text-lg font-black focus:border-blue-500/50 outline-none transition-all font-mono shadow-inner" value={isNaN(volleyballData[p.schoolId][s as keyof typeof volleyballData[string]]) ? '' : volleyballData[p.schoolId][s as keyof typeof volleyballData[string]]} onChange={e => setVolleyballData({ ...volleyballData, [p.schoolId]: { ...volleyballData[p.schoolId], [s]: parseInt(e.target.value) || 0 } })} placeholder="0" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Match Victory Count</span>
                                                    <span className="text-4xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{volleyballTotals[p.schoolId]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isAthletics && (
                                    <div className="grid grid-cols-1 gap-6">
                                        {match.participants.map((p: any) => (
                                            <div key={p.schoolId} className="group relative">
                                                <div className="absolute -inset-px bg-gradient-to-r from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative p-8 bg-black/40 border border-white/5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-8 hover:bg-white/[0.02] transition-all shadow-xl">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white font-black">
                                                            RUN
                                                        </div>
                                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{p.name}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-6 bg-black/60 p-2 rounded-2xl border border-white/5 px-6 py-4">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Settlement Rank</span>
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={match.participants.length}
                                                                className="w-16 h-12 bg-white/5 border border-white/10 rounded-xl text-center text-white text-xl font-black focus:border-purple-500/50 outline-none transition-all font-mono"
                                                                value={athleticsData[p.schoolId] || ""}
                                                                onChange={e => setAthleticsData({ ...athleticsData, [p.schoolId]: parseInt(e.target.value) || 0 })}
                                                                placeholder="1"
                                                            />
                                                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                                                <Trophy className="h-4 w-4 text-purple-400" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-start gap-5 backdrop-blur-sm">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/10">
                                        <HelpCircle className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Settlement Protocol</h4>
                                        <p className="text-[10px] font-bold text-blue-300/60 uppercase tracking-tight leading-relaxed">
                                            The system automatically derives standard outcomes from scores. Manual overrides here take absolute precedence for specialized markets and proposition bets.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6 h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                    {Object.entries(match.extendedOdds || {}).map(([marketName, options]) => (
                                        <div key={marketName} className="group relative">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-white/5 to-transparent rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                            <div className="relative p-4 sm:p-8 bg-black/40 border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] space-y-6 backdrop-blur-md overflow-hidden">
                                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-primary transition-colors duration-500" />
                                                        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{marketName}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {activeMarkets.includes(marketName) && (
                                                            <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[8px] font-black text-primary uppercase tracking-widest animate-pulse">Live</div>
                                                        )}
                                                        {manualOutcomes[marketName] && manualOutcomes[marketName] !== 'void' && (
                                                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black text-emerald-400 uppercase tracking-widest">Resolved</div>
                                                        )}
                                                        {manualOutcomes[marketName] === 'void' && (
                                                            <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[8px] font-black text-red-400 uppercase tracking-widest text-shadow-glow-red">Voided</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {Object.entries(options).map(([label, _]) => {
                                                        const selectionId = label;
                                                        const isSelected = manualOutcomes[marketName] === selectionId;

                                                        return (
                                                            <button
                                                                key={label}
                                                                type="button"
                                                                onClick={() => setManualOutcomes({
                                                                    ...manualOutcomes,
                                                                    [marketName]: isSelected ? "" : selectionId
                                                                })}
                                                                className={`group/btn relative h-14 px-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between overflow-hidden ${isSelected ? "bg-primary text-slate-950 border-primary shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02]" : "bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/20 hover:bg-white/[0.05]"}`}
                                                            >
                                                                <span className="truncate pr-2">{label}</span>
                                                                {isSelected ? (
                                                                    <div className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center">
                                                                        <Zap className="h-3 w-3 text-primary fill-current" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover/btn:bg-slate-600 transition-colors" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Void Market Option */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setManualOutcomes({
                                                            ...manualOutcomes,
                                                            [marketName]: manualOutcomes[marketName] === "void" ? "" : "void"
                                                        })}
                                                        className={`h-14 px-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${manualOutcomes[marketName] === "void" ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/20" : "bg-red-500/5 border-red-500/10 text-red-500/60 hover:bg-red-500/10 hover:text-red-500"}`}
                                                    >
                                                        <span>Void Market</span>
                                                        {manualOutcomes[marketName] === "void" ? <X className="h-4 w-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-red-900/40" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {Object.keys(match.extendedOdds || {}).length === 0 && (
                                        <div className="h-48 flex flex-col items-center justify-center bg-white/[0.02] border border-dashed border-white/5 rounded-[2.5rem] space-y-4">
                                            <div className="p-4 bg-white/5 rounded-full">
                                                <Target className="h-6 w-6 text-slate-700" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No proposition markets available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. WINNER OVERRIDE / SELECTION (HIDDEN IN LIVE MODE) - Final Decision HUB */}
                        {!isLiveUpdate && (
                            <div className="space-y-6 pt-10 border-t border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-10 rounded-[3rem]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Trophy className="h-4 w-4 text-primary" />
                                        <label className="text-[11px] font-black text-white uppercase tracking-[0.25em]">Strategic Victor Selection</label>
                                    </div>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest border border-white/5">Manual Decision</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {match.participants.map(p => (
                                        <button
                                            key={p.schoolId}
                                            type="button"
                                            onClick={() => setWinner(p.schoolId)}
                                            className={`group relative p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center gap-4 text-center overflow-hidden ${winner === p.schoolId ? "bg-primary text-slate-950 border-primary shadow-2xl scale-[1.02]" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/[0.08] hover:border-white/10"}`}
                                        >
                                            {winner === p.schoolId && (
                                                <div className="absolute top-0 right-0 p-3">
                                                    <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center">
                                                        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 ${winner === p.schoolId ? 'bg-slate-950 border-black/20 rotate-12' : 'bg-black/40 border-slate-800 group-hover:rotate-6'}`}>
                                                <Trophy className={`h-6 w-6 ${winner === p.schoolId ? 'text-primary' : 'text-slate-700'}`} />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-black uppercase block tracking-tight truncate max-w-[160px]">{p.name}</span>
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${winner === p.schoolId ? 'text-slate-950/60' : 'text-slate-600'}`}>Primary Competitor</span>
                                            </div>
                                        </button>
                                    ))}
                                    {isFootball && (
                                        <button
                                            type="button"
                                            onClick={() => setWinner("X")}
                                            className={`group relative p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center gap-4 text-center overflow-hidden ${winner === "X" ? "bg-amber-500 text-slate-950 border-amber-500 shadow-2xl scale-[1.02]" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/[0.08] hover:border-white/10"}`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 ${winner === "X" ? 'bg-slate-950 border-black/20 rotate-12' : 'bg-black/40 border-slate-800 group-hover:rotate-6'}`}>
                                                <X className={`h-6 w-6 ${winner === "X" ? 'text-amber-500' : 'text-slate-700'}`} />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-black uppercase block tracking-tight">Match Draw</span>
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${winner === "X" ? 'text-slate-950/60' : 'text-slate-600'}`}>Standard Result: X</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. ACTIONS - Final Protocol Hub */}
                        <div className="flex flex-col gap-6 pt-10">
                            {!isLiveUpdate && (
                                <>
                                    {/* Outcome Preview UI */}
                                    {showPreview ? (
                                        <div className="col-span-full animate-in fade-in zoom-in-95 duration-500">
                                            <div className="p-8 bg-black/60 rounded-[3rem] border border-white/10 space-y-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                                    <Brain className="w-32 h-32" />
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                                                            <CheckCircle className="h-6 w-6 text-emerald-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Settlement Preview</h3>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Review market outcomes before final authorization</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPreview(false)}
                                                        className="px-6 h-12 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                                                    >
                                                        <Plus className="w-3 h-3 rotate-45" /> Back to Edit
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                                    {previewData.map((market, idx) => (
                                                        <div key={idx} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
                                                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{market.marketName}</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {market.selections.map((sel: any, sIdx: number) => (
                                                                    <div
                                                                        key={sIdx}
                                                                        onClick={() => handleToggleSelection(market.marketName, sel.label, sel.status)}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group/sel hover:scale-[1.02] active:scale-95",
                                                                            sel.status === 'won' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                                                                sel.status === 'lost' ? "bg-red-500/10 border-red-500/30 text-red-400" :
                                                                                    "bg-slate-500/10 border-slate-500/30 text-slate-400"
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black uppercase tracking-tight truncate">{sel.label}</span>
                                                                            {manualOutcomes[`${market.marketName}:${sel.label}`.toLowerCase().trim()] && (
                                                                                <span className="text-[7px] font-bold text-white/40 uppercase tracking-tighter">Manual Override</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            {sel.status === 'won' ? <CheckCircle className="w-3 h-3" /> : (sel.status === 'lost' ? <X className="w-3 h-3" /> : <Clock className="w-3 h-3" />)}
                                                                            <span className="text-[8px] font-black uppercase tracking-widest">{sel.status}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                            {/* Outcome Verification Summary */}
                                            <div className="p-8 bg-slate-950/40 rounded-[2.5rem] border border-white/5 space-y-6 backdrop-blur-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                                    <Sparkles className="w-16 h-16" />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                                                        <Sparkles className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Settlement Audit</span>
                                                </div>

                                                <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-3">
                                                    {derivedOutcomes.map((o, idx) => (
                                                        <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group/item">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/item:text-slate-400 transition-colors">{o.market}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className={cn(
                                                                    "text-[10px] font-black uppercase tracking-tight px-3 py-1 rounded-full",
                                                                    o.type === 'auto' ? "bg-primary/10 text-primary border border-primary/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                )}>{o.result}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {derivedOutcomes.length === 0 && (
                                                        <div className="py-8 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">No auto-derived outcomes</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Confirmation & Secondary Actions */}
                                            <div className="space-y-4">
                                                <label className="flex items-start gap-4 p-6 bg-primary/5 border border-primary/10 rounded-[2rem] cursor-pointer hover:bg-primary/10 transition-all group relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
                                                    <div className="relative mt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={isConfirmed}
                                                            onChange={(e) => setIsConfirmed(e.target.checked)}
                                                            className="h-6 w-6 rounded-lg border-white/20 bg-black/50 checked:bg-primary focus:ring-primary transition-all cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="relative space-y-1">
                                                        <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors block">Integrity Confirmation</span>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight block leading-tight">I verify that all entered scores and selected winners are 100% accurate as per official records.</span>
                                                    </div>
                                                </label>

                                                <div className="grid grid-cols-2 gap-4">
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
                                                        className="h-14 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 font-black uppercase tracking-widest text-[9px] hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 group"
                                                    >
                                                        <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        Void Protocol
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
                                                        className="h-14 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-500 font-black uppercase tracking-widest text-[9px] hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2 group"
                                                    >
                                                        <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        Set Pending
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="order-2 sm:order-1 h-16 px-10 rounded-[2rem] bg-white/5 border border-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all w-full sm:w-auto"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading || (!isLiveUpdate && !isConfirmed && showPreview)}
                                    className={`order-1 sm:order-2 flex-1 h-20 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:scale-100 shadow-2xl relative overflow-hidden group w-full ${isLiveUpdate ? "bg-red-600 text-white shadow-red-900/20" : (showPreview ? "bg-emerald-500 text-white shadow-emerald-900/20" : "bg-primary text-slate-950 shadow-primary/20")}`}
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    {loading ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="relative z-10">
                                                {isLiveUpdate ? "Broadcast Live Update" : (showPreview ? "Confirm & Finalize Settlement" : "Preview Settlement Outcome")}
                                            </span>
                                            <Zap className={`h-5 w-5 relative z-10 ${isLiveUpdate || showPreview ? 'text-white/50' : 'text-slate-950/50'}`} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

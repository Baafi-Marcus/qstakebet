"use client"

import { useState, useTransition } from "react"
import { settleFantasyLineups } from "@/lib/settlement"
import { ShieldAlert, CheckCircle, Info, Calendar, Trophy, ChevronRight } from "lucide-react"

type Match = {
    id: string
    tournamentId: string | null
    stage: string
    status: string
    isLive: boolean
    isVirtual: boolean
    participants: any
    result: any
    tournamentName?: string
}

type VerifyResultsClientProps = {
    initialMatches: Match[]
}

export function VerifyResultsClient({ initialMatches }: VerifyResultsClientProps) {
    const [matchesList, setMatchesList] = useState<Match[]>(initialMatches)
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
    
    // Scores and Modifiers State
    const [scores, setScores] = useState<Record<string, number>>({})
    const [perfectR3, setPerfectR3] = useState<string[]>([])
    const [steals, setSteals] = useState<string[]>([])
    const [dailyHigh, setDailyHigh] = useState<string[]>([])

    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSelectMatch = (match: Match) => {
        setSelectedMatch(match)
        setMessage(null)
        
        // Pre-fill existing scores if any
        const initialScores: Record<string, number> = {}
        const participants = (match.participants as any[]) || []
        const currentScores = match.result?.scores || {}
        
        participants.forEach(p => {
            initialScores[p.schoolId] = currentScores[p.schoolId] || 0
        })
        
        setScores(initialScores)
        setPerfectR3([])
        setSteals([])
        setDailyHigh([])
    }

    const handleScoreChange = (schoolId: string, val: string) => {
        const num = parseInt(val) || 0
        setScores(prev => ({ ...prev, [schoolId]: num }))
    }

    const toggleModifier = (schoolId: string, type: 'perfect' | 'steal' | 'high') => {
        if (type === 'perfect') {
            setPerfectR3(prev => prev.includes(schoolId) ? prev.filter(id => id !== schoolId) : [...prev, schoolId])
        } else if (type === 'steal') {
            setSteals(prev => prev.includes(schoolId) ? prev.filter(id => id !== schoolId) : [...prev, schoolId])
        } else if (type === 'high') {
            setDailyHigh(prev => prev.includes(schoolId) ? prev.filter(id => id !== schoolId) : [...prev, schoolId])
        }
    }

    const handleSettle = () => {
        if (!selectedMatch) return

        startTransition(async () => {
            const options = {
                perfectRound3SchoolIds: perfectR3,
                regionalStealsSchoolIds: steals,
                dailyHighScoreSchoolIds: dailyHigh,
                customScores: scores
            }

            const result = await settleFantasyLineups(selectedMatch.id, options)

            if (result.success) {
                setMessage({ 
                    type: "success", 
                    text: `Successfully settled points for ${result.updatedLineupsCount} active lineups!` 
                })
                
                // Remove settled match from local state list
                setMatchesList(prev => prev.filter(m => m.id !== selectedMatch.id))
                setSelectedMatch(null)
            } else {
                setMessage({ type: "error", text: result.error || "Failed to settle fantasy points" })
            }
        })
    }

    return (
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
            
            {/* Unsettled Matches List */}
            <div className="w-full md:w-96 bg-slate-900 border border-white/5 p-6 rounded-3xl shrink-0">
                <h2 className="text-xs font-black tracking-widest text-purple-400 uppercase mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-4.5 w-4.5" /> Pending Verification
                </h2>
                
                <div className="flex flex-col gap-3">
                    {matchesList.length > 0 ? (
                        matchesList.map(m => {
                            const participants = (m.participants as any[]) || []
                            const isSelected = selectedMatch?.id === m.id

                            return (
                                <button
                                    key={m.id}
                                    onClick={() => handleSelectMatch(m)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                                        isSelected
                                            ? "bg-purple-950/20 border-purple-500/30 text-white"
                                            : "bg-slate-950/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950"
                                    }`}
                                >
                                    <div className="text-[9px] font-black uppercase text-purple-400">{m.stage}</div>
                                    <div className="font-extrabold text-xs text-white mt-1">
                                        {participants.map(p => p.name).join(" vs ")}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase mt-2">
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        {m.tournamentName}
                                    </div>
                                </button>
                            )
                        })
                    ) : (
                        <div className="text-center py-10 text-slate-600 text-xs font-semibold border border-dashed border-white/5 rounded-2xl">
                            No matches pending verification.
                        </div>
                    )}
                </div>
            </div>

            {/* Settle Form Workspace */}
            <div className="flex-1 bg-slate-900 border border-white/5 p-6 md:p-8 rounded-3xl">
                {selectedMatch ? (
                    <div className="flex flex-col gap-6">
                        {/* Selected Match Header */}
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                <span>{selectedMatch.tournamentName}</span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-purple-400 font-black">{selectedMatch.stage}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mt-1">Settle Stage Scores & Modifiers</h3>
                        </div>

                        {/* Schools Input List */}
                        <div className="space-y-4">
                            {((selectedMatch.participants as any[]) || []).map((p, idx) => {
                                const schoolId = p.schoolId
                                const isPerfect = perfectR3.includes(schoolId)
                                const isSteal = steals.includes(schoolId)
                                const isHigh = dailyHigh.includes(schoolId)

                                return (
                                    <div key={idx} className="bg-slate-950 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        
                                        {/* School Name */}
                                        <div className="min-w-0 md:w-64">
                                            <div className="font-black text-sm text-white truncate">{p.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">{p.region} Region</div>
                                        </div>

                                        {/* Score Input */}
                                        <div className="flex items-center gap-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Quiz Score</label>
                                            <input
                                                type="number"
                                                value={scores[schoolId] ?? 0}
                                                onChange={(e) => handleScoreChange(schoolId, e.target.value)}
                                                className="w-20 bg-slate-900 border border-white/5 text-center py-2 rounded-xl text-sm font-black text-white focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>

                                        {/* Modifiers Checkboxes */}
                                        <div className="flex flex-wrap gap-2">
                                            {/* R3 Perfect */}
                                            <button
                                                onClick={() => toggleModifier(schoolId, 'perfect')}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                                    isPerfect
                                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                                        : "bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300"
                                                }`}
                                            >
                                                Perfect R3 (+10)
                                            </button>
                                            {/* Steals */}
                                            <button
                                                onClick={() => toggleModifier(schoolId, 'steal')}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                                    isSteal
                                                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                                        : "bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300"
                                                }`}
                                            >
                                                Steals (+5)
                                            </button>
                                            {/* Daily High */}
                                            <button
                                                onClick={() => toggleModifier(schoolId, 'high')}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                                    isHigh
                                                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                                                        : "bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300"
                                                }`}
                                            >
                                                Daily High (+20)
                                            </button>
                                        </div>

                                    </div>
                                )
                            })}
                        </div>

                        {/* Messages Box */}
                        {message && (
                            <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
                                message.type === 'success'
                                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                    : "bg-rose-500/10 border-rose-500/25 text-rose-400"
                            }`}>
                                <CheckCircle className="h-5 w-5 shrink-0" />
                                <span>{message.text}</span>
                            </div>
                        )}

                        {/* Settle Action Button */}
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setSelectedMatch(null)}
                                className="px-6 py-3 border border-white/5 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSettle}
                                disabled={isPending}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center gap-2 cursor-pointer"
                            >
                                <Trophy className="h-4 w-4" />
                                {isPending ? "Settling..." : "Verify & Distribute Points"}
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-500">
                        <Info className="h-8 w-8 text-slate-700 mb-2" />
                        <h3 className="font-extrabold text-sm text-white">No Match Selected</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">Select an active match from the sidebar to enter scores and allocate fantasy points.</p>
                    </div>
                )}
            </div>

        </div>
    )
}

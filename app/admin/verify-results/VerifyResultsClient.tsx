"use client"

import { useState, useTransition } from "react"
import { extractMatchResultFromText, applyMatchResult } from "@/lib/admin-actions"
import { ShieldExclamationIcon as ShieldAlert, CheckCircleIcon as CheckCircle, InformationCircleIcon as Info, CalendarIcon as Calendar, TrophyIcon as Trophy, ChevronRightIcon as ChevronRight, SparklesIcon as Sparkles, ClipboardDocumentIcon as Clipboard, XMarkIcon as X } from "@heroicons/react/24/solid";

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

type Extracted = {
    customScores: Record<string, number>
    winnerSchoolId: string | null
    rounds: { label: string, scores: Record<string, number> }[]
}

type VerifyResultsClientProps = {
    initialMatches: Match[]
}

export function VerifyResultsClient({ initialMatches }: VerifyResultsClientProps) {
    const [matchesList, setMatchesList] = useState<Match[]>(initialMatches)
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

    const [aiText, setAiText] = useState("")
    const [extracted, setExtracted] = useState<Extracted | null>(null)
    const [isExtracting, startExtractTransition] = useTransition()
    const [isPending, startSettleTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSelectMatch = (match: Match) => {
        setSelectedMatch(match)
        setAiText("")
        setExtracted(null)
        setMessage(null)
    }

    const handleExtractScores = () => {
        if (!selectedMatch || !aiText.trim()) return

        startExtractTransition(async () => {
            const res = await extractMatchResultFromText(aiText, selectedMatch.id)
            if (res.success && res.customScores) {
                setExtracted({
                    customScores: res.customScores,
                    winnerSchoolId: (res as any).winnerSchoolId ?? null,
                    rounds: (res as any).rounds || []
                })
                setMessage({ type: "success", text: "AI extracted the results. Review below, then verify to distribute points." })
            } else {
                setExtracted(null)
                setMessage({ type: "error", text: res.error || "Failed to extract scores from text" })
            }
        })
    }

    const handleSettle = () => {
        if (!selectedMatch || !extracted) return

        startSettleTransition(async () => {
            const result = await applyMatchResult(selectedMatch.id, extracted)

            if (result.success) {
                setMessage({
                    type: "success",
                    text: `Result saved & points distributed to ${result.updatedLineupsCount} lineups on this matchday.`
                })
                setMatchesList(prev => prev.filter(m => m.id !== selectedMatch.id))
                setSelectedMatch(null)
                setExtracted(null)
                setAiText("")
            } else {
                setMessage({ type: "error", text: result.error || "Failed to apply match result" })
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

                <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
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

            {/* Paste & Settle Workspace */}
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
                            <h3 className="text-2xl font-black text-white mt-1">Paste Contest Coverage</h3>
                            <p className="text-xs text-slate-500 mt-1">Round-by-round updates or a final summary — the AI picks out what matters.</p>
                        </div>

                        {/* Paste Box */}
                        <textarea
                            value={aiText}
                            onChange={(e) => setAiText(e.target.value)}
                            placeholder={`Paste the live tweets / contest summary here...\n\ne.g.\nEnd of Round 1: Prempeh 12, Mfantsipim 9\nRound 2: Prempeh 21, Mfantsipim 19\nFinal: Prempeh 46, Mfantsipim 41 — Prempeh wins!`}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all min-h-[180px] resize-y font-mono"
                        />

                        <div className="flex justify-end">
                            <button
                                onClick={handleExtractScores}
                                disabled={isExtracting || !aiText.trim()}
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            >
                                <Sparkles className="h-4 w-4" />
                                {isExtracting ? "Reading the contest..." : "Extract with AI"}
                            </button>
                        </div>

                        {/* Extracted Preview */}
                        {extracted && (() => {
                            const participants = ((selectedMatch.participants as any[]) || [])
                                .filter(p => extracted.customScores[p.schoolId] !== undefined)
                            const winnerName = participants.find(p => p.schoolId === extracted.winnerSchoolId)?.name
                            const topScore = Math.max(...Object.values(extracted.customScores))

                            return (
                                <div className="bg-slate-950 border border-purple-500/20 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                                            <Clipboard className="h-3.5 w-3.5" /> Extracted Result
                                        </span>
                                        <button
                                            onClick={() => setExtracted(null)}
                                            className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 cursor-pointer"
                                            title="Discard extraction"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {participants.map(p => {
                                            const score = extracted.customScores[p.schoolId]
                                            const isWinner = p.schoolId === extracted.winnerSchoolId
                                            return (
                                                <div key={p.schoolId} className="flex items-center justify-between bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {isWinner && <Trophy className="h-4 w-4 shrink-0 text-yellow-400" />}
                                                        <span className="font-extrabold text-sm text-white truncate">{p.name}</span>
                                                        {isWinner && winnerName && (
                                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/25 shrink-0">Winner</span>
                                                        )}
                                                    </div>
                                                    <span className={`font-black text-lg font-mono ${score === topScore ? "text-purple-300" : "text-slate-300"}`}>
                                                        {score}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {extracted.rounds.length > 0 && (
                                        <div className="pt-2 border-t border-white/5 space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Rounds detected</p>
                                            {extracted.rounds.map((r, i) => (
                                                <div key={i} className="flex items-center justify-between text-[11px]">
                                                    <span className="font-bold text-slate-400">{r.label}</span>
                                                    <span className="font-mono text-slate-300">
                                                        {participants
                                                            .filter(p => r.scores[p.schoolId] !== undefined)
                                                            .map(p => `${p.name.split(" ")[0]} ${r.scores[p.schoolId]}`)
                                                            .join("  ·  ")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!winnerName && (
                                        <p className="text-[10px] text-amber-400/80 font-bold">
                                            No clear winner detected — win bonuses will only apply if one school finishes strictly ahead.
                                        </p>
                                    )}
                                </div>
                            )
                        })()}

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
                                onClick={() => { setSelectedMatch(null); setExtracted(null); setMessage(null) }}
                                className="px-6 py-3 border border-white/5 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSettle}
                                disabled={isPending || !extracted}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">Select an active match from the sidebar, paste its contest coverage, and let the AI do the rest.</p>
                    </div>
                )}
            </div>

        </div>
    )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Loader2, Sparkles, Check, Trash2, RotateCcw, Save } from "lucide-react"
import { Match } from "@/lib/types"
import { getMatchSuggestions, publishMatchMarkets } from "@/lib/admin-actions"

interface MarketReviewModalProps {
    match: Match
    onClose: () => void
    onSuccess: () => void
}

type MarketDraft = {
    id: string
    marketName: string
    helpInfo: string
    selections: Array<{
        label: string
        odds: number
    }>
}

export function MarketReviewModal({ match, onClose, onSuccess }: MarketReviewModalProps) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [drafts, setDrafts] = useState<MarketDraft[]>([])
    const [publishing, setPublishing] = useState(false)
    const [regenerating, setRegenerating] = useState(false)

    // Helper to get suggestions
    const fetchSuggestions = useCallback(async () => {
        try {
            setLoading(true)
            setError("")
            const res = await getMatchSuggestions(match.id)
            if (res.success && res.suggestions) {
                // Add unique IDs for UI handling
                const formatted = res.suggestions.map((s) => ({
                    ...s,
                    id: Math.random().toString(36).substr(2, 9)
                }))
                setDrafts(formatted)
            } else {
                setError(res.error || "Failed to generate suggestions")
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
            setRegenerating(false)
        }
    }, [match.id])

    // Initial Fetch
    useEffect(() => {
        fetchSuggestions()
    }, [fetchSuggestions])

    const handlePublish = async () => {
        if (drafts.length === 0) return

        try {
            setPublishing(true)
            const res = await publishMatchMarkets(match.id, drafts)
            if (res.success) {
                onSuccess()
                onClose()
            } else {
                alert("Failed to publish markets")
            }
        } catch (err) {
            console.error(err)
            alert("Error publishing markets")
        } finally {
            setPublishing(false)
        }
    }

    const removeDraft = (id: string) => {
        setDrafts(prev => prev.filter(d => d.id !== id))
    }

    const updateDraftOdd = (draftId: string, selectionIdx: number, newOdd: string) => {
        const val = parseFloat(newOdd)
        setDrafts(prev => prev.map(d => {
            if (d.id !== draftId) return d
            const newSelections = [...d.selections]
            newSelections[selectionIdx].odds = isNaN(val) ? 0 : val
            return { ...d, selections: newSelections }
        }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-purple-900/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 text-white rounded-lg">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">AI Market Generator</h2>
                            <p className="text-xs text-purple-300 font-bold uppercase tracking-wide">Review & Edit Proposals</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
                            <div className="text-center">
                                <p className="text-white font-bold text-lg">Thinking...</p>
                                <p className="text-slate-500 text-sm">Analyzing match context & calculating profitable odds</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-red-400 text-center p-8 bg-red-500/10 rounded-xl border border-red-500/20">
                            <p className="font-bold">{error}</p>
                            <button onClick={fetchSuggestions} className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm font-bold uppercase">Try Again</button>
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="text-center p-12 text-slate-500">
                            <p>No new markets suggested.</p>
                            <button onClick={() => { setRegenerating(true); fetchSuggestions(); }} className="mt-4 text-purple-400 underline cursor-pointer">Generate Different Markets</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {drafts.map((draft) => (
                                <div key={draft.id} className="bg-slate-900 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Market Name</label>
                                            <input
                                                value={draft.marketName}
                                                onChange={(e) => setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, marketName: e.target.value } : d))}
                                                className="bg-transparent text-white font-bold text-lg focus:outline-none w-full border-b border-transparent focus:border-purple-500/50 mb-2"
                                            />
                                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Help Info / Tooltip</label>
                                            <input
                                                value={draft.helpInfo || ""}
                                                onChange={(e) => setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, helpInfo: e.target.value } : d))}
                                                className="bg-transparent text-slate-400 text-xs focus:outline-none w-full border-b border-transparent focus:border-purple-500/50"
                                            />
                                        </div>
                                        <button onClick={() => removeDraft(draft.id)} className="text-slate-600 hover:text-red-400 transition-colors p-2">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {draft.selections.map((sel, idx) => (
                                            <div key={idx} className="bg-black/30 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                                <input
                                                    value={sel.label}
                                                    onChange={(e) => {
                                                        const newSels = [...draft.selections]
                                                        newSels[idx].label = e.target.value
                                                        setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, selections: newSels } : d))
                                                    }}
                                                    className="bg-transparent text-slate-300 text-sm font-medium focus:outline-none w-full"
                                                />
                                                <div className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1 border border-white/10">
                                                    <span className="text-white font-bold text-sm">x</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={sel.odds}
                                                        onChange={(e) => updateDraftOdd(draft.id, idx, e.target.value)}
                                                        className="bg-transparent text-green-400 font-black text-right w-16 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-slate-900 flex justify-between items-center gap-4 shrink-0">
                    <button
                        onClick={() => { setRegenerating(true); fetchSuggestions(); }}
                        disabled={loading || publishing}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-wide transition-all disabled:opacity-50"
                    >
                        <RotateCcw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                        Regenerate
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Review carefully</p>
                            <p className="text-[10px] text-slate-600">Odds include 15% margin</p>
                        </div>
                        <button
                            onClick={handlePublish}
                            disabled={loading || publishing || drafts.length === 0}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {publishing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            {publishing ? "Publishing..." : "Publish to Users"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

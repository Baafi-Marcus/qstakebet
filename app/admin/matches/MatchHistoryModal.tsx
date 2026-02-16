"use client"

import { useState, useEffect } from "react"
import { X, Clock, User, TrendingUp, Download } from "lucide-react"
import { getMatchHistory } from "@/lib/match-helpers"

interface MatchHistoryModalProps {
    matchId: string
    matchName: string
    onClose: () => void
}

interface HistoryEntry {
    id: string
    action: string
    previousData: any
    newData: any
    updatedBy: string
    metadata: any
    createdAt: Date
}

export function MatchHistoryModal({ matchId, matchName, onClose }: MatchHistoryModalProps) {
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchHistory() {
            const result = await getMatchHistory(matchId)
            if (result.success) {
                setHistory(result.history as HistoryEntry[])
            }
            setLoading(false)
        }
        fetchHistory()
    }, [matchId])

    const exportToCSV = () => {
        const headers = ["Timestamp", "Action", "Updated By", "Previous Scores", "New Scores"]
        const rows = history.map(entry => [
            new Date(entry.createdAt).toLocaleString(),
            entry.action,
            entry.updatedBy,
            JSON.stringify(entry.previousData?.scores || {}),
            JSON.stringify(entry.newData?.scores || {})
        ])

        const csv = [headers, ...rows].map(row => row.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `match-history-${matchId}.csv`
        a.click()
    }

    const getActionIcon = (action: string) => {
        switch (action) {
            case "score_update": return <TrendingUp className="h-4 w-4" />
            case "status_change": return <Clock className="h-4 w-4" />
            default: return <User className="h-4 w-4" />
        }
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case "score_update": return "text-blue-400 bg-blue-500/10 border-blue-500/20"
            case "status_change": return "text-amber-400 bg-amber-500/10 border-amber-500/20"
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/20"
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Match History</h2>
                        <p className="text-sm text-slate-400 font-bold mt-1">{matchName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportToCSV}
                            disabled={history.length === 0}
                            className="h-10 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download className="h-3 w-3" />
                            Export CSV
                        </button>
                        <button
                            onClick={onClose}
                            className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <Clock className="h-8 w-8 text-slate-500 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                            <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No history recorded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((entry, idx) => (
                                <div key={entry.id} className="relative">
                                    {/* Timeline line */}
                                    {idx < history.length - 1 && (
                                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-white/10" />
                                    )}

                                    <div className="flex gap-4">
                                        {/* Icon */}
                                        <div className={`h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${getActionColor(entry.action)}`}>
                                            {getActionIcon(entry.action)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <div className="text-sm font-black text-white uppercase">
                                                        {entry.action.replace("_", " ")}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-bold mt-1">
                                                        {new Date(entry.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                                    <User className="h-3 w-3" />
                                                    {entry.updatedBy}
                                                </div>
                                            </div>

                                            {/* Changes */}
                                            {entry.action === "score_update" && (
                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Previous</div>
                                                        <div className="bg-black/40 rounded-xl p-3 text-xs font-mono text-slate-300">
                                                            {JSON.stringify(entry.previousData?.scores || {}, null, 2)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">New</div>
                                                        <div className="bg-black/40 rounded-xl p-3 text-xs font-mono text-emerald-300">
                                                            {JSON.stringify(entry.newData?.scores || {}, null, 2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {entry.action === "status_change" && (
                                                <div className="flex items-center gap-4 mt-4 text-sm font-bold">
                                                    <span className="text-slate-400">{entry.previousData?.status}</span>
                                                    <span className="text-slate-600">→</span>
                                                    <span className="text-white">{entry.newData?.status}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

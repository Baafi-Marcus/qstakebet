"use client"

import { useState } from "react"
import { approvePendingResult, rejectPendingResult } from "@/lib/admin-actions"
import type { PendingResult } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"

export function ApprovalQueue({ initialPending, matches }: { initialPending: PendingResult[], matches: any[] }) {
    const [pending, setPending] = useState(initialPending)
    const [loading, setLoading] = useState<string | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncDepth, setSyncDepth] = useState(15)
    const [syncMessage, setSyncMessage] = useState<string | null>(null)

    const handleApprove = async (id: string, matchId: string) => {
        if (!matchId) {
            alert("Please select a match to apply this result to.")
            return
        }
        setLoading(id)
        const res = await approvePendingResult(id, matchId)
        if (res.success) {
            setPending(pending.filter(p => p.id !== id))
        } else {
            alert(res.error)
        }
        setLoading(null)
    }

    const handleReject = async (id: string) => {
        setLoading(id)
        const res = await rejectPendingResult(id)
        if (res.success) {
            setPending(pending.filter(p => p.id !== id))
        } else {
            alert(res.error)
        }
        setLoading(null)
    }

    const handleSync = async () => {
        setIsSyncing(true)
        setSyncMessage(null)
        try {
            const res = await fetch(`/api/cron/sync-twitter?depth=${syncDepth}`)
            const data = await res.json()
            if (data.success) {
                setSyncMessage(`Scan complete! ${data.message} Page will refresh to update the list...`)
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            } else {
                setSyncMessage(`Sync failed: ${data.error || "Unknown error"}`)
            }
        } catch (e: any) {
            setSyncMessage(`Error: ${e.message || "Failed to contact API"}`)
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Sync Controls Panel */}
            <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">X / Twitter Sync Controller</h4>
                    <p className="text-xs text-slate-400 mt-1 font-semibold leading-normal">
                        Fetch and parse tweets from `@NSMQGhana` to auto-extract match scores and populate your queue.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <select
                        value={syncDepth}
                        onChange={(e) => setSyncDepth(Number(e.target.value))}
                        disabled={isSyncing}
                        className="bg-slate-950 text-slate-300 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-purple-500/50"
                    >
                        <option value={5}>Latest 5 Tweets</option>
                        <option value={15}>Latest 15 Tweets</option>
                        <option value={30}>Latest 30 Tweets</option>
                        <option value={50}>Latest 50 Tweets</option>
                    </select>
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        {isSyncing ? "Scanning Feed..." : "Scan Twitter Feed"}
                    </Button>
                </div>
            </div>

            {syncMessage && (
                <div className={`p-4 rounded-xl text-xs font-bold border ${
                    syncMessage.includes("failed") || syncMessage.includes("Error")
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse"
                }`}>
                    {syncMessage}
                </div>
            )}

            {pending.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 border border-white/5 rounded-3xl text-slate-500 font-semibold text-xs leading-normal">
                    No pending results in the queue. Use the scanner controls above to fetch results from Twitter.
                </div>
            ) : (
                <div className="space-y-4">
                    {pending.map(item => {
                        const parsed = item.parsedData as any;
                        const scoresText = parsed.scores?.map((s: any) => `${s.schoolName}: ${s.score}`).join(" | ") || "No scores extracted";
                        
                        return (
                            <div key={item.id} className="p-6 bg-slate-900 rounded-3xl border border-white/5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-black rounded-md uppercase tracking-widest">{item.source}</span>
                                        <h3 className="mt-2 text-md font-extrabold text-white">{scoresText}</h3>
                                        {parsed.round && <p className="text-slate-400 text-xs font-semibold mt-1">Round/Stage: {parsed.round}</p>}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-950 rounded-2xl text-xs text-slate-400 font-medium leading-relaxed border border-white/5">
                                    <strong className="text-slate-300 font-black uppercase text-[9px] tracking-wider block mb-1">Raw Tweet Content:</strong>
                                    <p className="font-mono">{item.rawText}</p>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <select
                                        className="bg-slate-950 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider flex-1 border border-white/5 focus:outline-none focus:border-purple-500/50"
                                        id={`match-select-${item.id}`}
                                    >
                                        <option value="">-- Link to Active Match --</option>
                                        {matches.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.participants?.map((p: any) => p.name).join(" vs ")} ({m.stage})
                                            </option>
                                        ))}
                                    </select>
                                    
                                    <Button 
                                        variant="outline" 
                                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border-red-950 rounded-xl font-bold text-xs uppercase tracking-wider py-2.5 px-4"
                                        onClick={() => handleReject(item.id)}
                                        disabled={loading === item.id}
                                    >
                                        Reject
                                    </Button>
                                    <Button 
                                        className="bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-green-600/25 cursor-pointer"
                                        onClick={() => {
                                            const select = document.getElementById(`match-select-${item.id}`) as HTMLSelectElement;
                                            handleApprove(item.id, select.value);
                                        }}
                                        disabled={loading === item.id}
                                    >
                                        Approve & Apply
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

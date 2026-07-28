"use client"

import { useState } from "react"
import { approvePendingResult, rejectPendingResult } from "@/lib/admin-actions"
import type { PendingResult } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"

export function ApprovalQueue({ initialPending, matches }: { initialPending: PendingResult[], matches: any[] }) {
    const [pending, setPending] = useState(initialPending)
    const [loading, setLoading] = useState<string | null>(null)

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

    if (pending.length === 0) {
        return <div className="p-8 text-center bg-gray-900 rounded-xl">No pending results in the queue.</div>
    }

    return (
        <div className="space-y-6">
            {pending.map(item => {
                const parsed = item.parsedData as any;
                const scoresText = parsed.scores?.map((s: any) => `${s.schoolName}: ${s.score}`).join(" | ") || "No scores extracted";
                
                return (
                    <div key={item.id} className="p-6 bg-gray-900 rounded-xl border border-gray-800 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md uppercase tracking-wider">{item.source}</span>
                                <h3 className="mt-2 text-lg font-bold">{scoresText}</h3>
                                {parsed.round && <p className="text-gray-400 text-sm">Round: {parsed.round}</p>}
                            </div>
                            <div className="text-sm text-gray-500">
                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                            </div>
                        </div>

                        <div className="p-3 bg-gray-950 rounded-lg text-sm text-gray-300 border border-gray-800">
                            <strong>Raw Text:</strong>
                            <p className="mt-1 font-mono">{item.rawText}</p>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <select 
                                className="bg-gray-800 text-white rounded-md px-3 py-2 text-sm flex-1 border border-gray-700"
                                id={`match-select-${item.id}`}
                            >
                                <option value="">-- Select Active Match to Apply --</option>
                                {matches.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.participants?.map((p: any) => p.name).join(" vs ")} ({m.sportType})
                                    </option>
                                ))}
                            </select>
                            
                            <Button 
                                variant="outline" 
                                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border-red-900/50"
                                onClick={() => handleReject(item.id)}
                                disabled={loading === item.id}
                            >
                                Reject
                            </Button>
                            <Button 
                                className="bg-green-600 hover:bg-green-500 text-white"
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
    )
}

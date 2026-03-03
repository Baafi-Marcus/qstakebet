"use client"

import React, { useState } from "react"
import { Send, X, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { broadcastSMS } from "@/lib/admin-user-actions"

interface BroadcastSMSModalProps {
    onClose: () => void
}

export function BroadcastSMSModal({ onClose }: BroadcastSMSModalProps) {
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [filters, setFilters] = useState<{ minBalance?: number; maxBalance?: number; lastBetDays?: number }>({
        minBalance: undefined,
        maxBalance: undefined,
        lastBetDays: undefined
    })
    const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || sending) return

        let targetDesc = "ALL active users"
        if (filters.minBalance !== undefined || filters.maxBalance !== undefined || filters.lastBetDays !== undefined) {
            targetDesc = "the targeted segment"
        }

        if (!window.confirm(`Are you sure you want to send this message to ${targetDesc}? This action cannot be undone.`)) {
            return
        }

        setSending(true)
        try {
            const res = await broadcastSMS(message, filters)
            setResult(res)
        } catch (error) {
            setResult({ success: false, error: "An unexpected error occurred." })
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-[#0f1115] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Send className="h-6 w-6 text-primary" />
                        Broadcast SMS
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Send a message to all active users on the platform.</p>
                </div>

                {result ? (
                    <div className="space-y-6">
                        <div className={`p-6 rounded-2xl border ${result.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                            <div className="flex items-start gap-4">
                                <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-lg">{result.success ? "Message Sent Successfully!" : "Broadcast Failed"}</h3>
                                    <p className="text-sm mt-1 opacity-80">
                                        {result.success
                                            ? `Your message has been queued for ${result.count} users.`
                                            : result.error || "There was an error sending your broadcast."}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={onClose}
                            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-6 rounded-2xl"
                        >
                            Close
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Targeting Controls */}
                        <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">Campaign Targeting</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Min Balance</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={filters.minBalance ?? ""}
                                        onChange={(e) => setFilters({ ...filters, minBalance: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Max Balance</label>
                                    <input
                                        type="number"
                                        placeholder="No limit"
                                        value={filters.maxBalance ?? ""}
                                        onChange={(e) => setFilters({ ...filters, maxBalance: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Idle Segment (No bets in X days)</label>
                                <select
                                    value={filters.lastBetDays ?? ""}
                                    onChange={(e) => setFilters({ ...filters, lastBetDays: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-primary outline-none"
                                >
                                    <option value="">All Active Users</option>
                                    <option value="1">No bets in 24 hours</option>
                                    <option value="3">No bets in 3 days</option>
                                    <option value="7">No bets in 7 days</option>
                                    <option value="30">No bets in 30 days</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Message Content</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-primary transition-all min-h-[100px] resize-none"
                                required
                                maxLength={160}
                            />
                            <div className="flex justify-between px-1">
                                <p className="text-[10px] text-slate-500 italic">Max 160 characters per SMS.</p>
                                <p className={cn("text-[10px] font-bold", message.length > 140 ? "text-orange-400" : "text-slate-500")}>
                                    {message.length}/160
                                </p>
                            </div>
                        </div>

                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-orange-200 leading-relaxed uppercase font-bold">
                                Note: This will only send to users matching ALL selected criteria. Costs apply via Vynfy.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={!message.trim() || sending}
                            className="w-full bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest py-8 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {sending ? (
                                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Segmenting & Sending...</>
                            ) : (
                                <><Send className="h-5 w-5 mr-2" /> Launch Campaign</>
                            )}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

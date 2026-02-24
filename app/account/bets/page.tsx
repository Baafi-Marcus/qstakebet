"use client"

import { useState, useEffect, useMemo } from "react"
import { Trophy, History, Loader2, Search, ArrowLeft, Filter, Zap, PlayCircle, Layers } from "lucide-react"
import { getUserBetsWithDetails } from "@/lib/user-actions"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BetTicket } from "@/components/account/BetTicket"

export default function BetsPage() {
    const [loading, setLoading] = useState(true)
    const [bets, setBets] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'open' | 'history'>('open')
    const [filter, setFilter] = useState<'all' | 'cashout' | 'live'>('all')

    useEffect(() => {
        const fetchBets = async () => {
            const res = await getUserBetsWithDetails()
            if (res.success) setBets(res.bets || [])
            setLoading(false)
        }
        fetchBets()
    }, [])

    const counts = useMemo(() => {
        return {
            open: bets.filter(b => b.status === 'pending').length,
            history: bets.filter(b => ['won', 'lost', 'void'].includes(b.status)).length
        }
    }, [bets])

    const filteredBets = useMemo(() => {
        const base = bets.filter(b => {
            if (activeTab === 'open') return b.status === 'pending'
            return ['won', 'lost', 'void'].includes(b.status)
        })

        if (activeTab === 'open') {
            if (filter === 'live') {
                return base.filter(b => (b.selections as any[]).some(s => s.currentMatch?.isLive))
            }
            if (filter === 'cashout') {
                return base.filter(b => b.status === 'pending') // For now all pending have cashout
            }
        }

        return base
    }, [bets, activeTab, filter])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="relative">
                <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Layers className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">Syncing your tickets...</p>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto py-4 px-4 md:px-0">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/account" className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl text-slate-400 transition-all group">
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white leading-none">My Bets</h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Manage your active & settled tickets</p>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Main Tabs */}
                <div className="flex p-1.5 bg-slate-900 border border-white/5 rounded-3xl w-full max-w-md mx-auto shadow-2xl">
                    <button
                        onClick={() => setActiveTab('open')}
                        className={cn(
                            "flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                            activeTab === 'open'
                                ? "bg-slate-800 text-white shadow-xl border border-white/5"
                                : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <span>Open Bets</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[9px]",
                            activeTab === 'open' ? "bg-primary text-white" : "bg-slate-800 text-slate-500"
                        )}>
                            {counts.open}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                            activeTab === 'history'
                                ? "bg-slate-800 text-white shadow-xl border border-white/5"
                                : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <span>Bet History</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[9px]",
                            activeTab === 'history' ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500"
                        )}>
                            {counts.history}
                        </span>
                    </button>
                </div>



                {/* Bet List */}
                {filteredBets.length > 0 ? (
                    <div className="space-y-6">
                        {filteredBets.map((bet) => (
                            <BetTicket
                                key={bet.id}
                                bet={bet}
                                isHistory={activeTab === 'history'}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
                        <div className="h-16 w-16 bg-slate-900 border border-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                            <History className="h-8 w-8 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">No tickets found</h3>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest max-w-[200px] leading-relaxed">
                            {activeTab === 'open'
                                ? 'You have no active bets. Start playing to see your tickets here.'
                                : 'Your betting history is currently empty.'}
                        </p>
                        <Link
                            href="/"
                            className="mt-8 px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                        >
                            Explore Markets
                        </Link>
                    </div>
                )}
            </div>

            <div className="mt-12 text-center">
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                    All times are in local time (GMT)
                </p>
            </div>
        </div>
    )
}

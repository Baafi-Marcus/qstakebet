"use client"

import { useState, useEffect } from "react"
import { Trophy, History, Loader2, Search, ArrowLeft } from "lucide-react"
import { getUserBets } from "@/lib/user-actions"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function BetsPage() {
    const [loading, setLoading] = useState(true)
    const [bets, setBets] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'open' | 'history'>('open')

    useEffect(() => {
        getUserBets().then((res: any) => {
            if (res.success) setBets(res.bets || [])
            setLoading(false)
        })
    }, [])

    const filteredBets = bets.filter(b => {
        if (activeTab === 'open') return b.status === 'pending'
        return ['won', 'lost'].includes(b.status)
    })

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto py-4">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/account" className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-all">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white mb-1">My Bets</h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Track your predictions</p>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Tabs */}
                <div className="flex p-1 bg-slate-900 border border-white/5 rounded-2xl w-full max-w-md mx-auto mb-4">
                    <button
                        onClick={() => setActiveTab('open')}
                        className={cn(
                            "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                            activeTab === 'open' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Open Bets
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                            activeTab === 'history' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Bet History
                    </button>
                </div>

                {filteredBets.length > 0 ? (
                    <div className="space-y-4">
                        {filteredBets.map((bet) => (
                            <div key={bet.id} className="group bg-slate-900/40 border border-white/5 hover:border-white/10 p-6 rounded-3xl transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                bet.status === 'won' ? 'bg-emerald-500' :
                                                    bet.status === 'pending' ? 'bg-amber-500 animate-pulse' :
                                                        'bg-red-500'
                                            )} />
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">
                                                {bet.status} • {new Date(bet.createdAt).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {(bet.selections as any[]).map((sel, idx) => (
                                                <p key={idx} className="text-sm font-bold text-slate-200">
                                                    {sel.matchLabel} • <span className="text-purple-400">{sel.label}</span>
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 text-right self-end md:self-center">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Stake</p>
                                            <p className="text-sm font-black text-white">GHS {bet.stake?.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">
                                                {bet.status === 'won' ? 'Payout' : 'Potential'}
                                            </p>
                                            <p className={cn(
                                                "text-sm font-black",
                                                bet.status === 'won' ? 'text-emerald-400' : 'text-slate-200'
                                            )}>
                                                GHS {bet.potentialPayout?.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center border border-dashed border-white/5 rounded-[2.5rem]">
                        <History className="h-10 w-10 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                            {activeTab === 'open' ? 'No active bets.' : 'No betting history found.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

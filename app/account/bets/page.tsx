"use client"

import { useState, useEffect } from "react"
import { Trophy, History, Loader2, Search } from "lucide-react"
import { getUserBets } from "@/lib/user-actions"
import { cn } from "@/lib/utils"

export default function BetsPage() {
    const [loading, setLoading] = useState(true)
    const [bets, setBets] = useState<any[]>([])

    useEffect(() => {
        getUserBets().then((res: any) => {
            if (res.success) setBets(res.bets || [])
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto py-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white mb-1">Betting History</h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Live & Settled Predictions</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-white/5 rounded-full px-4 py-2 opacity-50">
                    <Search className="h-3 w-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Search History</span>
                </div>
            </div>

            {bets.length > 0 ? (
                <div className="space-y-4">
                    {bets.map((bet) => (
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
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No predictions found in your history.</p>
                </div>
            )}
        </div>
    )
}

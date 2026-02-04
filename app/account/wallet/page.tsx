"use client"

import { useState, useEffect } from "react"
import {
    Wallet as WalletIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    Loader2,
    CheckCircle2,
    CreditCard
} from "lucide-react"
import { getUserWalletDetails } from "@/lib/user-actions"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function WalletPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        getUserWalletDetails().then((res: any) => {
            if (res.success) setData(res)
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
        </div>
    )

    if (!data) return <div className="p-8 text-center text-slate-500">Failed to load wallet.</div>

    const { wallet, transactions } = data

    return (
        <div className="max-w-4xl mx-auto py-4">
            {/* Balance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Main Cash Balance */}
                <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 space-y-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[80px] group-hover:bg-purple-600/20 transition-all" />
                    <div className="space-y-1 relative">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Balance (Cash)</p>
                        <p className="text-4xl font-black text-white tracking-tighter">GHS {wallet.balance.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2 relative">
                        <Link href="/account/deposit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 active:scale-95">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Deposit
                        </Link>
                        <Link href="/account/withdraw" className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2 active:scale-95">
                            <ArrowDownLeft className="h-3.5 w-3.5 text-pink-400" />
                            Withdraw
                        </Link>
                    </div>
                </div>

                {/* Bonus Balance */}
                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-4 flex flex-col justify-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bonus Balance</p>
                            <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Non-Withdrawable</span>
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter">GHS {wallet.bonusBalance.toFixed(2)}</p>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest">Wager bonus funds to convert to cash</p>
                </div>

                {/* Locked Balance */}
                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-4 flex flex-col justify-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Locked Balance</p>
                            <Clock className="h-3 w-3 text-amber-500" />
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter">GHS {wallet.lockedBalance.toFixed(2)}</p>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest">Funds pending withdrawal or turnover</p>
                </div>
            </div>

            {/* Transaction Ledger */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Recent Transactions
                    </h3>
                </div>

                {transactions.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {transactions.map((txn: any) => (
                            <div key={txn.id} className="py-6 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                        txn.type === 'deposit' || txn.type === 'bet_payout' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                    )}>
                                        {txn.type === 'deposit' ? <ArrowUpRight className="h-5 w-5" /> :
                                            txn.type === 'bet_payout' ? <Trophy className="h-4 w-4" /> :
                                                <CreditCard className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-200 capitalize">{txn.type.replace('_', ' ')}</p>
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                            {new Date(txn.createdAt).toLocaleDateString('en-GB')} • Ref: {txn.id.slice(-6).toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-sm font-black",
                                        txn.type === 'deposit' || txn.type === 'bet_payout' ? 'text-emerald-400' : 'text-slate-200'
                                    )}>
                                        {txn.type === 'deposit' || txn.type === 'bet_payout' ? '+' : '-'} GHS {txn.amount.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                        Bal: {txn.balanceAfter.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center bg-slate-900/10 rounded-3xl border border-dashed border-white/5">
                        <WalletIcon className="h-10 w-10 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No transaction history available.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function Trophy({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}

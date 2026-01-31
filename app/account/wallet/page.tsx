"use client"

import { Smartphone, Wallet as WalletIcon, Banknote, ArrowUpRight, ArrowDownLeft, History, Clock, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { getUserWalletBalance } from "@/lib/wallet-actions"

export default function WalletPage() {
    const { data: session } = useSession()
    const [balances, setBalances] = useState({ balance: 0, bonusBalance: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBalance = async () => {
            const data = await getUserWalletBalance()
            setBalances(data)
            setLoading(false)
        }
        fetchBalance()
    }, [])

    return (
        <div className="space-y-8 pb-10">
            {/* Header with Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black mb-1">Wallet Overview</h2>
                    <p className="text-slate-400 font-medium">Manage your funds and track transactions</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/account/deposit" className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5" />
                        DEPOSIT
                    </Link>
                    <Link href="/account/withdraw" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all flex items-center gap-2">
                        <ArrowDownLeft className="h-5 w-5 text-pink-400" />
                        WITHDRAW
                    </Link>
                </div>
            </div>

            {/* Balance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-[2rem] border border-white/5 shadow-2xl group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <WalletIcon className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Main Wallet</p>
                        <h2 className="text-5xl font-mono font-black tracking-tight text-white">
                            {loading ? "..." : `GHS ${balances.balance.toFixed(2)}`}
                        </h2>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-950 p-8 rounded-[2rem] border border-purple-500/10 shadow-2xl group">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity">
                        <Smartphone className="w-24 h-24 text-purple-400" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <p className="text-xs font-black text-purple-400/60 uppercase tracking-[0.2em]">Bonus Balance</p>
                        <h2 className="text-5xl font-mono font-black tracking-tight text-white">
                            {loading ? "..." : `GHS ${balances.bonusBalance.toFixed(2)}`}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Deposits", value: "GHS 0.00", icon: ArrowUpRight, color: "text-green-400" },
                    { label: "Total Winnings", value: "GHS 0.00", icon: Trophy, color: "text-yellow-400" },
                    { label: "Pending Withdraws", value: "GHS 0.00", icon: Clock, color: "text-blue-400" },
                    { label: "Referral Earned", value: "GHS 0.00", icon: Banknote, color: "text-purple-400" },
                ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
                            <Icon className={cn("h-5 w-5 mb-3", stat.color)} />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-lg font-black text-white">{stat.value}</p>
                        </div>
                    )
                })}
            </div>

            {/* Transaction History Heading */}
            <div className="pt-8 border-t border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                            <History className="h-5 w-5 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-black">Transaction History</h3>
                    </div>
                    <button className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                        View All
                    </button>
                </div>

                {/* Empty State */}
                <div className="p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                        <Clock className="h-8 w-8 text-slate-600" />
                    </div>
                    <div className="max-w-xs space-y-1">
                        <p className="text-white font-black">No transactions yet</p>
                        <p className="text-sm text-slate-500 font-medium">Your deposits, withdrawals, and winnings will appear here.</p>
                    </div>
                    <Link href="/account/deposit" className="text-sm font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest">
                        Make your first deposit
                    </Link>
                </div>
            </div>
        </div>
    )
}

// Fixed imports and added Trophy which was missing
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

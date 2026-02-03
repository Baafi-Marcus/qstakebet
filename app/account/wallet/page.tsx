"use client"

import { Smartphone, Wallet as WalletIcon, Banknote, ArrowUpRight, ArrowDownLeft, History, Clock } from "lucide-react"
import Link from "next/link"

import { useEffect, useState } from "react"
import { getUserWalletBalance } from "@/lib/wallet-actions"

export default function WalletPage() {

    // const { data: session } = useSession()
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

            {/* Balance Overview - Flat */}
            <div className="border-b border-white/10 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Main Wallet</p>
                        <h2 className="text-5xl font-mono font-black text-white tracking-tighter">
                            {loading ? "..." : `GHS ${balances.balance.toFixed(2)}`}
                        </h2>
                    </div>
                    <div>
                        <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">Bonus Balance</p>
                        <h2 className="text-5xl font-mono font-black text-white tracking-tighter">
                            {loading ? "..." : `GHS ${balances.bonusBalance.toFixed(2)}`}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Quick Stats - Text Only Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-b border-white/10 pb-8">
                {[
                    { label: "Total Deposits", value: "GHS 0.00", icon: ArrowUpRight, color: "text-green-500" },
                    { label: "Total Winnings", value: "GHS 0.00", icon: Trophy, color: "text-yellow-500" },
                    { label: "Pending Withdraws", value: "GHS 0.00", icon: Clock, color: "text-blue-500" },
                    { label: "Referral Earned", value: "GHS 0.00", icon: Banknote, color: "text-purple-500" },
                ].map((stat, i) => {
                    return (
                        <div key={i} className="py-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                {stat.label}
                            </p>
                            <p className={cn("text-xl font-black", stat.color)}>{stat.value}</p>
                        </div>
                    )
                })}
            </div>

            {/* Transaction History Heading */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black">Transaction History</h3>
                    <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                        View All
                    </button>
                </div>

                {/* Empty State - Minimal */}
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="max-w-xs space-y-1">
                        <p className="text-white font-bold text-sm">No recent transactions</p>
                        <p className="text-xs text-slate-500">Your activity will appear here.</p>
                    </div>
                    <Link href="/account/deposit" className="text-xs font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest mt-2">
                        Make a deposit
                    </Link>
                </div>
            </div>
        </div>
    )
}

// Fixed imports and added Trophy which was missing
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

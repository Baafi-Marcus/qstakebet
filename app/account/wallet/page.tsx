"use client"

import { useSession } from "next-auth/react"
import { Wallet, ArrowDownCircle, ArrowUpCircle, History, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function WalletPage() {
    const { data: session } = useSession()

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black mb-2">Wallet & Balance</h2>
                    <p className="text-slate-400 font-medium">Manage your funds, deposits, and withdrawals</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/account/deposit" className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5" />
                        DEPOSIT
                    </Link>
                    <Link href="/account/withdraw" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all flex items-center gap-2">
                        <ArrowDownCircle className="h-5 w-5 text-pink-400" />
                        WITHDRAW
                    </Link>
                </div>
            </div>

            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
                    <div className="flex items-center gap-3 text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">
                        <Wallet className="h-4 w-4 text-purple-400" />
                        Main Wallet
                    </div>
                    <div className="text-5xl font-black text-white mb-2">GHS 0.00</div>
                    <p className="text-slate-500 font-medium">Available for betting and withdrawal</p>
                </div>

                <div className="p-10 bg-slate-900/50 rounded-[2.5rem] border border-white/5 relative overflow-hidden border-dashed group">
                    <div className="flex items-center gap-3 text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">
                        <History className="h-4 w-4 text-pink-400" />
                        Bonus Balance
                    </div>
                    <div className="text-5xl font-black text-slate-400 mb-2">GHS 0.00</div>
                    <p className="text-slate-500 font-medium font-mono">Use for bonus-eligible games</p>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="font-bold text-indigo-200">Payment Notice</h4>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Instant deposits are supported for MTN MoMo, Telecel Cash, and AT Money via Moolre.
                        Withdrawals are typically processed within 24 hours to your registered mobile number.
                    </p>
                </div>
            </div>

            {/* Transactions */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Recent Transactions</h3>
                    <button className="text-purple-400 font-bold hover:text-purple-300 transition-colors">View All</button>
                </div>

                <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 divide-y divide-white/5 overflow-hidden">
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History className="h-8 w-8 text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-bold">No transactions found</p>
                        <p className="text-slate-600 text-sm mt-1">Your deposits and withdrawals will appear here</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

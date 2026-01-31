"use client"

import { useSession } from "next-auth/react"
import { Trophy, History, ArrowRight, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function BetsPage() {
    const { data: session } = useSession()

    return (
        <div className="space-y-12">
            <div>
                <h2 className="text-3xl font-black mb-2">My Betting History</h2>
                <p className="text-slate-400 font-medium">View and track your previous and active bets</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
                <button className="px-6 py-2 bg-purple-600 rounded-xl text-sm font-black transition-all">ALL BETS</button>
                <button className="px-6 py-2 hover:bg-white/5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all tracking-wider">OPEN</button>
                <button className="px-6 py-2 hover:bg-white/5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all tracking-wider">SETTLED</button>
            </div>

            {/* Bets List Placeholder */}
            <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 divide-y divide-white/5 overflow-hidden">
                <div className="p-20 text-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="h-10 w-10 text-slate-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">No Bets Found</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                        It looks like you haven't placed any bets yet. Browse our top matches and start betting!
                    </p>
                    <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-purple-500/20 group">
                        EXPLORE MATCHES
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Total Staked</p>
                    <p className="text-3xl font-black">GHS 0.00</p>
                </div>
                <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Total Returned</p>
                    <p className="text-3xl font-black text-green-400">GHS 0.00</p>
                </div>
                <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Net Profit/Loss</p>
                    <p className="text-3xl font-black text-purple-400">GHS 0.00</p>
                </div>
            </div>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import {
    Eye,
    EyeOff,
    Settings,
    ChevronRight,
    Wallet,
    History,
    ArrowRightLeft,
    Gift,
    Loader2,
    ArrowUpFromLine,
    LogOut,
    HelpCircle,
    BookOpen,
    MessageSquare
} from "lucide-react"
import { getUserProfileSummary } from "@/lib/user-actions"
import Link from "next/link"

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [showBalance, setShowBalance] = useState(true)

    const [bonusCount, setBonusCount] = useState(0)

    useEffect(() => {
        getUserProfileSummary().then((res: any) => {
            if (res.success) setData(res)
        })
        import("@/lib/user-actions").then(m => m.getUserBonusesCount()).then(res => {
            if (res.success) setBonusCount(res.count)
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
        </div>
    )

    if (!data) return <div className="p-8 text-center text-slate-500">Failed to load profile.</div>

    const { user, balance, bonusBalance } = data

    return (
        <div className="max-w-md mx-auto bg-[#1a1c23] text-white min-h-[500px] rounded-3xl overflow-hidden shadow-2xl">
            {/* Header Section */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <Link href="/account/settings" className="flex items-center gap-3 group">
                        <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                            {user.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-xl font-bold">
                                    {user.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tight leading-tight">{user.name}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.phone || user.email}</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                    </Link>
                    <Link href="/account/settings" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <Settings className="h-7 w-7 text-slate-300" />
                    </Link>
                </div>
            </div>

            {/* Balance Card */}
            <div className="px-6 pb-8">
                <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-1">Total Balance</p>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-3xl font-black text-white tracking-tight">
                                        {showBalance ? `GHS ${balance.toFixed(2)}` : '••••••'}
                                    </h2>
                                    <button
                                        onClick={() => setShowBalance(!showBalance)}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-purple-200"
                                    >
                                        {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href="/account/deposit"
                                className="flex items-center justify-center gap-2 bg-white text-purple-900 py-3 rounded-xl font-black text-sm uppercase hover:bg-slate-200 transition-colors shadow-lg shadow-black/20"
                            >
                                <Wallet className="h-4 w-4" />
                                Deposit
                            </Link>
                            <Link
                                href="/account/withdraw"
                                className="flex items-center justify-center gap-2 bg-purple-800/50 text-white border border-purple-400/30 py-3 rounded-xl font-black text-sm uppercase hover:bg-purple-800 transition-colors"
                            >
                                <ArrowUpFromLine className="h-4 w-4" />
                                Withdraw
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Grid */}
            <div className="bg-[#121418] rounded-t-[2.5rem] border-t border-white/5 pb-10">
                <div className="grid grid-cols-3 gap-y-8 py-8 px-2">
                    <NavButton
                        href="/account/bets"
                        icon={History}
                        label="Bet History"
                    />
                    <NavButton
                        href="/account/wallet"
                        icon={ArrowRightLeft}
                        label="Transactions"
                    />
                    <NavButton
                        href="/account/bonuses"
                        icon={Gift}
                        label={`Gifts (${bonusCount})`}
                    />

                    <NavButton
                        href="/help"
                        icon={HelpCircle}
                        label="Help Center"
                    />
                    <NavButton
                        href="/how-to-play"
                        icon={BookOpen}
                        label="How to Play"
                    />
                    <a
                        href="https://wa.me/233276019798"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-3 group px-2"
                    >
                        <div className="h-10 w-10 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 transition-colors bg-emerald-500/10 rounded-full">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-100 text-center leading-tight uppercase tracking-tight">
                            Support
                        </span>
                    </a>
                </div>

                {/* Logout Button */}
                <div className="px-6 mt-2">
                    <button
                        onClick={() => import("next-auth/react").then(m => m.signOut({ callbackUrl: "/" }))}
                        className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl transition-all border border-red-500/10 font-black text-xs uppercase tracking-widest group"
                    >
                        <LogOut className="h-4 w-4 transition-transform group-hover:rotate-12" />
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    )
}

function NavButton({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center gap-3 group px-2">
            <div className="h-10 w-10 flex items-center justify-center text-slate-200 group-hover:text-white transition-colors">
                <Icon className="h-8 w-8" />
            </div>
            <span className="text-[11px] font-bold text-slate-100 text-center leading-tight uppercase tracking-tight">
                {label}
            </span>
        </Link>
    )
}

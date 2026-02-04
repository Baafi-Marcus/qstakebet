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
    ArrowUpFromLine
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
                <div className="flex items-center justify-between mb-8">
                    <Link href="/account/settings" className="flex items-center gap-3 group">
                        <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                            {user.image ? (
                                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-xl font-bold">
                                    {user.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xl font-bold tracking-tight">{user.name}</span>
                            <ChevronRight className="h-6 w-6 text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                    </Link>
                    <Link href="/account/settings" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <Settings className="h-7 w-7 text-slate-200" />
                    </Link>
                </div>

                {/* Balance Section */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 text-slate-200">
                        <button onClick={() => setShowBalance(!showBalance)} className="p-1 hover:bg-white/5 rounded">
                            {showBalance ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
                        </button>
                        <span className="text-lg font-medium">Total Balance</span>
                    </div>
                    <div className="text-2xl font-black tracking-tight">
                        GHS {showBalance ? (balance || 0).toFixed(2) : "****"}
                    </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <Link href="/account/deposit" className="flex items-center justify-center gap-3 bg-[#1ca13e] hover:bg-[#158030] py-5 px-4 rounded-xl transition-all active:scale-[0.98]">
                        <Wallet className="h-8 w-8" />
                        <span className="text-xl font-extrabold uppercase tracking-tight">Deposit</span>
                    </Link>
                    <Link href="/account/withdraw" className="flex items-center justify-center gap-3 bg-[#1ca13e] hover:bg-[#158030] py-5 px-4 rounded-xl transition-all active:scale-[0.98]">
                        <div className="relative">
                            <Wallet className="h-8 w-8 opacity-40" />
                            <ArrowUpFromLine className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                        </div>
                        <span className="text-xl font-extrabold uppercase tracking-tight">Withdraw</span>
                    </Link>
                </div>
            </div>

            {/* Navigation Grid */}
            <div className="bg-[#121418] grid grid-cols-3 py-10 px-2 rounded-t-[2.5rem] border-t border-white/5">
                <NavButton
                    href="/account/bets"
                    icon={History}
                    label="Sports Bet History"
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

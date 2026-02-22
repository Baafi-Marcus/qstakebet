"use client"

import { Gift, Zap, Users, Trophy, Star, ArrowRight, ArrowLeft, Loader2, Copy, Check } from "lucide-react"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import { getUserOffersAndBonuses } from "@/lib/referral-actions"
import { cn } from "@/lib/utils"

export default function BonusesPage() {
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [data, setData] = useState<{
        referralCode: string;
        loyaltyPoints: number;
        bonuses: any[];
        referralStats: { totalCount: number, totalEarned: number }
    } | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const res = await getUserOffersAndBonuses()
            if (res.success) {
                setData({
                    referralCode: res.referralCode || "NONE",
                    loyaltyPoints: res.loyaltyPoints || 0,
                    bonuses: res.bonuses || [],
                    referralStats: res.referralStats || { totalCount: 0, totalEarned: 0 }
                })
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleCopy = () => {
        if (!data?.referralCode) return
        navigator.clipboard.writeText(data.referralCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Loading Rewards...</p>
            </div>
        )
    }

    const BONUS_STYLES: Record<string, any> = {
        welcome: { icon: Zap, color: "from-amber-400 to-orange-500", label: "Welcome Bonus" },
        deposit: { icon: Star, color: "from-blue-400 to-indigo-500", label: "Deposit Match" },
        referral: { icon: Users, color: "from-purple-400 to-pink-500", label: "Referral Reward" },
        referral_clicks: { icon: Trophy, color: "from-emerald-400 to-teal-500", label: "Link Click Bonus" },
        free_bet: { icon: Gift, color: "from-red-400 to-rose-500", label: "Free Bet" }
    }

    return (
        <div className="space-y-12">
            <div className="flex items-center gap-4">
                <Link href="/account" className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-all">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h2 className="text-3xl font-black mb-2">My Offers & Bonuses</h2>
                    <p className="text-slate-400 font-medium">Redeem rewards, manage bonuses, and earn from referrals</p>
                </div>
            </div>

            {/* Referral Banner */}
            <div className="p-10 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Users className="h-32 w-32 text-white" />
                </div>
                <div className="relative z-10 max-w-lg">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-6">
                        REFER & EARN
                    </div>
                    <h3 className="text-3xl font-black text-white mb-4">Invite friends and get GHS 20.00!</h3>
                    <p className="text-purple-100 font-medium mb-8 leading-relaxed">
                        Share your unique referral code with friends. When they sign up and make their first deposit, you both get rewarded.
                    </p>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 font-mono font-black text-xl flex items-center justify-between text-white">
                            <span className="tracking-tighter">{data?.referralCode}</span>
                            <button
                                onClick={handleCopy}
                                className={cn("transition-all text-sm font-black flex items-center gap-2", copied ? "text-green-400" : "text-purple-400 hover:text-white")}
                            >
                                {copied ? <><Check className="h-4 w-4" /> COPIED</> : <><Copy className="h-4 w-4" /> COPY</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Bonuses */}
            <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-pink-500" />
                    Available Bonuses ({data?.bonuses.length || 0})
                </h3>

                {data?.bonuses.length === 0 ? (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-12 flex flex-col items-center text-center gap-4">
                        <Zap className="h-12 w-12 text-slate-700" />
                        <div>
                            <p className="text-white font-black text-lg">No active bonuses</p>
                            <p className="text-slate-500 text-sm font-medium">Keep playing or refer friends to unlock rewards!</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {data?.bonuses.map((bonus) => {
                            const style = BONUS_STYLES[bonus.type] || BONUS_STYLES.free_bet
                            return (
                                <div key={bonus.id} className="bg-slate-900/50 rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden flex flex-col items-start hover:border-white/10 transition-all">
                                    <div className={`p-4 bg-gradient-to-br ${style.color} rounded-2xl mb-6 shadow-lg shadow-orange-500/10`}>
                                        <style.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="text-2xl font-black mb-1">{style.label}</div>
                                    <p className="text-slate-400 text-sm font-medium mb-8">
                                        {bonus.type === "referral_clicks" ? "Reward for link clicks." : "Reward for participation."}
                                        {bonus.expiresAt && ` Expires: ${new Date(bonus.expiresAt).toLocaleDateString()}`}
                                    </p>

                                    <div className="mt-auto w-full pt-6 border-t border-white/5 flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bonus Value</p>
                                            <p className="text-2xl font-black text-white">GHS {bonus.amount.toFixed(2)}</p>
                                        </div>
                                        <Link href="/" className="bg-white text-black font-black px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                                            USE NOW
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Progress / History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem]">
                    <h4 className="font-bold flex items-center gap-2 mb-4">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        Referral Stats
                    </h4>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-3xl font-black">{data?.referralStats.totalCount}</p>
                            <p className="text-slate-500 text-sm font-bold">Total Referrals</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-green-400">GHS {data?.referralStats.totalEarned.toFixed(2)}</p>
                            <p className="text-slate-500 text-sm font-bold">Earned Rewards</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem]">
                    <h4 className="font-bold flex items-center gap-2 mb-4">
                        <Star className="h-4 w-4 text-purple-500" />
                        Points System
                    </h4>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-black">{data?.loyaltyPoints}</p>
                            <p className="text-slate-500 text-sm font-bold">Loyalty Points</p>
                        </div>
                        <button className="text-purple-400 hover:text-white transition-colors text-sm font-black flex items-center gap-1">
                            HOW TO EARN <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

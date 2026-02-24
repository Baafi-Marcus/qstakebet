"use client"

import { Gift, Zap, Users, Trophy, Star, ArrowRight, ArrowLeft, Loader2, Copy, Check, X, Info, Share2, Target } from "lucide-react"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import { getUserOffersAndBonuses } from "@/lib/referral-actions"
import { cn } from "@/lib/utils"

export default function BonusesPage() {
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [showEarnModal, setShowEarnModal] = useState(false)
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
        const link = `${window.location.origin}/r/${data.referralCode}`
        navigator.clipboard.writeText(link)
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

            {/* Referral Banner - Refined to match Success Popup */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[80px] -ml-32 -mb-32" />

                <div className="relative z-10 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                                <Share2 className="h-3 w-3" /> Referral Program
                            </div>
                            <h3 className="text-4xl font-black text-white tracking-tighter uppercase">Invite & Win GHS 10.00</h3>
                            <p className="text-slate-400 font-medium max-w-sm">Share your link and get credited for every friend who joins and plays.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                <div className="p-2 w-fit rounded-lg bg-green-500/10 text-green-400"><Users className="h-4 w-4" /></div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Registration</div>
                                <div className="text-sm font-black text-white">GHS 1.00</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400"><Target className="h-4 w-4" /></div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Engagement</div>
                                <div className="text-sm font-black text-white">X10 Points</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Your Unique Referral Link</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 font-mono font-black text-sm text-slate-300 truncate flex items-center">
                                {typeof window !== "undefined" ? `${window.location.origin}/r/${data?.referralCode}` : `.../r/${data?.referralCode}`}
                            </div>
                            <button
                                onClick={handleCopy}
                                className={cn(
                                    "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2",
                                    copied ? "bg-green-600 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"
                                )}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? "Copied" : "Copy Link"}
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

                                    <div className="mt-auto w-full pt-6 border-t border-white/5 space-y-4">
                                        {bonus.initialAmount > bonus.amount && (
                                            <div className="w-full space-y-1.5">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-slate-500">Usage Progress</span>
                                                    <span className="text-purple-400">GHS {(bonus.initialAmount - bonus.amount).toFixed(2)} / {bonus.initialAmount.toFixed(2)} used</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                                                        style={{ width: `${((bonus.initialAmount - bonus.amount) / bonus.initialAmount) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Available Balance</p>
                                                <p className="text-2xl font-black text-white">GHS {bonus.amount.toFixed(2)}</p>
                                            </div>
                                            <Link href="/" className="bg-white text-black font-black px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                                                USE NOW
                                            </Link>
                                        </div>
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
                        <button
                            onClick={() => setShowEarnModal(true)}
                            className="text-purple-400 hover:text-white transition-colors text-sm font-black flex items-center gap-1"
                        >
                            HOW TO EARN <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* How to Earn Modal */}
            {showEarnModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEarnModal(false)} />
                    <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setShowEarnModal(false)}
                            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X className="h-6 w-6 text-slate-400" />
                        </button>

                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="p-6 bg-purple-500/10 rounded-3xl">
                                <Star className="h-12 w-12 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black mb-2">Earn Loyalty Points</h3>
                                <p className="text-slate-400 font-medium">Accumulate points by participating and win big!</p>
                            </div>

                            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="p-2 w-fit rounded-xl bg-green-500/10 text-green-400">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Active Play</div>
                                        <div className="text-sm font-black text-white">+1 Point</div>
                                        <div className="text-[10px] text-slate-500 font-medium">Per GHS 50.00 wagered</div>
                                    </div>
                                </div>
                                <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="p-2 w-fit rounded-xl bg-blue-500/10 text-blue-400">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Referrals</div>
                                        <div className="text-sm font-black text-white">+10 Points</div>
                                        <div className="text-[10px] text-slate-500 font-medium">Per verified friend</div>
                                    </div>
                                </div>
                                <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="p-2 w-fit rounded-xl bg-amber-500/10 text-amber-400">
                                        <Target className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Big Wins</div>
                                        <div className="text-sm font-black text-white">+5 Points</div>
                                        <div className="text-[10px] text-slate-500 font-medium">For winning bets over GHS 100</div>
                                    </div>
                                </div>
                                <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="p-2 w-fit rounded-xl bg-purple-500/10 text-purple-400">
                                        <Trophy className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Tournaments</div>
                                        <div className="text-sm font-black text-white">+20 Points</div>
                                        <div className="text-[10px] text-slate-500 font-medium">Entry into weekly cups</div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full p-6 bg-purple-600/10 rounded-2xl border border-purple-500/20 text-left flex items-start gap-4">
                                <Info className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-purple-200 leading-relaxed font-medium">
                                    Loyalty points can be redeemed for **Free Bets**, **Real Cash**, or **Exclusive Tournaments**. The more you play, the higher your multiplier!
                                </p>
                            </div>

                            <button
                                onClick={() => setShowEarnModal(false)}
                                className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-lg"
                            >
                                GOT IT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

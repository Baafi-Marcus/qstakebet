"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Wallet, Trophy, Shield, Smartphone, Mail, Calendar, Ban, CheckCircle, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { getUserDetails, updateUserStatus } from "@/lib/admin-user-actions"
import { cn } from "@/lib/utils"

interface UserDetailData {
    user: {
        id: string
        name: string | null
        phone: string
        email: string
        status: string
        createdAt: Date
        wallet: {
            balance: number
            bonusBalance: number
        } | null
    }
    bets: {
        id: string
        status: string
        createdAt: Date
        stake: number
        potentialPayout: number
    }[]
    transactions: {
        id: string
        type: string
        createdAt: Date
        description: string | null
        provider: string | null
        amount: number
        status: string | null
    }[]
}

export default function UserDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [data, setData] = useState<UserDetailData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'bets' | 'transactions'>('bets')

    const loadData = React.useCallback(async () => {
        if (!id) return
        // No synchronous setLoading(true) here
        const result = await getUserDetails(id as string)
        if (result.success) {
            setData(result as unknown as UserDetailData)
        }
        setLoading(false)
    }, [id])

    useEffect(() => {
        let isMounted = true
        if (isMounted) {
            loadData()
        }
        return () => { isMounted = false }
    }, [loadData])

    const handleStatusToggle = React.useCallback(async () => {
        if (!data?.user) return
        setLoading(true) // Set loading in event handler
        const newStatus = (data.user.status === 'active' ? 'suspended' : 'active') as "active" | "suspended"
        const result = await updateUserStatus(data.user.id, newStatus)
        if (result.success) {
            loadData()
        } else {
            setLoading(false)
        }
    }, [data, loadData])

    if (loading) return <div className="p-12 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Loading Intelligence...</div>
    if (!data?.user) return <div className="p-12 text-center text-red-500 font-black uppercase tracking-widest">User Assets Not Found</div>

    const { user, bets, transactions } = data

    return (
        <div className="space-y-8 pb-20">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
            >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Directory</span>
            </button>

            {/* Profile Header */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-primary/20">
                            {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{user.name}</h1>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    user.status === 'active' ? "bg-green-500/10 text-green-400 border-green-500/10" : "bg-red-500/10 text-red-500 border-red-500/10"
                                )}>
                                    {user.status}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-6 text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold font-mono tracking-tight">{user.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold tracking-tight">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold tracking-tight uppercase">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleStatusToggle}
                            className={cn(
                                "flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl",
                                user.status === 'active'
                                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                    : "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
                            )}
                        >
                            {user.status === 'active' ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                            {user.status === 'active' ? "Suspend User" : "Activate User"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-accent/10 rounded-2xl">
                            <Wallet className="h-6 w-6 text-accent" />
                        </div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Real Balance</span>
                    </div>
                    <div className="text-3xl font-black text-white font-mono tracking-tighter">GHS {user.wallet?.balance?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-2xl">
                            <Shield className="h-6 w-6 text-purple-500" />
                        </div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Bonus Balance</span>
                    </div>
                    <div className="text-3xl font-black text-white font-mono tracking-tighter">GHS {user.wallet?.bonusBalance?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-green-500/10 rounded-2xl">
                            <Trophy className="h-6 w-6 text-green-500" />
                        </div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Bet Engagement</span>
                    </div>
                    <div className="text-3xl font-black text-white font-mono tracking-tighter">{bets.length} <span className="text-sm text-slate-500 font-bold ml-1 uppercase">Tickets</span></div>
                </div>
            </div>

            {/* Dynamic Content Tabs */}
            <div className="space-y-6">
                <div className="flex items-center gap-6 border-b border-white/5 px-2">
                    <button
                        onClick={() => setActiveTab('bets')}
                        className={cn(
                            "pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative",
                            activeTab === 'bets' ? "text-white" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Recent Bets
                        {activeTab === 'bets' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={cn(
                            "pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative",
                            activeTab === 'transactions' ? "text-white" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Wallet Flow
                        {activeTab === 'transactions' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                    </button>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                    {activeTab === 'bets' ? (
                        <div className="divide-y divide-white/5">
                            {bets.length === 0 ? (
                                <div className="p-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs">No Wagering History</div>
                            ) : bets.map((bet: { id: string, status: string, createdAt: Date, stake: number, potentialPayout: number }) => (
                                <div key={bet.id} className="p-8 hover:bg-white/[0.02] transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                                            bet.status === 'won' ? "bg-green-500/10" : bet.status === 'lost' ? "bg-red-500/10" : "bg-primary/10"
                                        )}>
                                            <Trophy className={cn("h-5 w-5", bet.status === 'won' ? "text-green-500" : bet.status === 'lost' ? "text-red-500" : "text-primary")} />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{new Date(bet.createdAt).toLocaleString()}</div>
                                            <div className="text-sm font-black text-white uppercase tracking-tighter">Ticket #{bet.id.split('-')[1]?.toUpperCase()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-16">
                                        <div className="text-right">
                                            <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Stake</div>
                                            <div className="text-sm font-black text-white font-mono">GHS {bet.stake.toFixed(2)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Return</div>
                                            <div className={cn("text-lg font-black font-mono tracking-tighter", bet.status === 'won' ? "text-accent" : "text-slate-700")}>
                                                GHS {bet.potentialPayout.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            bet.status === 'won' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                bet.status === 'lost' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                                        )}>
                                            {bet.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {transactions.length === 0 ? (
                                <div className="p-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs">No Movement in Wallet</div>
                            ) : transactions.map((tx: { id: string, type: string, createdAt: Date, description: string | null, provider: string | null, amount: number, status: string | null }) => (
                                <div key={tx.id} className="p-8 hover:bg-white/[0.02] transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                                            tx.type === 'deposit' || tx.type === 'win' ? "bg-green-500/10" : "bg-red-500/10"
                                        )}>
                                            {tx.type === 'deposit' || tx.type === 'win' ? <ArrowDownLeft className="h-5 w-5 text-green-500" /> : <ArrowUpRight className="h-5 w-5 text-red-500" />}
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{new Date(tx.createdAt).toLocaleString()}</div>
                                            <div className="text-sm font-black text-white uppercase tracking-tight">{tx.description}</div>
                                            <div className="text-[9px] font-bold text-slate-600">{tx.provider || 'System Internal'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn(
                                            "text-xl font-black font-mono tracking-tighter",
                                            tx.type === 'deposit' || tx.type === 'win' ? "text-green-400" : "text-red-400"
                                        )}>
                                            {tx.type === 'deposit' || tx.type === 'win' ? "+" : "-"} GHS {tx.amount.toFixed(2)}
                                        </div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{tx.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeftIcon as ChevronLeft, TrophyIcon as Trophy, ShieldCheckIcon as Shield, DevicePhoneMobileIcon as Smartphone, EnvelopeIcon as Mail, CalendarIcon as Calendar, NoSymbolIcon as Ban, CheckCircleIcon as CheckCircle } from "@heroicons/react/24/solid";
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
        lifetimePoints: number
    }
    predictions: {
        id: string
        status: string
        createdAt: Date
    }[]
}

export default function UserDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [data, setData] = useState<UserDetailData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        const fetchData = async () => {
            if (!id) return
            const result = await getUserDetails(id as string)
            if (isMounted) {
                if (result.success) {
                    setData(result as unknown as UserDetailData)
                }
                setLoading(false)
            }
        }
        fetchData()
        return () => { isMounted = false }
    }, [id])

    const handleStatusToggle = React.useCallback(async () => {
        if (!data?.user) return
        setLoading(true)
        const newStatus = (data.user.status === 'active' ? 'suspended' : 'active') as "active" | "suspended"
        const result = await updateUserStatus(data.user.id, newStatus)
        if (result.success) {
            const refresh = await getUserDetails(data.user.id)
            if (refresh.success) {
                setData(refresh as unknown as UserDetailData)
            }
        }
        setLoading(false)
    }, [data])

    if (loading) return <div className="p-12 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Loading Intelligence...</div>
    if (!data?.user) return <div className="p-12 text-center text-red-500 font-black uppercase tracking-widest">User Not Found</div>

    const { user, predictions } = data

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-accent/10 rounded-2xl">
                            <Shield className="h-6 w-6 text-accent" />
                        </div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Lifetime Points</span>
                    </div>
                    <div className="text-3xl font-black text-white font-mono tracking-tighter">{user.lifetimePoints || 0} pts</div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-green-500/10 rounded-2xl">
                            <Trophy className="h-6 w-6 text-green-500" />
                        </div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Prediction Engagement</span>
                    </div>
                    <div className="text-3xl font-black text-white font-mono tracking-tighter">{predictions.length} <span className="text-sm text-slate-500 font-bold ml-1 uppercase">Tickets</span></div>
                </div>
            </div>

            {/* Dynamic Content */}
            <div className="space-y-6">
                <div className="flex items-center gap-6 border-b border-white/5 px-2">
                    <button
                        className="pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative text-white"
                    >
                        Recent Predictions
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                    </button>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="divide-y divide-white/5">
                        {predictions.length === 0 ? (
                            <div className="p-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs">No Prediction History</div>
                        ) : predictions.map((pred: { id: string, status: string, createdAt: Date }) => (
                            <div key={pred.id} className="p-8 hover:bg-white/[0.02] transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                                        pred.status === 'won' ? "bg-green-500/10" : pred.status === 'lost' ? "bg-red-500/10" : "bg-primary/10"
                                    )}>
                                        <Trophy className={cn("h-5 w-5", pred.status === 'won' ? "text-green-500" : pred.status === 'lost' ? "text-red-500" : "text-primary")} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{new Date(pred.createdAt).toLocaleString()}</div>
                                        <div className="text-sm font-black text-white uppercase tracking-tighter">Ticket #{pred.id.split('-')[1]?.toUpperCase()}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-16">
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                        pred.status === 'won' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                            pred.status === 'lost' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                                    )}>
                                        {pred.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

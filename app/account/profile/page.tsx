"use client"

import { useState, useEffect } from "react"
import {
    Mail,
    Phone,
    User,
    Calendar,
    Wallet,
    Loader2,
    Settings
} from "lucide-react"
import { getUserProfileSummary } from "@/lib/user-actions"

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        getUserProfileSummary().then((res: any) => {
            if (res.success) setData(res)
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
        </div>
    )

    if (!data) return <div className="p-8 text-center text-slate-500">Failed to load profile summary.</div>

    const { user, balance } = data

    return (
        <div className="max-w-2xl mx-auto py-4">
            {/* Minimal Header */}
            <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-12">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-black text-white">
                    {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white mb-1">{user.name}</h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Account Predictor</p>
                </div>
            </div>

            {/* Quality Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
                <InfoRow icon={Mail} label="Email Address" value={user.email} />
                <InfoRow icon={Calendar} label="Member Since" value={new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} />
                <InfoRow icon={Wallet} label="Main Balance" value={`GHS ${balance.toFixed(2)}`} highlight />
            </div>

            {/* Simple Actions */}
            <div className="mt-16 flex items-center gap-4 border-t border-white/5 pt-10">
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                    <Settings className="h-4 w-4" />
                    Security Settings
                </button>
            </div>
        </div>
    )
}

function InfoRow({ icon: Icon, label, value, highlight }: any) {
    return (
        <div className="flex gap-4">
            <div className="mt-1">
                <Icon className={`h-4 w-4 ${highlight ? 'text-purple-400' : 'text-slate-600'}`} />
            </div>
            <div>
                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
                <span className={`text-sm font-bold ${highlight ? 'text-purple-400' : 'text-slate-200'}`}>{value}</span>
            </div>
        </div>
    )
}

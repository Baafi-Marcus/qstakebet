"use client"

import { Trophy, Users, Calendar, Activity, TrendingUp, ShieldCheck } from "lucide-react"

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black text-white tracking-tight uppercase">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Platform Overview & Statistics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { label: "Active Tournaments", value: "12", icon: Trophy, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { label: "Total Schools", value: "148", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Pending Matches", value: "24", icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
                    { label: "Platform Margin", value: "10%", icon: ShieldCheck, color: "text-orange-500", bg: "bg-orange-500/10" },
                    { label: "Total Volume", value: "₵ 12,450", icon: TrendingUp, color: "text-pink-500", bg: "bg-pink-500/10" },
                    { label: "Upcoming Events", value: "8", icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-all">
                        <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform`}>
                            <stat.icon className={`h-24 w-24 ${stat.color}`} />
                        </div>
                        <div className="relative z-10">
                            <div className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-4">{stat.label}</div>
                            <div className="text-4xl font-black text-white tracking-tighter">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10">
                <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">System Health</h2>
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-sm font-bold text-slate-300">Database Connection</span>
                        <span className="text-xs font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 uppercase">Operational</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-sm font-bold text-slate-300">Odds Engine (Auto-Calc)</span>
                        <span className="text-xs font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 uppercase">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-sm font-bold text-slate-300">Virtual Simulation Service</span>
                        <span className="text-xs font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 uppercase">Synced</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

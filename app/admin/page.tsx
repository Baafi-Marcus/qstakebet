"use client"

import { Trophy, Users, Calendar, Activity, TrendingUp, ShieldCheck } from "lucide-react"

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight">System Status</h1>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-medium">Real-time Platform Metrics</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </span>
                </div>
            </div>

            {/* Dense Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active Tournaments", value: "12", icon: Trophy, color: "text-purple-400" },
                    { label: "Total Schools", value: "148", icon: Users, color: "text-blue-400" },
                    { label: "Pending Matches", value: "24", icon: Activity, color: "text-green-400" },
                    { label: "Platform Margin", value: "10.0%", icon: ShieldCheck, color: "text-orange-400" },
                    { label: "24h Volume", value: "₵ 12,450", icon: TrendingUp, color: "text-pink-400" },
                    { label: "Scheduled Events", value: "8", icon: Calendar, color: "text-indigo-400" },
                    { label: "User Online", value: "342", icon: Users, color: "text-teal-400" },
                    { label: "Server Load", value: "45%", icon: Activity, color: "text-red-400" },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-white/10 p-4 rounded-lg flex items-start justify-between hover:bg-white/5 transition-colors group">
                        <div>
                            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                            <div className="text-2xl font-mono font-bold text-white tracking-tight">{stat.value}</div>
                        </div>
                        <stat.icon className={`h-5 w-5 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                    </div>
                ))}
            </div>

            {/* System Health Table - Flat */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-white/10 rounded-lg">
                    <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                        <h2 className="text-xs font-black text-white uppercase tracking-widest">Service Status</h2>
                    </div>
                    <div>
                        {[
                            { name: "Database Connection", status: "Operational", color: "text-green-500" },
                            { name: "Odds Engine (Auto-Calc)", status: "Active", color: "text-blue-500" },
                            { name: "Virtual Simulation Service", status: "Synced (1s ago)", color: "text-green-500" },
                            { name: "Payment Gateway", status: "Standby", color: "text-yellow-500" },
                            { name: "SMS Notification Service", status: "Operational", color: "text-green-500" },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                <span className="text-xs font-bold text-slate-400 font-mono">{item.name}</span>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${item.color}`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-lg">
                    <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                        <h2 className="text-xs font-black text-white uppercase tracking-widest">Recent System Alerts</h2>
                    </div>
                    <div className="p-0">
                        {/* Empty State placeholder for logs */}
                        <div className="px-4 py-3 border-b border-white/5 flex items-start gap-3">
                            <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                            <div>
                                <p className="text-xs text-slate-300 font-mono">Backup completed successfully</p>
                                <p className="text-[10px] text-slate-600 font-bold uppercase mt-0.5">02:30 AM - System</p>
                            </div>
                        </div>
                        <div className="px-4 py-3 border-b border-white/5 flex items-start gap-3">
                            <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-yellow-500 flex-shrink-0"></div>
                            <div>
                                <p className="text-xs text-slate-300 font-mono">High latency detected on gh-west-1</p>
                                <p className="text-[10px] text-slate-600 font-bold uppercase mt-0.5">01:15 AM - Monitor</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

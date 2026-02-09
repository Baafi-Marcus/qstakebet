import { Trophy, Users, Calendar, Activity, TrendingUp, ShieldCheck, CreditCard } from "lucide-react"
import { getAdminAnalytics } from "@/lib/admin-analytics-actions"
import Link from "next/link"

export default async function AdminDashboardPage() {
    const data = await getAdminAnalytics()

    if (!data.success || !data.summary || !data.matchBreakdown) {
        return <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-3xl">System Intelligence Offline</div>
    }

    const { summary, matchBreakdown } = data

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
                    { label: "Active Tournaments", value: summary.totalTournaments.toString(), icon: Trophy, color: "text-purple-400", href: "/admin/tournaments" },
                    { label: "Total Schools", value: summary.totalSchools.toString(), icon: Users, color: "text-blue-400", href: "/admin/schools" },
                    { label: "Platform Profit", value: `₵ ${summary.estimatedProfit.toLocaleString()}`, icon: ShieldCheck, color: "text-orange-400", href: "/admin/analytics" },
                    { label: "24h Volume", value: `₵ ${summary.last24hVolume.toLocaleString()}`, icon: TrendingUp, color: "text-pink-400", href: "/admin/analytics" },
                    { label: "Total Users", value: summary.totalUsers.toString(), icon: Users, color: "text-teal-400", href: "/admin/users" },
                    { label: "Total Tickets", value: summary.totalBets.toString(), icon: Activity, color: "text-indigo-400", href: "/admin/matches/log" },
                    {
                        label: "Pending Payouts",
                        value: summary.pendingWithdrawals.toString(),
                        icon: CreditCard,
                        color: summary.pendingWithdrawals > 0 ? "text-red-400" : "text-green-400",
                        href: "/admin/withdrawals",
                        alert: summary.pendingWithdrawals > 0
                    },
                    { label: "Payout Ratio", value: `${summary.payoutRatio.toFixed(1)}%`, icon: Activity, color: "text-yellow-400", href: "/admin/analytics" },
                ].map((stat, i) => (
                    <Link
                        key={i}
                        href={stat.href}
                        className={`bg-slate-900 border ${stat.alert ? 'border-red-500/30' : 'border-white/10'} p-4 rounded-lg flex items-start justify-between hover:bg-white/5 transition-colors group cursor-pointer relative overflow-hidden`}
                    >
                        {stat.alert && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/1 blur-[40px] -mr-12 -mt-12" />}
                        <div>
                            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                            <div className="text-2xl font-mono font-bold text-white tracking-tight">{stat.value}</div>
                        </div>
                        <stat.icon className={`h-5 w-5 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                    </Link>
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
                            { name: "Payment Gateway", status: "Manual Mode", color: "text-purple-500" },
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
                        <h2 className="text-xs font-black text-white uppercase tracking-widest">Match Breakdown</h2>
                    </div>
                    <div className="p-0">
                        {matchBreakdown.length === 0 ? (
                            <div className="px-4 py-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">No match data available</div>
                        ) : matchBreakdown.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{item.status} Matches</span>
                                <span className="text-sm font-black text-white font-mono">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

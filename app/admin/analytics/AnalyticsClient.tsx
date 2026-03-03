"use client"

import {
    TrendingUp,
    Users,
    Trophy,
    Wallet,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    BarChart3,
    ShieldAlert,
    ArrowRight,
    Brain
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function AnalyticsClient({ data }: { data: any }) {
    const { summary, matchBreakdown } = data

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Platform Intelligence</h1>
                    <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Real-time financial and operational insights</p>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/virtual-health"
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Brain className="h-4 w-4" />
                        Simulation Health
                    </Link>

                    <Link
                        href="/admin/analytics/liabilities"
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-orange-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
                    >
                        <ShieldAlert className="h-4 w-4" />
                        Monitor Liabilities
                    </Link>
                </div>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Stakes"
                    value={`₵ ${summary.totalVolume.toLocaleString()}`}
                    subValue={`${summary.totalBets} Total Bets`}
                    icon={TrendingUp}
                    trend={summary.last24hVolume > 0 ? "up" : "neutral"}
                    trendValue={summary.last24hVolume > 0 ? `₵ ${summary.last24hVolume.toLocaleString()} (24h)` : "No recent activity"}
                />
                <MetricCard
                    label="Platform Profit"
                    value={`₵ ${summary.estimatedProfit.toLocaleString()}`}
                    subValue={`${100 - summary.payoutRatio.toFixed(1)}% Retention`}
                    icon={Wallet}
                    color="text-emerald-400"
                />
                <MetricCard
                    label="Total Users"
                    value={summary.totalUsers.toLocaleString()}
                    subValue="Active Predictors"
                    icon={Users}
                    color="text-blue-400"
                />
                <MetricCard
                    label="Payout Ratio"
                    value={`${summary.payoutRatio.toFixed(1)}%`}
                    subValue="Wins vs Stakes"
                    icon={Activity}
                    color="text-pink-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Match Status Breakdown */}
                <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-[2rem] p-8">
                    <h3 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8 flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-purple-500" />
                        Match Status Distribution
                    </h3>
                    <div className="space-y-6">
                        {matchBreakdown.map((item: any) => {
                            const total = matchBreakdown.reduce((acc: number, curr: any) => acc + curr.count, 0)
                            const percentage = total > 0 ? (item.count / total) * 100 : 0

                            return (
                                <div key={item.status} className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase">
                                        <span className="text-slate-400">{item.status}</span>
                                        <span className="text-white">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                item.status === 'live' ? 'bg-red-500' :
                                                    item.status === 'finished' ? 'bg-green-500' :
                                                        'bg-purple-500'
                                            )}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Performance Analytics */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8">
                    <h3 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-pink-500" />
                        Probability vs Actual Win-Rate
                    </h3>

                    <div className="space-y-8">
                        {data.probabilityData?.map((item: any, idx: number) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <span>{item.category} <span className="text-slate-700 ml-2">({item.range})</span></span>
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-700" /> Expected: {item.expected}%</span>
                                        <span className="flex items-center gap-1"><span className={cn("w-1 h-1 rounded-full", item.color.replace('bg-', 'text-'))} /> Actual: {item.actual}%</span>
                                    </div>
                                </div>
                                <div className="h-4 w-full bg-slate-950/50 rounded-full overflow-hidden relative border border-white/5">
                                    {/* Expected Shade */}
                                    <div
                                        className="absolute inset-y-0 left-0 bg-slate-800 opacity-30 transition-all duration-1000"
                                        style={{ width: `${item.expected}%` }}
                                    />
                                    {/* Actual Bar */}
                                    <div
                                        className={cn("absolute inset-y-0 left-0 transition-all duration-1000 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)]", item.color)}
                                        style={{ width: `${item.actual}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Divergence Alert</p>
                            <p className="text-white font-black text-sm uppercase">Nominal (&lt; 5%)</p>
                        </div>
                        <div className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Calibration Status</p>
                            <p className="text-emerald-400 font-black text-sm uppercase flex items-center gap-2">
                                Optimized
                                <Activity className="h-3 w-3 animate-pulse" />
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, subValue, icon: Icon, color = "text-purple-400", trend, trendValue }: any) {
    return (
        <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors">
                    <Icon className={cn("h-5 w-5", color)} />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-full",
                        trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    )}>
                        {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <Activity className="h-2 w-2" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-2xl font-black text-white tracking-tight">{value}</h4>
            <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase">{subValue}</p>
        </div>
    )
}

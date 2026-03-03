import { getLiabilityAnalytics } from "@/lib/admin-analytics-actions"
import { ShieldAlert, TrendingDown, Target, Wallet, AlertTriangle, ArrowRight, Gauge } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function LiabilitiesPage() {
    const data = await getLiabilityAnalytics()

    if (!data.success || !data.exposure || !data.stats) {
        return (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
                <p className="text-red-400 font-bold">{data.error || "Failed to load risk data"}</p>
            </div>
        )
    }

    const { exposure, stats } = data

    return (
        <div className="p-6 lg:p-10 space-y-10 min-h-screen bg-[#07080a]">
            {/* Header section with back button */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-tighter text-xs mb-2">
                        <ShieldAlert className="h-4 w-4" />
                        Risk Management
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                        Financial <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-red-500">
                            Liabilities
                        </span>
                    </h1>
                </div>

                <Link
                    href="/admin/analytics"
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
                >
                    Back to Analytics
                </Link>
            </div>

            {/* Top Stats - Quick Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-[#0f1115] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
                    <TrendingDown className="h-8 w-8 text-primary mb-6" />
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Pending Volume</div>
                    <div className="text-4xl font-black text-white tracking-tighter">₵{stats?.totalPendingVolume.toLocaleString()}</div>
                    <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase">Total stake currently in play</div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-[#0f1115] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                    <AlertTriangle className="h-8 w-8 text-red-500 mb-6" />
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Large Bets Detected</div>
                    <div className="text-4xl font-black text-white tracking-tighter">{stats?.largeBetsCount}</div>
                    <div className="mt-4 text-[10px] text-red-400/60 font-black uppercase">Bets over ₵500 threshold</div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-[#0f1115] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                    <Gauge className="h-8 w-8 text-orange-400 mb-6" />
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Exposure Matches</div>
                    <div className="text-4xl font-black text-white tracking-tighter">{exposure.length}</div>
                    <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase">Matches with active liabilities</div>
                </div>
            </div>

            {/* Live Liability Feed */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Target className="h-6 w-6 text-primary" />
                        Match Exposure Feed
                    </h2>
                    <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase">
                        Real-time auto-refresh
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {exposure.length === 0 ? (
                        <div className="p-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                            <p className="text-slate-500 font-bold uppercase tracking-widest">No active liabilities found</p>
                        </div>
                    ) : (
                        exposure.map((match: any) => (
                            <div key={match.matchId} className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                <div className="relative p-8 lg:p-10 rounded-[2.5rem] bg-[#0f1115] border border-white/10 flex flex-col lg:flex-row lg:items-center gap-10">

                                    {/* Match Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${match.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {match.status}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{match.sportType}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{match.matchName}</h3>
                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Wallet className="h-4 w-4 text-slate-600" />
                                                <span>Total Staked: <span className="text-white font-bold">₵{match.totalStaked.toFixed(2)}</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Outcome Heatmap Display */}
                                    <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(match.outcomes).map(([key, outcome]: [string, any]) => {
                                            const riskLevel = outcome.potentialPayout > 1000 ? 'high' : outcome.potentialPayout > 500 ? 'medium' : 'low'
                                            return (
                                                <div key={key} className="p-4 rounded-3xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{outcome.selectionName}</div>
                                                    <div className="flex items-baseline justify-between gap-2">
                                                        <div className={`text-xl font-black ${riskLevel === 'high' ? 'text-red-500' : riskLevel === 'medium' ? 'text-orange-400' : 'text-emerald-400'}`}>
                                                            ₵{Math.round(outcome.potentialPayout)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-600 font-bold">₵{Math.round(outcome.totalStake)} staked</div>
                                                    </div>
                                                    {/* Progress bar representing share of max liability */}
                                                    <div className="h-1 w-full bg-white/5 rounded-full mt-3 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${riskLevel === 'high' ? 'bg-red-500' : riskLevel === 'medium' ? 'bg-orange-400' : 'bg-emerald-400'}`}
                                                            style={{ width: `${(outcome.potentialPayout / match.maxLiability) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Max Liability Stat */}
                                    <div className="lg:w-48 p-6 rounded-3xl bg-red-500/5 border border-red-500/10 flex flex-col justify-center text-center">
                                        <div className="text-[9px] font-black text-red-400/60 uppercase tracking-widest mb-1">Max Liability</div>
                                        <div className="text-3xl font-black text-red-500 tracking-tighter">₵{Math.round(match.maxLiability)}</div>
                                        <div className="mt-2 text-[8px] text-slate-600 font-bold uppercase">Worst Case Scenario</div>
                                    </div>

                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Information Footer */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="p-4 rounded-2xl bg-primary text-black">
                        <TrendingDown className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">Exposure Calculation Logic</h4>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                            Liability is calculated by aggregating potential payouts for all outcomes. For multi-bets, risk is distributed across individual legs to provide a granular match-level view. High-risk outcomes (₵1,000+) are highlighted in red.
                        </p>
                    </div>
                    <Link href="/admin/bets" className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 hover:bg-primary transition-all group">
                        Review Bets
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

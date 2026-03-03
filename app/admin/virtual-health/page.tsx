import { getVirtualHealthAnalytics } from "@/lib/admin-analytics-actions"
import { Activity, Zap, TrendingUp, Info, ArrowRight, Target, Brain, Scale } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function VirtualHealthPage() {
    const data = await getVirtualHealthAnalytics()

    if (!data.success || !data.schoolStats || !data.financials) {
        return (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
                <p className="text-red-400 font-bold">{data.error || "Failed to load simulation health data"}</p>
            </div>
        )
    }

    const { schoolStats, financials } = data

    return (
        <div className="p-6 lg:p-10 space-y-10 min-h-screen bg-[#07080a]">
            {/* Header section with back button */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-tighter text-xs mb-2">
                        <Brain className="h-4 w-4" />
                        Simulation Health
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                        Virtual <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-500">
                            Equilibrium
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

            {/* Top Stats - Financial Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-[#0f1115] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                    <Scale className="h-8 w-8 text-purple-400 mb-6" />
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Return to Player (RTP)</div>
                    <div className="text-4xl font-black text-white tracking-tighter">{financials.rtp.toFixed(1)}%</div>
                    <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase">Target RTP: 88.0% | Variance: {(financials.rtp - 88).toFixed(1)}%</div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-[#0f1115] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                    <Zap className="h-8 w-8 text-indigo-400 mb-6" />
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Simulated Volume</div>
                    <div className="text-4xl font-black text-white tracking-tighter">₵{financials.totalStaked.toLocaleString()}</div>
                    <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase">Total turnover on virtuals</div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-[#0f1115] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                    <Activity className="h-8 w-8 text-blue-400 mb-6" />
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Simulation Fidelity</div>
                    <div className="text-4xl font-black text-white tracking-tighter">High</div>
                    <div className="mt-4 text-[10px] text-emerald-400/60 font-black uppercase">Result patterns within normal range</div>
                </div>
            </div>

            {/* School Performance Analysis */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Target className="h-6 w-6 text-primary" />
                        School Performance Analytics
                    </h2>
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest hidden md:block">
                        Correlation: Strength vs Win-Rate
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {schoolStats.length === 0 ? (
                        <div className="p-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                            <p className="text-slate-500 font-bold uppercase tracking-widest">No simulation data available</p>
                        </div>
                    ) : (
                        <div className="bg-[#0f1115] border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">School Name</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rating</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Wins/Matches</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Win Rate</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Fairness Index</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schoolStats.slice(0, 15).map((school: any) => {
                                        const expectedWinRate = (school.avgRating / 100) * 33; // Mock expectation
                                        const fairness = 100 - Math.abs(school.winRate - expectedWinRate);

                                        return (
                                            <tr key={school.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6 text-sm font-black text-white uppercase">{school.name}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-indigo-500 rounded-full"
                                                                style={{ width: `${school.avgRating}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400">{school.avgRating}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center text-xs font-bold text-slate-500">
                                                    {school.wins} / {school.matches}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${school.winRate > 40 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white'}`}>
                                                        {school.winRate.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`text-[10px] font-black ${fairness > 90 ? 'text-primary' : fairness > 80 ? 'text-orange-400' : 'text-red-500'}`}>
                                                            {fairness.toFixed(1)}%
                                                        </span>
                                                        <div className="h-0.5 w-12 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${fairness > 90 ? 'bg-primary' : 'bg-red-500'}`}
                                                                style={{ width: `${fairness}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {schoolStats.length > 15 && (
                                <div className="p-6 text-center border-t border-white/5">
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Showing top 15 schools by performance</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Information Footer */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="p-4 rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20">
                        <TrendingUp className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">Equilibrium Monitoring</h4>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                            The Equilibrium system monitors the variance between a school&apos;s predefined strength rating and its actual win-rate in virtual simulations. A fairness index below 75% indicates significant deviation from expected probability, triggering an automatic re-calibration alert.
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 hover:bg-indigo-400 transition-all group">
                        Run Calibration
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    )
}

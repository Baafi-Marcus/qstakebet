"use client"

import { useState, useEffect } from "react"
import { RefreshCw, AlertCircle, TrendingUp } from "lucide-react"
import { getLiveMatchesWithStatus } from "@/lib/match-helpers"

interface LiveMatch {
    id: string
    participants: any[]
    sportType: string
    status: string
    result: any
    minutesSinceUpdate: number
    staleness: "fresh" | "stale" | "critical"
    tournamentId: string
    stage: string
}

export default function LiveDashboardPage() {
    const [matches, setMatches] = useState<LiveMatch[]>([])
    const [loading, setLoading] = useState(true)
    const [lastSync, setLastSync] = useState<Date>(new Date())
    const [autoRefresh, setAutoRefresh] = useState(true)

    const fetchLiveMatches = async () => {
        const result = await getLiveMatchesWithStatus()
        if (result.success) {
            setMatches(result.matches as LiveMatch[])
            setLastSync(new Date())
        }
        setLoading(false)
    }

    useEffect(() => {
        let active = true;
        const initFetch = async () => {
            const result = await getLiveMatchesWithStatus();
            if (active && result.success) {
                setMatches(result.matches as LiveMatch[]);
                setLastSync(new Date());
                setLoading(false);
            } else if (active) {
                setLoading(false);
            }
        };
        initFetch();
        return () => { active = false; };
    }, []);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(async () => {
            const result = await getLiveMatchesWithStatus();
            if (result.success) {
                setMatches(result.matches as LiveMatch[]);
                setLastSync(new Date());
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const getStalenessColor = (staleness: string) => {
        switch (staleness) {
            case "fresh": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            case "stale": return "bg-amber-500/10 border-amber-500/20 text-amber-500"
            case "critical": return "bg-red-500/10 border-red-500/20 text-red-500"
            default: return "bg-slate-500/10 border-slate-500/20 text-slate-500"
        }
    }

    const criticalCount = matches.filter(m => m.staleness === "critical").length
    const staleCount = matches.filter(m => m.staleness === "stale").length

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Live Dashboard</h1>
                        <p className="text-sm text-slate-400 font-bold mt-1">Real-time match management</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${autoRefresh
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border border-white/10"
                                }`}
                        >
                            {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
                        </button>
                        <button
                            onClick={fetchLiveMatches}
                            disabled={loading}
                            className="px-4 py-2 rounded-xl bg-primary text-slate-950 text-xs font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {(criticalCount > 0 || staleCount > 0) && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Attention Required</span>
                        </div>
                        <div className="text-sm text-amber-400 font-bold">
                            {criticalCount > 0 && <div>• {criticalCount} match{criticalCount > 1 ? "es" : ""} not updated in 15+ minutes</div>}
                            {staleCount > 0 && <div>• {staleCount} match{staleCount > 1 ? "es" : ""} not updated in 5+ minutes</div>}
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="text-3xl font-black text-white">{matches.length}</div>
                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Live Matches</div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                        <div className="text-3xl font-black text-emerald-500">{matches.filter(m => m.staleness === "fresh").length}</div>
                        <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1">Fresh (&lt; 5min)</div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                        <div className="text-3xl font-black text-amber-500">{staleCount}</div>
                        <div className="text-xs font-black text-amber-600 uppercase tracking-widest mt-1">Stale (5-15min)</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                        <div className="text-3xl font-black text-red-500">{criticalCount}</div>
                        <div className="text-xs font-black text-red-600 uppercase tracking-widest mt-1">Critical (&gt; 15min)</div>
                    </div>
                </div>

                {/* Last Sync */}
                <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    Last synced: {lastSync.toLocaleTimeString()}
                </div>

                {/* Matches Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 text-slate-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">Loading live matches...</p>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                        <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">No live matches at the moment</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {matches.map(match => (
                            <div
                                key={match.id}
                                className={`border rounded-2xl p-6 transition-all ${getStalenessColor(match.staleness)}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{match.sportType}</div>
                                        <div className="text-sm font-bold text-white mt-1">{match.stage}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Last Update</div>
                                        <div className="text-xs font-bold">{match.minutesSinceUpdate}m ago</div>
                                    </div>
                                </div>

                                {/* Participants */}
                                <div className="space-y-2">
                                    {match.participants.map((p: any, idx: number) => (
                                        <div key={p.schoolId} className="flex items-center justify-between bg-black/20 rounded-xl p-3">
                                            <span className="text-sm font-bold text-white">{p.name}</span>
                                            <span className="text-lg font-black text-white">
                                                {match.result?.scores?.[p.schoolId] || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <button className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                        Quick Update
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

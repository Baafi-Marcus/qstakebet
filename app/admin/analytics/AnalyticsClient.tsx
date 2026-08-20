"use client"

import { UsersIcon as Users, TrophyIcon as Trophy, SignalIcon as Activity, ArrowUpRightIcon as ArrowUpRight, ChatBubbleLeftRightIcon as MessageSquare } from "@heroicons/react/24/solid";
import { ChartPieIcon as PieChart, ChartBarSquareIcon as BarChart3, PuzzlePieceIcon as Gamepad2, BuildingLibraryIcon as School } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils"

export function AnalyticsClient({ data }: { data: any }) {
    const { summary, matchBreakdown } = data

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Platform Intelligence</h1>
                <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest font-bold">Real-time engagement and operational insights</p>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Users"
                    value={summary.totalUsers.toLocaleString()}
                    subValue="Active Accounts"
                    icon={Users}
                    color="text-blue-400"
                />
                <MetricCard
                    label="Fantasy Lineups"
                    value={summary.totalLineups.toLocaleString()}
                    subValue="Created Squads"
                    icon={Gamepad2}
                    color="text-purple-400"
                />
                <MetricCard
                    label="Chat Messages"
                    value={summary.totalMessages.toLocaleString()}
                    subValue="Total Engagement"
                    icon={MessageSquare}
                    color="text-emerald-400"
                />
                <MetricCard
                    label="Participating Schools"
                    value={summary.totalSchools.toLocaleString()}
                    subValue="Across Tournaments"
                    icon={School}
                    color="text-pink-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Match Status Breakdown */}
                <div className="lg:col-span-1 bg-card/40 border border-border/50 rounded-[2rem] p-8">
                    <h3 className="text-foreground font-black uppercase text-xs tracking-[0.2em] mb-8 flex items-center gap-2">
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
                                        <span className="text-muted-foreground">{item.status}</span>
                                        <span className="text-foreground">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
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
                <div className="lg:col-span-2 bg-card/40 border border-border/50 rounded-[2.5rem] p-8">
                    <h3 className="text-foreground font-black uppercase text-xs tracking-[0.2em] mb-8 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-pink-500" />
                        Community Engagement Overview
                    </h3>

                    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border/50 rounded-3xl bg-background/20">
                        <BarChart3 className="h-10 w-10 text-muted-foreground/50 mb-4 opacity-20" />
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                            Advanced Data Visualization Coming Soon
                        </p>
                        <p className="text-muted-foreground/50 text-[8px] uppercase mt-2">
                            Aggregating historical match performance...
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-background/50 border border-border/50 rounded-2xl">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Most Active Feature</p>
                            <p className="text-foreground font-black text-sm uppercase">Fantasy League</p>
                        </div>
                        <div className="p-4 bg-background/50 border border-border/50 rounded-2xl">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Avg Members Per Room</p>
                            <p className="text-foreground font-black text-sm uppercase">{summary.avgMembersPerRoom}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, subValue, icon: Icon, color = "text-purple-400", trend, trendValue }: any) {
    return (
        <div className="bg-card border border-border/50 p-6 rounded-[2rem] hover:border-border transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-2xl group-hover:bg-muted/70 transition-colors">
                    <Icon className={cn("h-5 w-5", color)} />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-full",
                        trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'
                    )}>
                        {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <Activity className="h-2 w-2" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-2xl font-black text-foreground tracking-tight">{value}</h4>
            <p className="text-[10px] font-bold text-muted-foreground/70 mt-1 uppercase">{subValue}</p>
        </div>
    )
}

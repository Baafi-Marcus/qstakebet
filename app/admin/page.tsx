import { TrophyIcon as Trophy, UsersIcon as Users, SignalIcon as Activity, ChatBubbleLeftRightIcon as MessageSquare } from "@heroicons/react/24/solid";
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
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">System Status</h1>
                    <p className="text-muted-foreground text-xs mt-1 uppercase tracking-wider font-medium">Real-time Platform Metrics</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: summary.totalUsers.toString(), icon: Users, color: "text-teal-400", href: "/admin/users" },
                    { label: "Total Schools", value: summary.totalSchools.toString(), icon: Trophy, color: "text-blue-400", href: "/admin/schools" },
                    { label: "Active Tournaments", value: summary.totalTournaments.toString(), icon: Trophy, color: "text-purple-400", href: "/admin/tournaments" },
                    { label: "Lineups Drafted", value: summary.totalLineups.toString(), icon: Activity, color: "text-orange-400", href: "/admin/verify-results" },
                    { label: "Chat Messages", value: summary.totalMessages.toString(), icon: MessageSquare, color: "text-pink-400", href: "/chat" },
                    { label: "Custom Groups", value: summary.totalRooms.toString(), icon: Users, color: "text-indigo-400", href: "/chat" },
                    { label: "Total Group Joins", value: summary.totalMemberships.toString(), icon: Users, color: "text-green-400", href: "/chat" },
                    { label: "Avg Group Size", value: `${summary.avgMembersPerRoom} members`, icon: Activity, color: "text-yellow-400", href: "/chat" },
                ].map((stat, i) => (
                    <Link
                        key={i}
                        href={stat.href}
                        className="bg-card border border-border p-4 rounded-lg flex items-start justify-between hover:bg-accent transition-colors group cursor-pointer relative overflow-hidden"
                    >
                        <div>
                            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                            <div className="text-2xl font-mono font-bold text-foreground tracking-tight">{stat.value}</div>
                        </div>
                        <stat.icon className={`h-5 w-5 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                    </Link>
                ))}
            </div>

            {/* Health and Match Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <h2 className="text-xs font-black text-foreground uppercase tracking-widest">Service Status</h2>
                    </div>
                    <div>
                        {[
                            { name: "Database Connection", status: "Operational", color: "text-green-500" },
                            { name: "NSMQ Scraper API Node", status: "Active", color: "text-blue-500" },
                            { name: "Lineup Scoring & Settlement Engine", status: "Synced", color: "text-green-500" },
                            { name: "Banter Rooms Chat Sync", status: "Connected", color: "text-emerald-500" },
                            { name: "Alumni Leaderboards Generator", status: "Operational", color: "text-green-500" },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 hover:bg-accent">
                                <span className="text-xs font-bold text-muted-foreground font-mono">{item.name}</span>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${item.color}`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <h2 className="text-xs font-black text-foreground uppercase tracking-widest">Match Breakdown</h2>
                    </div>
                    <div className="p-0">
                        {matchBreakdown.length === 0 ? (
                            <div className="px-4 py-12 text-center text-muted-foreground/70 font-bold uppercase text-[10px] tracking-widest">No match data available</div>
                        ) : matchBreakdown.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 hover:bg-accent">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">{item.status} Matches</span>
                                <span className="text-sm font-black text-foreground font-mono">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

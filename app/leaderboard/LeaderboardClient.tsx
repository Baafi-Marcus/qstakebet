"use client"

import { useState } from "react"
import Link from "next/link"
import { TrophyIcon as Trophy, SparklesIcon as Crown, FireIcon as Medal, CheckBadgeIcon as Award, StarIcon as Star, HashtagIcon as Hash, ShieldExclamationIcon as BadgeAlert } from "@heroicons/react/24/solid";

type LeaderboardRow = {
    username: string | null
    almaMater: string | null
    points: number
}

type GameWeekInfo = {
    gameWeek: string
    hasOngoing: boolean
    isPast: boolean
}

type LeaderboardClientProps = {
    initialWeekly: LeaderboardRow[]
    initialLifetime: LeaderboardRow[]
    initialQuarterFinal?: LeaderboardRow[]
    initialSemiFinal?: LeaderboardRow[]
    initialGrandFinal?: LeaderboardRow[]
    gameWeek: string
    allGameWeeks?: GameWeekInfo[]
    viewerAlmaMater?: string | null
    isQFActive?: boolean
    isSFActive?: boolean
    isGFActive?: boolean
}

function getSchoolAcronym(name: string | null) {
    if (!name) return ""
    const clean = name.toLowerCase()
    if (clean.includes("presec")) return "PRESEC"
    if (clean.includes("mfantsipim")) return "MOBA"
    if (clean.includes("augustine")) return "APSU"
    if (clean.includes("adisadel")) return "SANTAC"
    if (clean.includes("prempeh")) return "Amanfoo"
    if (clean.includes("opoku ware")) return "Akatakyie"
    if (clean.includes("achimota")) return "Akora"
    if (clean.includes("wesley girls")) return "Gey Hey"
    if (clean.includes("accra academy")) return "Accra Aca"
    
    const parts = name.replace("Senior High", "").replace("School", "").replace("Technical", "").trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 5).toUpperCase()
    return parts.map(p => p[0]).join("").toUpperCase().substring(0, 6)
}

function formatGameWeekLabel(gameWeek: string) {
    const dateStr = gameWeek.replace("Matchday ", "")
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return gameWeek
    const d = new Date(dateStr + "T00:00:00Z")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

export function LeaderboardClient({
    initialWeekly,
    initialLifetime,
    initialQuarterFinal = [],
    initialSemiFinal = [],
    initialGrandFinal = [],
    gameWeek,
    allGameWeeks,
    viewerAlmaMater,
    isQFActive = false,
    isSFActive = false,
    isGFActive = false
}: LeaderboardClientProps) {
    const defaultTab = isGFActive ? "grand_final" 
                     : isSFActive ? "semi_final" 
                     : isQFActive ? "quarter_final" 
                     : "weekly";

    const [activeTab, setActiveTab] = useState<"weekly" | "lifetime" | "quarter_final" | "semi_final" | "grand_final">(defaultTab)

    const data = activeTab === "weekly" ? initialWeekly 
               : activeTab === "quarter_final" ? initialQuarterFinal 
               : activeTab === "semi_final" ? initialSemiFinal
               : activeTab === "grand_final" ? initialGrandFinal
               : initialLifetime

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-5 w-5 text-yellow-400 fill-yellow-400/20" />
            case 2:
                return <Medal className="h-5 w-5 text-slate-300 fill-slate-300/20" />
            case 3:
                return <Medal className="h-5 w-5 text-amber-600 fill-amber-600/20" />
            default:
                return <span className="text-[10px] font-black text-muted-foreground">{rank}</span>
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header banner */}
            <div className="relative mb-8 rounded-3xl p-6 md:p-8 overflow-hidden bg-card border border-border shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-6 w-6 text-yellow-400" />
                            <span className="text-xs font-black tracking-widest text-muted-foreground uppercase">Quiz Managers Rankings</span>
                        </div>
                        <h1 className="text-3xl font-extrabold font-russo text-foreground">
                            Leaderboard Standings
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Who holds the bragging rights? Check rankings across Ghana.
                        </p>
                    </div>
                </div>
            </div>

            {/* Alma mater nudge */}
            {viewerAlmaMater === null && (
                <Link
                    href="/chat"
                    className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4 transition-standard hover:bg-primary/20"
                >
                    <BadgeAlert className="h-5 w-5 shrink-0 text-primary" />
                    <div>
                        <p className="text-sm font-bold text-foreground">You have no school badge yet</p>
                        <p className="text-xs text-muted-foreground">Claim your alma mater in the Chat tab so it shows next to your name on the leaderboard.</p>
                    </div>
                </Link>
            )}

            {/* Tab toggles */}
            <div className="flex bg-card border border-border/50 p-1.5 rounded-2xl mb-6 flex-wrap md:flex-nowrap gap-1 md:gap-0">
                {!isQFActive && !isSFActive && !isGFActive && (
                    <button
                        onClick={() => setActiveTab("weekly")}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-standard flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === "weekly"
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Star className="h-4 w-4 shrink-0" /> Matchday Standings
                    </button>
                )}
                {isQFActive && !isSFActive && !isGFActive && (
                    <button
                        onClick={() => setActiveTab("quarter_final")}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-standard flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === "quarter_final"
                                ? "bg-amber-500 text-slate-950 font-black"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Trophy className="h-4 w-4 shrink-0" /> Quarter-Final
                    </button>
                )}
                {isSFActive && !isGFActive && (
                    <button
                        onClick={() => setActiveTab("semi_final")}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-standard flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === "semi_final"
                                ? "bg-pink-600 text-white font-black"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Trophy className="h-4 w-4 shrink-0" /> Semi-Final
                    </button>
                )}
                {isGFActive && (
                    <button
                        onClick={() => setActiveTab("grand_final")}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-standard flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === "grand_final"
                                ? "bg-yellow-500 text-slate-950 font-black"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Trophy className="h-4 w-4 shrink-0" /> Grand Final
                    </button>
                )}
                <button
                    onClick={() => setActiveTab("lifetime")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-standard flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === "lifetime"
                            ? "bg-primary text-white"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Award className="h-4 w-4 shrink-0" /> Overall Standings
                </button>
            </div>

            {/* Matchday switcher */}
            {activeTab === "weekly" && allGameWeeks && allGameWeeks.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
                    {allGameWeeks.map((gw) => {
                        const isActive = gw.gameWeek === gameWeek
                        return (
                            <Link
                                key={gw.gameWeek}
                                href={`/leaderboard?gw=${encodeURIComponent(gw.gameWeek)}`}
                                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-standard cursor-pointer ${
                                    isActive
                                        ? "bg-foreground text-background border-foreground"
                                        : gw.hasOngoing
                                            ? "bg-card text-primary border-primary/40 hover:bg-primary/10"
                                            : "bg-card text-muted-foreground border-border/50 hover:text-foreground hover:bg-accent"
                                }`}
                            >
                                {gw.hasOngoing && (
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                    </span>
                                )}
                                {formatGameWeekLabel(gw.gameWeek)}
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* Leaderboard Table Card */}
            <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl">

                {/* Table Header */}
                <div className="grid grid-cols-12 px-6 py-4 bg-muted border-b border-border/50 text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                    <div className="col-span-2 text-center">Rank</div>
                    <div className="col-span-6">Quiz Manager</div>
                    <div className="col-span-2">Badge</div>
                    <div className="col-span-2 text-right">Points</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border/50">
                    {data.length > 0 ? (
                        data.map((row, index) => {
                            const rank = index + 1
                            const acronym = getSchoolAcronym(row.almaMater)

                            return (
                                <div
                                    key={index}
                                    className={`grid grid-cols-12 px-6 py-4.5 items-center transition-colors hover:bg-accent ${
                                        rank <= 3 ? "bg-accent/50" : ""
                                    }`}
                                >
                                    <div className="col-span-2 flex justify-center">
                                        <div className="h-8 w-8 rounded-full bg-muted border border-border/50 flex items-center justify-center">
                                            {getRankIcon(rank)}
                                        </div>
                                    </div>
                                    <div className="col-span-6">
                                        <span className="font-extrabold text-sm text-foreground">
                                            {row.username || "Anonymous Player"}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        {acronym ? (
                                            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/25">
                                                {acronym}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-bold text-muted-foreground/70">-</span>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="font-black text-sm text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-xl">
                                            {row.points} pts
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="py-16 text-center text-muted-foreground text-sm">
                            <Hash className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                            No standings entries recorded for this tab yet.
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

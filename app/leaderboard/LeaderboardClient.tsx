"use client"

import { useState } from "react"
import { Trophy, Crown, Medal, Award, Star, Hash } from "lucide-react"

type LeaderboardRow = {
    username: string | null
    almaMater: string | null
    points: number
}

type LeaderboardClientProps = {
    initialWeekly: LeaderboardRow[]
    initialLifetime: LeaderboardRow[]
    gameWeek: string
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

export function LeaderboardClient({ initialWeekly, initialLifetime, gameWeek }: LeaderboardClientProps) {
    const [activeTab, setActiveTab] = useState<"weekly" | "lifetime">("weekly")

    const data = activeTab === "weekly" ? initialWeekly : initialLifetime

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-5 w-5 text-yellow-400 fill-yellow-400/20" />
            case 2:
                return <Medal className="h-5 w-5 text-slate-300 fill-slate-300/20" />
            case 3:
                return <Medal className="h-5 w-5 text-amber-600 fill-amber-600/20" />
            default:
                return <span className="text-[10px] font-black text-slate-500">{rank}</span>
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header banner */}
            <div className="relative mb-8 rounded-3xl p-6 md:p-8 overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-transparent to-transparent z-0" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-6 w-6 text-yellow-400" />
                            <span className="text-xs font-black tracking-widest text-purple-400 uppercase">Quiz Managers Rankings</span>
                        </div>
                        <h1 className="text-3xl font-extrabold font-russo bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                            Leaderboard Standings
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Who holds the bragging rights? Check rankings across Ghana.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab toggles */}
            <div className="flex bg-slate-900 border border-white/5 p-1.5 rounded-2xl mb-6">
                <button
                    onClick={() => setActiveTab("weekly")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === "weekly"
                            ? "bg-purple-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <Star className="h-4 w-4 shrink-0" /> Stage Standings ({gameWeek})
                </button>
                <button
                    onClick={() => setActiveTab("lifetime")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === "lifetime"
                            ? "bg-purple-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <Award className="h-4 w-4 shrink-0" /> Overall Standings
                </button>
            </div>

            {/* Leaderboard Table Card */}
            <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                
                {/* Table Header */}
                <div className="grid grid-cols-12 px-6 py-4 bg-slate-950 border-b border-white/5 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <div className="col-span-2 text-center">Rank</div>
                    <div className="col-span-6">Quiz Manager</div>
                    <div className="col-span-2">Badge</div>
                    <div className="col-span-2 text-right">Points</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-white/5">
                    {data.length > 0 ? (
                        data.map((row, index) => {
                            const rank = index + 1
                            const acronym = getSchoolAcronym(row.almaMater)

                            return (
                                <div 
                                    key={index}
                                    className={`grid grid-cols-12 px-6 py-4.5 items-center transition-colors hover:bg-white/[0.02] ${
                                        rank <= 3 ? "bg-white/[0.01]" : ""
                                    }`}
                                >
                                    <div className="col-span-2 flex justify-center">
                                        <div className="h-8 w-8 rounded-full bg-slate-950/80 border border-white/5 flex items-center justify-center">
                                            {getRankIcon(rank)}
                                        </div>
                                    </div>
                                    <div className="col-span-6">
                                        <span className="font-extrabold text-sm text-white">
                                            {row.username || "Anonymous Player"}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        {acronym ? (
                                            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/25 shadow-sm">
                                                {acronym}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-bold text-slate-600">-</span>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="font-black text-sm text-purple-400 bg-purple-500/5 border border-purple-500/10 px-3 py-1 rounded-xl">
                                            {row.points} pts
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="py-16 text-center text-slate-500 text-sm">
                            <Hash className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                            No standings entries recorded for this tab yet.
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

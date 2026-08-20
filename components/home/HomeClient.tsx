"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
    TrophyIcon,
    CalendarIcon,
    SparklesIcon,
    ChatBubbleLeftRightIcon,
    BoltIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/solid"
import { Match } from "@/lib/types"

interface HomeClientProps {
    initialMatches: Match[]
}

function getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

function getDateGroupLabel(date: Date): string {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const matchDate = new Date(date)
    matchDate.setHours(0, 0, 0, 0)

    const isToday = matchDate.getTime() === today.getTime()

    const day = matchDate.getDate()
    const month = matchDate.toLocaleDateString('en-GB', { month: 'short' })
    const year = matchDate.getFullYear()
    const formattedDate = `${day}${getOrdinalSuffix(day)} ${month} ${year}`

    if (isToday) {
        return `Today ${formattedDate}`
    } else {
        const weekday = matchDate.toLocaleDateString('en-GB', { weekday: 'short' })
        return `${weekday} ${formattedDate}`
    }
}

export function HomeClient({ initialMatches }: HomeClientProps) {
    const [searchQuery, setSearchQuery] = useState("")

    // Filter matches purely by search query
    const filteredMatches = initialMatches.filter(m => {
        const matchesSearch = m.stage.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesSearch
    })

    // Group matches by scheduled date
    const groupedMatches = useMemo(() => {
        const groups: { [key: string]: Match[] } = {}

        filteredMatches.forEach(match => {
            let groupKey = "Live & Recent"

            if (match.scheduledAt) {
                const schedDate = new Date(match.scheduledAt)
                groupKey = getDateGroupLabel(schedDate)
            } else if (match.isLive) {
                groupKey = "Live & Recent"
            }

            if (!groups[groupKey]) {
                groups[groupKey] = []
            }
            groups[groupKey].push(match)
        })

        // Format as list
        return Object.entries(groups).map(([label, matchesList]) => ({
            label,
            matches: matchesList
        })).sort((a, b) => {
            if (a.label.includes("Today")) return -1
            if (b.label.includes("Today")) return 1
            if (a.label.includes("Live")) return -1
            if (b.label.includes("Live")) return 1
            return 0
        })
    }, [filteredMatches])

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-10">
            
            {/* Hero Banner Section */}
            <div className="relative rounded-[2.5rem] p-8 md:p-12 overflow-hidden bg-card border border-border/50 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 via-indigo-950/20 to-transparent z-0 animate-in fade-in duration-1000" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 max-w-2xl flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
                        <span className="text-xs font-black tracking-widest text-purple-400 uppercase">Free To Play Quiz Fantasy</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black font-russo bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent leading-[1.1] tracking-tight">
                        NSMQ Fantasy & Fan Ecosystem
                    </h1>

                    <p className="text-muted-foreground text-sm md:text-md leading-relaxed mt-2">
                        Prove your academic pride! Build your weekly 3-school lineup, earn baseline points from official quiz scores, unlock modifiers, and banter with fellow alumni in local chat channels.
                    </p>
                </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-y border-border">

                <Link href="/fantasy" className="group flex items-start gap-4 py-6 sm:px-6 first:sm:pl-0 hover:bg-accent/40 transition-colors">
                    <BoltIcon className="h-7 w-7 text-purple-500 shrink-0 mt-0.5 transition-transform group-hover:scale-110" />
                    <div>
                        <h3 className="font-extrabold text-base text-foreground">Draft Lineup</h3>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Spend 100 virtual credits to draft exactly 3 schools. Adjust your team strategy weekly based on active matchups.</p>
                    </div>
                </Link>

                <Link href="/chat" className="group flex items-start gap-4 py-6 sm:px-6 hover:bg-accent/40 transition-colors">
                    <ChatBubbleLeftRightIcon className="h-7 w-7 text-purple-500 shrink-0 mt-0.5 transition-transform group-hover:scale-110" />
                    <div>
                        <h3 className="font-extrabold text-base text-foreground">Banter Chat Rooms</h3>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Claim your permanent school badge and discuss real-time scores, updates, and historic rivalries.</p>
                    </div>
                </Link>

                <Link href="/leaderboard" className="group flex items-start gap-4 py-6 sm:px-6 last:sm:pr-0 hover:bg-accent/40 transition-colors">
                    <TrophyIcon className="h-7 w-7 text-purple-500 shrink-0 mt-0.5 transition-transform group-hover:scale-110" />
                    <div>
                        <h3 className="font-extrabold text-base text-foreground">National Rankings</h3>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Track weekly standings and cumulative lifetime points to see where you rank as a Quiz Manager in Ghana.</p>
                    </div>
                </Link>

            </div>

            {/* Fixtures & Results List */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold font-russo uppercase tracking-wider text-foreground flex items-center gap-2">
                        <ListBulletIcon className="h-5 w-5 text-purple-500" /> Match Schedules & Results
                    </h2>

                    {/* Simple search */}
                    <div className="relative w-full md:w-72">
                        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter fixtures..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-input text-xs placeholder-muted-foreground focus:outline-none focus:border-purple-500/50"
                        />
                    </div>
                </div>

                <div className="space-y-8">
                    {groupedMatches.length > 0 ? (
                        groupedMatches.map(group => (
                            <div key={group.label} className="space-y-4">
                                <div className="flex items-center gap-2.5 px-2">
                                    <CalendarIcon className="h-4.5 w-4.5 text-purple-500" />
                                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground/80">{group.label}</h3>
                                    <div className="flex-1 h-px bg-border/50" />
                                    <span className="text-[10px] text-muted-foreground font-bold">{group.matches.length} Contests</span>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {group.matches.map(match => {
                                        const participants = (match.participants as any[]) || []
                                        const result = (match.result as any) || {}
                                        const scores = result.scores || {}
                                        
                                        return (
                                            <div 
                                                key={match.id}
                                                className="bg-card/40 border border-border/50 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                                            >
                                                {/* Stage & Details */}
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/5 px-2.5 py-1 rounded-full border border-purple-500/10">
                                                        {match.stage}
                                                    </span>
                                                    <div className="text-xs text-muted-foreground mt-2 font-semibold">
                                                        {match.scheduledAt ? new Date(match.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "Schedule Pending"}
                                                    </div>
                                                </div>

                                                {/* Schools and Scores */}
                                                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 max-w-3xl">
                                                    {participants.map((p, idx) => {
                                                        const isWinner = result.winner === p.schoolId
                                                        const score = scores[p.schoolId]

                                                        return (
                                                            <div 
                                                                key={idx}
                                                                className={`flex-1 p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                                                                    isWinner
                                                                        ? "bg-amber-500/5 border-amber-500/25"
                                                                        : "bg-muted/60 border-border/50"
                                                                }`}
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="font-extrabold text-xs text-foreground truncate">{p.name}</div>
                                                                    <div className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">{p.region}</div>
                                                                </div>
                                                                {score !== undefined && (
                                                                    <span className={`text-md font-black px-2 py-0.5 rounded ${isWinner ? "text-amber-400" : "text-foreground/80"}`}>
                                                                        {score}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {/* Live Status Badge */}
                                                <div>
                                                    {match.isLive ? (
                                                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/25 animate-pulse shrink-0">
                                                            ● Live Quiz
                                                        </span>
                                                    ) : match.status === 'finished' || match.status === 'settled' ? (
                                                        <span className="text-[9px] font-black uppercase bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border/50 shrink-0">
                                                            Finished
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-black uppercase bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border/50 shrink-0">
                                                            Upcoming
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-16 text-center text-muted-foreground text-sm border border-border/50 border-dashed rounded-3xl">
                            No match schedules match your filter query.
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}

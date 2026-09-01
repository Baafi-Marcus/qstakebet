"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
    TrophyIcon,
    CalendarIcon,
    ChatBubbleLeftRightIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    BoltIcon,
    ChevronRightIcon,
    ClockIcon,
    FireIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/solid"
import { Match } from "@/lib/types"

interface HomeClientProps {
    initialMatches: Match[]
    sfContests: { id: string; label: number; date: string | null; teams: string[] }[]
    sfDeadline: string | null
    qfRecap: { id: string; date: string | null; winnerName: string; winnerScore: number | null }[]
    semiFinalTop: { username: string; points: number }[]
    quarterFinalTop: { username: string; points: number }[]
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

function formatContestDate(date: string | null): string {
    if (!date) return "Time TBC"
    const d = new Date(date)
    if (isNaN(d.getTime())) return "Time TBC"
    const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
    return `${day} · ${time} UTC`
}

function useCountdown(target: string | null) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        if (!target) return
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [target])

    if (!target) return null
    const diff = new Date(target).getTime() - now
    if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
    const total = Math.floor(diff / 1000)
    return {
        expired: false,
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
    }
}

export function HomeClient({ initialMatches, sfContests, sfDeadline, qfRecap, semiFinalTop, quarterFinalTop }: HomeClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const countdown = useCountdown(sfDeadline)

    const filteredMatches = initialMatches.filter(m => {
        const matchesSearch = m.stage.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesSearch
    })

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

    const qfGrouped = useMemo(() => {
        const groups: { [key: string]: HomeClientProps["qfRecap"] } = {}
        const weekdays = new Map<string, string>()
        qfRecap.forEach(r => {
            if (r.date) {
                const d = new Date(r.date)
                const key = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                weekdays.set(key, d.toLocaleDateString("en-GB", { weekday: "short" }))
                if (!groups[key]) groups[key] = []
                groups[key].push(r)
            }
        })
        return Object.entries(groups).map(([key, list]) => ({
            day: key,
            weekday: weekdays.get(key) || "",
            matches: list,
        }))
    }, [qfRecap])

    const standingsSource = quarterFinalTop.length > 0 ? quarterFinalTop : semiFinalTop
    const standingsLabel = quarterFinalTop.length > 0 ? "Quarter-Final · Final Standings" : "Semi-Final · Live Standings"

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-10">

            {/* ============================== HERO ============================== */}
            <section className="relative rounded-[2rem] p-6 md:p-10 lg:p-12 overflow-hidden bg-card border border-border/60 shadow-xl">
                <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-center">
                    {/* Left: copy */}
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-primary uppercase bg-primary/10 border border-primary/25 px-3 py-1.5 rounded-full">
                                <FireIcon className="h-3.5 w-3.5 text-amber-500" /> Semi-Finals · Sep 3
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black font-russo tracking-tight leading-[1.05]">
                            Semi-Final<br />
                            <span className="text-primary">Confidence</span> Challenge
                        </h1>

                        <p className="text-muted-foreground text-sm md:text-md leading-relaxed max-w-lg">
                            Predict the winner of all 3 semis, assign your 1x/2x/3x multipliers — every correct call pays. Max 120 points. Free to play, no credits needed.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 pt-1">
                            <Link
                                href="/fantasy/semi-final"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-wider transition-standard hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-primary/20"
                            >
                                Make Your Picks <ChevronRightIcon className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/leaderboard"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-muted text-foreground font-black text-sm uppercase tracking-wider transition-standard hover:-translate-y-0.5 active:translate-y-0 border border-border/60"
                            >
                                <TrophyIcon className="h-4 w-4 text-amber-500" /> Standings
                            </Link>
                        </div>
                    </div>

                    {/* Right: countdown + semifinal tickets */}
                    <div className="flex flex-col gap-3">
                        <div className="rounded-2xl border border-border/60 bg-background/50 p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ClockIcon className="h-4.5 w-4.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">First Kickoff</span>
                            </div>
                            {countdown && !countdown.expired ? (
                                <div className="flex items-center gap-2 text-white font-black tabular-nums">
                                    {[
                                        [countdown.days, "d"],
                                        [countdown.hours, "h"],
                                        [countdown.minutes, "m"],
                                        [countdown.seconds, "s"],
                                    ].map(([val, unit]) => (
                                        <span key={unit as string} className="flex items-baseline gap-1 bg-foreground/5 border border-border/50 rounded-lg px-2 py-1 text-sm md:text-base">
                                            {String(val).padStart(2, "0")}
                                            <span className="text-[9px] font-black text-muted-foreground uppercase">{unit}</span>
                                        </span>
                                    ))}
                                </div>
                            ) : countdown?.expired ? (
                                <span className="text-amber-400 font-black text-sm uppercase tracking-wider animate-pulse">Predictions Locked</span>
                            ) : (
                                <span className="text-muted-foreground text-xs font-bold">Loading…</span>
                            )}
                        </div>

                        {sfContests.map(contest => (
                            <Link
                                key={contest.id}
                                href="/fantasy/semi-final"
                                className="group rounded-2xl border border-border/60 bg-background/50 p-4 flex items-center justify-between gap-4 hover:border-primary/40 hover:bg-background transition-standard"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                        SF {contest.label}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs font-extrabold text-foreground truncate">
                                            {contest.teams.join("  ·  ")}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                                            {formatContestDate(contest.date)}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================== QUICK ACTIONS ============================== */}
            <section className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-y border-border">
                <Link href="/fantasy/semi-final" className="group flex items-start gap-4 py-6 sm:px-6 first:sm:pl-0 hover:bg-primary/5 transition-standard">
                    <BoltIcon className="h-6 w-6 text-primary shrink-0 mt-0.5 transition-transform group-hover:-translate-y-0.5" />
                    <div>
                        <h3 className="font-extrabold text-base text-foreground">Semi-Final Predictor</h3>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">3 contests. Pick a winner, assign 1x/2x/3x. Max 120 points.</p>
                    </div>
                </Link>

                <Link href="/chat" className="group flex items-start gap-4 py-6 sm:px-6 hover:bg-primary/5 transition-standard">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary shrink-0 mt-0.5 transition-transform group-hover:-translate-y-0.5" />
                    <div>
                        <h3 className="font-extrabold text-base text-foreground">Banter Chat Rooms</h3>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Claim your school badge and talk semis live with fellow fans.</p>
                    </div>
                </Link>

                <Link href="/leaderboard" className="group flex items-start gap-4 py-6 sm:px-6 last:sm:pr-0 hover:bg-primary/5 transition-standard">
                    <TrophyIcon className="h-6 w-6 text-amber-500 shrink-0 mt-0.5 transition-transform group-hover:-translate-y-0.5" />
                    <div>
                        <h3 className="font-extrabold text-base text-foreground">Playoff Rankings</h3>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">QF points are banked. See who sits atop the playoff leaderboard.</p>
                    </div>
                </Link>
            </section>

            {/* ============================== SEMI-FINAL CONTESTS ============================== */}
            {sfContests.length > 0 && (
                <section className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <FireIcon className="h-5 w-5 text-amber-500" />
                        <h2 className="text-2xl font-black font-russo uppercase tracking-tight text-foreground">The Semi-Finals</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sfContests.map((contest, idx) => (
                            <div
                                key={contest.id}
                                className="relative rounded-3xl border border-border/60 bg-card p-6 flex flex-col gap-4 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-2xl rounded-full pointer-events-none" />
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/25 px-2.5 py-1 rounded-full">
                                        Contest {idx + 1}
                                    </span>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        {formatContestDate(contest.date)}
                                    </span>
                                </div>

                                <ol className="flex flex-col gap-2">
                                    {contest.teams.map((team, i) => (
                                        <li
                                            key={team}
                                            className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5"
                                        >
                                            <span className="shrink-0 w-6 h-6 rounded-lg bg-muted border border-border/60 flex items-center justify-center text-[10px] font-black text-muted-foreground">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span className="text-sm font-extrabold text-foreground">{team}</span>
                                        </li>
                                    ))}
                                </ol>

                                <Link
                                    href="/fantasy/semi-final"
                                    className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/25 text-primary font-black text-xs uppercase tracking-wider py-2.5 hover:bg-primary hover:text-white transition-standard"
                                >
                                    Predict Winner <ChevronRightIcon className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ============================== ROAD TO THE SEMIS ============================== */}
            {qfGrouped.length > 0 && (
                <section className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <TrophyIcon className="h-5 w-5 text-amber-500" />
                        <h2 className="text-2xl font-black font-russo uppercase tracking-tight text-foreground">Road to the Semi-Finals</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {qfGrouped.map(group => (
                            <div key={group.day} className="rounded-3xl border border-border/60 bg-card p-5 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest text-foreground">
                                        {group.weekday} · {group.day}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {group.matches.map(r => (
                                        <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5">
                                            <span className="flex items-center gap-2 min-w-0">
                                                <CheckCircleIcon className="h-4 w-4 text-amber-500 shrink-0" />
                                                <span className="text-sm font-extrabold text-foreground truncate">{r.winnerName}</span>
                                            </span>
                                            <span className="text-sm font-black text-amber-500 tabular-nums">{r.winnerScore}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ============================== STANDINGS SNAPSHOT ============================== */}
            {standingsSource.length > 0 && (
                <section className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 flex flex-col gap-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black font-russo uppercase tracking-tight text-foreground">Playoff Standings</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{standingsLabel}</p>
                        </div>
                        <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-sm font-black text-primary hover:text-primary/80 uppercase tracking-wider transition-standard">
                            Full leaderboard <ChevronRightIcon className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="divide-y divide-border/60">
                        {standingsSource.map((row, idx) => {
                            const place = idx + 1
                            const isPodium = place <= 3
                            return (
                                <div key={row.username} className="flex items-center gap-4 py-3">
                                    <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                                        place === 1 ? "bg-amber-500 text-slate-950"
                                            : place === 2 ? "bg-slate-300 text-slate-900"
                                            : place === 3 ? "bg-amber-700 text-white"
                                            : "bg-muted text-muted-foreground"
                                    }`}>
                                        {place}
                                    </span>
                                    <span className="font-extrabold text-foreground truncate">{row.username}</span>
                                    {isPodium && <TrophyIcon className="h-4 w-4 text-amber-500 shrink-0" />}
                                    <span className="ml-auto font-black text-primary tabular-nums">{row.points} pts</span>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* ============================== FIXTURES & RESULTS ============================== */}
            <section className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold font-russo uppercase tracking-wider text-foreground flex items-center gap-2">
                        <ListBulletIcon className="h-5 w-5 text-primary" /> Match Schedules & Results
                    </h2>

                    <div className="relative w-full md:w-72">
                        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter fixtures..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-input text-xs placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                        />
                    </div>
                </div>

                <div className="space-y-8">
                    {groupedMatches.length > 0 ? (
                        groupedMatches.map(group => (
                            <div key={group.label} className="space-y-4">
                                <div className="flex items-center gap-2.5 px-2">
                                    <CalendarIcon className="h-4.5 w-4.5 text-primary" />
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
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                                                        {match.stage}
                                                    </span>
                                                    <div className="text-xs text-muted-foreground mt-2 font-semibold">
                                                        {match.scheduledAt ? new Date(match.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "Schedule Pending"}
                                                    </div>
                                                </div>

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
            </section>

        </div>
    )
}
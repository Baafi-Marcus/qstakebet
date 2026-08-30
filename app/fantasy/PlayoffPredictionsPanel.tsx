"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, Star, Flame, ChevronDown, Loader2, PenSquare } from "lucide-react"
import { getMyPlayoffPredictions } from "@/lib/fantasy-actions"

type PlayoffRow = {
    matchId: string
    label: string
    predictedName: string | null
    actualWinnerName: string | null
    finished: boolean
    correct: boolean | null
    points: number
    confidence?: number | null
    bonus?: string[]
}

type StageData = {
    exists: boolean
    hasFixtures: boolean
    isLocked: boolean
    lockedAt: string | null
    allFinished: boolean
    url: string
    total: number
    max: number | null
    breakdown: PlayoffRow[]
    wildcard?: PlayoffRow | null
    masterPick?: { label: string | null; schoolName: string | null; correct: boolean | null; finished: boolean } | null
    champion?: { schoolName: string | null; correct: boolean | null; points: number } | null
    runnerUp?: { schoolName: string | null; correct: boolean | null; points: number } | null
    margin?: { pick: string | null; actual: string | null; correct: boolean | null; points: number } | null
    boost?: string | null
}

type TrackerData = {
    quarterFinal: StageData
    semiFinal: StageData
    grandFinal: StageData
}

const STAGES: { key: "quarterFinal" | "semiFinal" | "grandFinal"; title: string; icon: any; accent: string; activeIcon: string }[] = [
    { key: "quarterFinal", title: "Quarter-Final", icon: Trophy, accent: "text-amber-500", activeIcon: "bg-amber-500" },
    { key: "semiFinal", title: "Semi-Final", icon: Flame, accent: "text-pink-500", activeIcon: "bg-pink-500" },
    { key: "grandFinal", title: "Grand Final", icon: Trophy, accent: "text-yellow-500", activeIcon: "bg-yellow-500" },
]

function formatLockDate(iso: string | null) {
    if (!iso) return null
    try {
        return new Date(iso).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })
    } catch {
        return null
    }
}

export default function PlayoffPredictionsPanel() {
    const [data, setData] = useState<TrackerData | null>(null)
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState<Record<string, boolean>>({ quarterFinal: true })

    useEffect(() => {
        let cancelled = false
        getMyPlayoffPredictions()
            .then((res: any) => {
                if (cancelled) return
                setData(res?.success ? res.data : null)
                setLoading(false)
            })
            .catch(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [])

    if (loading) {
        return (
            <div className="mb-10 rounded-3xl border border-border/50 bg-card p-6">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading your predictions...
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold font-russo uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Star className="h-6 w-6 text-amber-400" /> My Playoff Predictions
                </h2>
            </div>

            <div className="space-y-4">
                {STAGES.map(stage => {
                    const s = data[stage.key]
                    const isOpen = !!open[stage.key]
                    const Icon = stage.icon

                    const statusChip = !s.hasFixtures
                        ? { text: "Opens Soon", cls: "bg-muted text-muted-foreground" }
                        : !s.exists
                            ? { text: "Not Entered", cls: "bg-amber-500/15 text-amber-500 border border-amber-500/30" }
                            : !s.allFinished
                                ? { text: s.isLocked ? "Locked" : "In Progress", cls: s.isLocked ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" }
                                : { text: "Completed", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" }

                    return (
                        <div key={stage.key} className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-xl">
                            {/* Header */}
                            <button
                                onClick={() => setOpen(p => ({ ...p, [stage.key]: !p[stage.key] }))}
                                className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-accent/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${stage.activeIcon}/15 ${stage.accent}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-black text-sm text-foreground uppercase tracking-wide">{stage.title}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusChip.cls}`}>
                                                {statusChip.text}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {s.lockedAt && s.exists && `Locked ${formatLockDate(s.lockedAt)}`}
                                            {s.lockedAt && s.exists && !s.allFinished ? " · " : ""}
                                            {!s.allFinished && s.exists ? "points update as results are settled" : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-black text-sm text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-xl">
                                        {s.exists ? `${s.total}${s.max ? ` / ${s.max}` : ""} pts` : "—"}
                                    </span>
                                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                                </div>
                            </button>

                            {/* Body */}
                            {isOpen && (
                                <div className="border-t border-border/50 px-5 py-4">
                                    {!s.exists ? (
                                        <div className="text-center py-4">
                                            {s.hasFixtures ? (
                                                <>
                                                    <p className="text-sm text-muted-foreground mb-3">You haven&apos;t entered the {stage.title} predictor yet.</p>
                                                    <Link
                                                        href={s.url}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider text-xs transition-standard cursor-pointer"
                                                    >
                                                        <PenSquare className="h-4 w-4" /> Make Your Picks
                                                    </Link>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    {stage.key === "quarterFinal"
                                                        ? "Quarter-Final fixtures have not been released yet."
                                                        : stage.key === "semiFinal"
                                                            ? "Opens when the Semi-Final fixtures are released."
                                                            : "Opens when the Grand Final is set."}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <StageBody stage={stage.key} data={s} />
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function StageBody({ stage, data }: { stage: "quarterFinal" | "semiFinal" | "grandFinal"; data: StageData }) {
    if (stage === "quarterFinal" || stage === "semiFinal") {
        return (
            <div>
                <div className="divide-y divide-border/40">
                    {data.breakdown.map(row => (
                        <Row key={row.matchId} row={row} />
                    ))}
                </div>

                {stage === "quarterFinal" && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                                <Star className="h-3.5 w-3.5" /> Wildcard
                            </span>
                            {data.wildcard ? (
                                <span className="text-foreground/80">{data.wildcard.label} · {data.wildcard.predictedName ?? "No pick"}</span>
                            ) : (
                                <span className="text-muted-foreground">Not selected</span>
                            )}
                            <StatusMark correct={data.wildcard?.correct ?? null} />
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-red-500 flex items-center gap-1.5 uppercase tracking-wider">
                                <Flame className="h-3.5 w-3.5" /> Master Pick
                            </span>
                            <span className="text-foreground/80">{data.masterPick?.schoolName ?? "Not selected"}</span>
                            <StatusMark correct={data.masterPick?.correct ?? null} />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-sm">
                            <span className="font-black uppercase tracking-wider text-muted-foreground text-xs">Total</span>
                            <span className="font-black text-primary">{data.total} / {data.max} pts</span>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Grand Final
    const items = [
        { label: "Champion", value: data.champion?.schoolName ?? "—", correct: data.champion?.correct ?? null, points: data.champion?.points ?? 0, icon: <Trophy className="h-3.5 w-3.5" />, color: "text-amber-500" },
        { label: "Runner-Up", value: data.runnerUp?.schoolName ?? "—", correct: data.runnerUp?.correct ?? null, points: data.runnerUp?.points ?? 0, icon: <Trophy className="h-3.5 w-3.5" />, color: "text-slate-300" },
        { label: "Winning Margin", value: data.margin?.pick ? `${data.margin.pick}` : "—", correct: data.margin?.correct ?? null, points: data.margin?.points ?? 0, icon: <Star className="h-3.5 w-3.5" />, color: "text-yellow-500" },
        { label: "Final Boost", value: data.boost ? data.boost.replace("_", " ") : "—", correct: null, points: null, icon: <Flame className="h-3.5 w-3.5" />, color: "text-red-500" },
    ]

    return (
        <div>
            <div className="divide-y divide-border/40">
                {items.map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-2 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className={`shrink-0 ${item.color}`}>{item.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-28 shrink-0">{item.label}</span>
                            <span className="text-sm font-bold text-foreground truncate">{item.value}</span>
                        </div>
                        <div className="shrink-0">
                            {item.points === null ? (
                                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Fixed</span>
                            ) : item.correct === null ? (
                                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Pending</span>
                            ) : item.correct ? (
                                <span className="text-sm font-black text-emerald-400">+{item.points} pts</span>
                            ) : (
                                <span className="text-sm font-black text-red-400/80 uppercase text-xs">Missed</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/50 text-sm">
                <span className="font-black uppercase tracking-wider text-muted-foreground text-xs">Total</span>
                <span className="font-black text-primary">{data.total} pts</span>
            </div>
        </div>
    )
}

function Row({ row }: { row: PlayoffRow }) {
    return (
        <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-background border border-border/60 text-muted-foreground">
                    {row.label}
                </span>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground truncate">{row.predictedName ?? "No pick"}</span>
                        {row.confidence != null && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {row.confidence}x
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                        {row.finished ? `Winner: ${row.actualWinnerName ?? "—"}` : "Awaiting result"}
                    </span>
                </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
                {row.correct === null ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pending</span>
                ) : row.correct ? (
                    <>
                        {(row.bonus ?? []).map(b => (
                            <span key={b} className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25">
                                {b.replace(" +", "+")}
                            </span>
                        ))}
                        <span className="text-sm font-black text-emerald-400">+{row.points}</span>
                    </>
                ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400/70">Missed</span>
                )}
            </div>
        </div>
    )
}

function StatusMark({ correct }: { correct: boolean | null }) {
    if (correct === null) return <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pending</span>
    if (correct) return <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">+30 Earned</span>
    return <span className="text-[10px] font-black uppercase tracking-wider text-red-400/70">Missed</span>
}
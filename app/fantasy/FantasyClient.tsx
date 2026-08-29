"use client"

import { useState, useTransition, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { submitLineup, getLineupPointsExplanation } from "@/lib/fantasy-actions"
import { MagnifyingGlassIcon as Search, TrophyIcon as Trophy, ShieldCheckIcon as ShieldCheck, XMarkIcon as X, BanknotesIcon as Coins, ArrowRightIcon as ArrowRight, CheckCircleIcon as CheckCircle2, ExclamationCircleIcon as AlertCircle, ArrowPathRoundedSquareIcon as RefreshCw, ClockIcon as Clock, PencilIcon as Pencil, ArchiveBoxIcon as Archive, ChartBarIcon as Chart, ArrowPathIcon as Loader2, FireIcon as Flame } from "@heroicons/react/24/solid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

type School = {
    id: string
    name: string
    region: string
    tier: string
    creditCost: number
}

type StageData = {
    gameWeek: string;
    deadline: Date | null;
    isLocked: boolean;
}

type SquadHistoryEntry = {
    id: string
    gameWeek: string
    pointsEarned: number
    rank: number | null
    substitutionsMade: number
    creditsSpent: number | null
    status: string
    pointsBreakdown?: any
    createdAt?: Date | string | null
    schools: School[]
}

type FantasyClientProps = {
    stages: {
        currentStage: StageData | null;
        nextStage: StageData | null;
        isOffSeason: boolean;
    };
    currentSchools: School[];
    currentLineup: any | null;
    nextSchools: School[];
    nextLineup: any | null;
    lineupHistory: SquadHistoryEntry[];
    hasQF?: boolean;
    hasSF?: boolean;
    hasGF?: boolean;
}

const REGIONS = [
    "All", "Ashanti", "Greater Accra", "Central", "Volta", 
    "Eastern", "Western", "Northern", "Bono", "Bono East", "Ahafo"
]

// Points for a single school, tolerant of both breakdown shapes:
// { schoolId: number } or { matchId: { schoolId: { base, bonus, total } } }
function getSchoolBreakdownTotal(breakdown: any, schoolId: string): number {
    if (!breakdown || typeof breakdown !== 'object') return 0
    const direct = breakdown[schoolId]
    if (typeof direct === 'number') return direct
    let total = 0
    for (const value of Object.values(breakdown)) {
        if (value && typeof value === 'object') {
            const entry = (value as any)[schoolId]
            if (typeof entry === 'number') total += entry
            else if (entry && typeof entry === 'object' && typeof (entry as any).total === 'number') total += (entry as any).total
        }
    }
    return total
}

function formatStageLabel(gw: string): string {
    if (gw.startsWith("Matchday ")) {
        const d = new Date(gw.replace("Matchday ", ""))
        if (!isNaN(d.getTime())) return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    }
    return gw
}

export function FantasyClient({ stages, currentSchools, currentLineup, nextSchools, nextLineup, lineupHistory, hasQF = false, hasSF = false, hasGF = false }: FantasyClientProps) {
    const router = useRouter()
    
    // Determine which stage we are viewing
    const [viewMode, setViewMode] = useState<'current' | 'next'>(stages.currentStage ? 'current' : 'next')

    // My Squad is always the face of the dashboard - drafting is only entered via explicit action
    const [isEditingCurrent, setIsEditingCurrent] = useState(false)
    const [isEditingNext, setIsEditingNext] = useState(false)

    // Context-dependent variables
    const isCurrentView = viewMode === 'current'
    const activeStage = isCurrentView ? stages.currentStage : stages.nextStage
    const activeSchoolsList = isCurrentView ? currentSchools : nextSchools
    const activeSavedLineup = isCurrentView ? currentLineup : nextLineup
    const isEditing = isCurrentView ? isEditingCurrent : isEditingNext
    const setIsEditing = isCurrentView ? setIsEditingCurrent : setIsEditingNext

    // Matchday archive switcher (null = the active tab's stage)
    const [selectedHistoryGw, setSelectedHistoryGw] = useState<string | null>(null)

    const displayedLineup: SquadHistoryEntry | null = useMemo(() => {
        if (!isEditing) {
            if (selectedHistoryGw) {
                const entry = lineupHistory.find(h => h.gameWeek === selectedHistoryGw)
                if (entry) return entry
            }
            return (activeSavedLineup as SquadHistoryEntry | null) || null
        }
        return null
    }, [isEditing, selectedHistoryGw, lineupHistory, activeSavedLineup])

    // Archive mode = the displayed squad belongs to a different matchday than this tab's stage
    const isViewingArchive = !isEditing && !!displayedLineup && !!activeStage && displayedLineup.gameWeek !== activeStage.gameWeek

    // Points breakdown modal
    const [breakdownSchool, setBreakdownSchool] = useState<School | null>(null)
    const [explanations, setExplanations] = useState<any[] | null>(null)
    const [loadingExplanation, setLoadingExplanation] = useState(false)

    const openBreakdown = (school: School) => {
        if (!displayedLineup) return
        setBreakdownSchool(school)
        setExplanations(null)
        setLoadingExplanation(true)
        getLineupPointsExplanation(displayedLineup.id, school.id)
            .then((res: any) => setExplanations(res.success ? res.explanations : []))
            .catch(() => setExplanations([]))
            .finally(() => setLoadingExplanation(false))
    }

    const [selectedSchools, setSelectedSchools] = useState<School[]>(() => {
        const initialSaved = stages.currentStage ? currentLineup : nextLineup;
        if (initialSaved?.schools) {
            return initialSaved.schools as School[];
        }
        return [];
    })
    
    // Instead of an effect, we update selected schools in the button handler below
    // when switching view modes.
    const changeViewMode = (mode: 'current' | 'next') => {
        setViewMode(mode);
        setSelectedHistoryGw(null);
        const lineup = mode === 'current' ? currentLineup : nextLineup;
        if (lineup?.schools) {
            setSelectedSchools(lineup.schools as School[]);
        } else {
            setSelectedSchools([]);
        }
    }

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRegion, setSelectedRegion] = useState("All")
    
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Calculate spent budget with robust fallback for cached payloads missing properties
    const creditsSpent = selectedSchools.reduce((sum, s) => sum + (s?.creditCost ? Number(s.creditCost) : 0), 0)
    const remainingCredits = 100 - creditsSpent

    // Calculate pending substitutions
    const originalSchoolIds = activeSavedLineup?.schools?.map((s: School) => s.id) || []
    const newSchoolIds = selectedSchools.map(s => s.id)
    const pendingSubs = newSchoolIds.filter(id => !originalSchoolIds.includes(id)).length
    const totalSubstitutions = (activeSavedLineup?.substitutionsMade || 0) + pendingSubs

    const [isLockedLocal, setIsLockedLocal] = useState(activeStage?.isLocked || false)
    const [timeLeft, setTimeLeft] = useState("")

    useEffect(() => {
        let isMounted = true;
        
        if (stages.isOffSeason || !activeStage?.deadline) {
            // Push to microtask to avoid synchronous setState during render effect
            Promise.resolve().then(() => {
                if (isMounted) {
                    setTimeLeft("Off-Season")
                    setIsLockedLocal(true)
                }
            })
            return () => { isMounted = false; }
        }

        const updateTimer = () => {
            const now = new Date()
            const timeDiff = new Date(activeStage.deadline!).getTime() - now.getTime()

            if (timeDiff <= 0) {
                if (isMounted) {
                    setIsLockedLocal(true)
                    setTimeLeft("Locked")
                }
                return
            }

            setIsLockedLocal(false)

            // Calculate hours, mins, secs
            const d = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
            const h = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const m = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
            const s = Math.floor((timeDiff % (1000 * 60)) / 1000)

            if (d > 0) {
                setTimeLeft(`${d}d ${h}h ${m}m`)
            } else {
                setTimeLeft(`${h}h ${m}m ${s}s`)
            }
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [activeStage, stages.isOffSeason])

    const handleSelect = (school: School) => {
        if (isLockedLocal) {
            setMessage({ type: "error", text: "This matchday is currently locked." })
            return
        }
        if (selectedSchools.find(s => s.id === school.id)) {
            setSelectedSchools(prev => prev.filter(s => s.id !== school.id))
            setMessage(null)
            return
        }

        if (selectedSchools.length >= 3) {
            setMessage({ type: "error", text: "You can only select exactly 3 schools for your lineup" })
            return
        }

        if (creditsSpent + school.creditCost > 100) {
            setMessage({ type: "error", text: "Adding this school would exceed your 100-credit budget" })
            return
        }

        setSelectedSchools(prev => [...prev, school])
        setMessage(null)
    }

    const handleRemove = (schoolId: string) => {
        setSelectedSchools(prev => prev.filter(s => s.id !== schoolId))
        setMessage(null)
    }

    const handleLockIn = () => {
        if (!activeStage) return;
        if (selectedSchools.length !== 3) {
            setMessage({ type: "error", text: "Please select exactly 3 schools before locking in" })
            return
        }

        startTransition(async () => {
            const schoolIds = selectedSchools.map(s => s.id)
            const result = await submitLineup(activeStage.gameWeek, schoolIds)

            if (result.success) {
                setMessage({ type: "success", text: "Lineup locked in. Ready for the matches." })
                setSelectedHistoryGw(null)
                setIsEditing(false)
                router.refresh()
            } else {
                setMessage({ type: "error", text: result.error || "Failed to submit lineup" })
            }
        })
    }

    const filteredSchools = activeSchoolsList.filter(school => {
        const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRegion = selectedRegion === "All" || school.region === selectedRegion
        return matchesSearch && matchesRegion
    })

    const getTierDetails = (tier: number | string) => {
        const t = Number(tier)
        switch (t) {
            case 1:
                return { name: "Tier 1: Giant", color: "bg-amber-500/15 text-amber-300 border border-amber-500/30" }
            case 2:
                return { name: "Tier 2: Contender", color: "bg-blue-500/15 text-blue-300 border border-blue-500/30" }
            case 3:
                return { name: "Tier 3: Challenger", color: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" }
            default:
                return { name: "Tier 4: Underdog", color: "bg-slate-500/15 text-slate-300 border border-slate-500/30" }
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-32 md:pb-8">
            {/* Page Header */}
            <div className="relative mb-8 rounded-3xl p-6 md:p-8 overflow-hidden bg-card border border-border/50 shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-6 w-6 text-amber-400" />
                            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">NSMQ Fantasy League</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold font-russo text-foreground">
                            Quiz Manager Dashboard
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Build your ultimate 3-school squad and track your live points.
                        </p>
                    </div>
                    
                    {/* View Switcher Tabs */}
                    <div className="flex bg-background/50 border border-border/50 rounded-2xl p-1">
                        {stages.currentStage && (
                            <button 
                                onClick={() => changeViewMode('current')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-standard hover:-translate-y-0 ${
                                    viewMode === 'current' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Current Matchday
                            </button>
                        )}
                        {stages.nextStage && (
                            <button 
                                onClick={() => changeViewMode('next')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-standard hover:-translate-y-0 ${
                                    viewMode === 'next' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Next Matchday
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Grand Final Predictor Banner */}
            {hasGF && (
                <div className="mb-8 rounded-3xl p-6 bg-card border border-yellow-500/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                                <Trophy className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-russo uppercase text-yellow-500">Ultimate NSMQ Predictor is Live!</h2>
                                <p className="text-sm text-slate-300">Predict the Champion, Runner-Up, Winning Margin, and activate your Final Boost.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => router.push('/fantasy/grand-final')}
                            className="w-full md:w-auto px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black uppercase tracking-wider text-sm transition-standard hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
                        >
                            Play Now
                        </button>
                    </div>
                </div>
            )}

            {/* Semi-Final Predictor Banner */}
            {hasSF && (
                <div className="mb-8 rounded-3xl p-6 bg-card border border-pink-500/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center shrink-0">
                                <Flame className="h-6 w-6 text-pink-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-russo uppercase text-pink-500">Semi-Final Confidence Challenge is Live!</h2>
                                <p className="text-sm text-slate-300">Predict the winners of all 3 matches and assign your confidence multipliers.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => router.push('/fantasy/semi-final')}
                            className="w-full md:w-auto px-6 py-3 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-black uppercase tracking-wider text-sm transition-standard hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
                        >
                            Play Now
                        </button>
                    </div>
                </div>
            )}

            {/* Quarter-Final Predictor Banner */}
            {hasQF && (
                <div className="mb-8 rounded-3xl p-6 bg-card border border-amber-500/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                <Trophy className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-russo uppercase text-amber-500">Quarter-Final Predictor is Live!</h2>
                                <p className="text-sm text-slate-300">Predict the 9 winners, pick your Wildcard and Master Pick.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => router.push('/fantasy/quarter-final')}
                            className="w-full md:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wider text-sm transition-standard hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
                        >
                            Play Now
                        </button>
                    </div>
                </div>
            )}

            {/* Stage Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-4 bg-popover/80 border border-border p-5 rounded-2xl">
                    <Trophy className="h-8 w-8 text-amber-400" />
                    <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Stage</div>
                        <div className="text-xl font-black text-foreground">{activeStage?.gameWeek || "Off-Season"}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-popover/80 border border-border p-5 rounded-2xl">
                    <Clock className={`h-8 w-8 ${isLockedLocal ? "text-rose-500" : "text-amber-400"}`} />
                    <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Deadline</div>
                        <div className={`text-xl font-black ${isLockedLocal ? "text-rose-500" : "text-foreground"}`}>{timeLeft}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-popover/80 border border-border p-5 rounded-2xl">
                    <Coins className="h-8 w-8 text-yellow-400" />
                    <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Budget</div>
                        <div className="text-xl font-black text-foreground">
                            {isEditing ? `${remainingCredits} left` : `${creditsSpent} spent`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Squad Section vs Drafting */}
            {!isEditing ? (
                // --- MY SQUAD SECTION (SWITCHER + SQUAD / ARCHIVE / PICK PROMPT) ---
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold font-russo uppercase tracking-wider text-foreground flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6" /> My Squad
                        </h2>
                        {!isViewingArchive && !isLockedLocal && !!activeSavedLineup && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:bg-accent hover:text-accent-foreground text-sm font-bold rounded-xl transition-colors"
                            >
                                <Pencil className="h-4 w-4" /> Edit Lineup
                            </button>
                        )}
                    </div>

                    {/* Matchday History Switcher (FPL-style gameweek selector) */}
                    {lineupHistory.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
                            {lineupHistory.map(entry => {
                                const isSelected = (selectedHistoryGw ?? displayedLineup?.gameWeek) === entry.gameWeek
                                const isLiveStage = entry.gameWeek === activeStage?.gameWeek
                                return (
                                    <button
                                        key={entry.id}
                                        onClick={() => setSelectedHistoryGw(entry.gameWeek)}
                                        className={`shrink-0 flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-2xl border text-left transition-standard ${
                                            isSelected
                                                ? "bg-foreground text-background border-foreground"
                                                : "bg-card/60 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                                        }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                                            {formatStageLabel(entry.gameWeek)}
                                            {!isLiveStage && <Archive className={`h-3 w-3 ${isSelected ? "text-background/70" : "text-muted-foreground/50"}`} />}
                                        </span>
                                        <span className={`text-sm font-extrabold ${isSelected ? "text-white" : "text-foreground/70"}`}>
                                            {entry.pointsEarned} pts
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {displayedLineup ? (
                        <>
                            {isViewingArchive && (
                                <div className="mb-5 inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    <Archive className="h-3.5 w-3.5" /> Archive - viewing a past matchday squad
                                </div>
                            )}

                    {displayedLineup.pointsEarned !== undefined && (
                        <div className="bg-popover/80 border border-border rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                    Points Earned - {formatStageLabel(displayedLineup.gameWeek)}
                                </h3>
                                <div className="text-4xl font-black text-foreground mt-1">{displayedLineup.pointsEarned} <span className="text-lg text-amber-400">PTS</span></div>
                            </div>
                            {isViewingArchive ? (
                                <button
                                    onClick={() => setSelectedHistoryGw(null)}
                                    className="mt-4 md:mt-0 px-4 py-2 bg-card border border-border hover:bg-accent hover:text-accent-foreground rounded-xl text-sm font-bold transition-colors"
                                >
                                    Back to Current Stage
                                </button>
                            ) : isLockedLocal && (
                                <div className="mt-4 md:mt-0 px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold">
                                    Stage Locked - Live Scoring Active
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(displayedLineup.schools as School[]).map((school: School, index: number) => {
                            const schoolPts = getSchoolBreakdownTotal(displayedLineup.pointsBreakdown, school?.id)
                            return (
                                <button
                                    key={index}
                                    onClick={() => openBreakdown(school)}
                                    className="group/card relative bg-card/90 border border-border/50 rounded-3xl p-6 pt-8 flex flex-col items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:border-border transition-standard cursor-pointer text-left"
                                >
                                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 group-hover/card:text-amber-400 transition-colors">
                                        <Chart className="h-3 w-3" /> Breakdown
                                    </span>
                                    <div className="w-12 h-12 rounded-2xl bg-foreground/10 flex items-center justify-center font-black text-xl text-foreground mb-4">
                                        {index + 1}
                                    </div>
                                    <h3 className="font-extrabold text-center text-xl leading-tight mb-2">{school.name}</h3>
                                    <p className="text-muted-foreground text-sm mb-2">{school.region} Region</p>
                                    {schoolPts > 0 && (
                                        <p className="text-emerald-400 text-sm font-black mb-2">+{schoolPts} pts</p>
                                    )}

                                    <div className="flex gap-2 w-full justify-center mt-auto pt-3">
                                        <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${getTierDetails(Number(school.tier)).color}`}>
                                            Tier {school.tier}
                                        </span>
                                        <span className="text-xs bg-background px-3 py-1.5 rounded-full border border-border font-extrabold">
                                            {school.creditCost || 0} Credits
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                            </div>
                        </>
                    ) : (
                        // --- PICK PROMPT (NO SQUAD FOR THIS STAGE YET) ---
                        <div className="relative overflow-hidden bg-card/80 border border-border/50 rounded-3xl p-10 md:p-14 text-center">
                            <div className="relative flex flex-col items-center">
                                <div className="w-16 h-16 rounded-3xl bg-foreground/10 border border-border/50 flex items-center justify-center mb-5">
                                    <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h2 className="text-2xl font-extrabold font-russo uppercase tracking-wider text-foreground">No Squad Locked In</h2>
                                <p className="text-muted-foreground text-sm mt-2 max-w-md">
                                    {activeStage
                                        ? `You haven't selected your 3-school squad for ${formatStageLabel(activeStage.gameWeek)} yet. Browse a past matchday above, or pick your team now.`
                                        : "You haven't selected your squad yet."}
                                </p>
                                {!activeStage || isLockedLocal || stages.isOffSeason ? (
                                    <div className="mt-6 px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Selection closed for this stage
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedSchools((activeSavedLineup?.schools as School[]) || [])
                                            setIsEditing(true)
                                        }}
                                        className="mt-6 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-foreground text-background hover:opacity-90 transition-standard hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                                    >
                                        Select Your Team <ArrowRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // --- DRAFTING VIEW (EDITING) ---
                <>
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold font-russo uppercase tracking-wider text-foreground flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" /> Draft Your Lineup
                            </h2>
                            <button 
                                onClick={() => {
                                    setIsEditing(false);
                                    setSelectedSchools((activeSavedLineup?.schools as School[]) || []);
                                    setMessage(null);
                                }}
                                className="text-sm font-bold text-muted-foreground hover:text-foreground underline underline-offset-4"
                            >
                                {activeSavedLineup ? "Cancel Edit" : "Back"}
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {[0, 1, 2].map(index => {
                                const school = selectedSchools[index]
                                return (
                                    <div 
                                        key={index} 
                                        className={`relative h-44 rounded-3xl border flex flex-col items-center justify-center p-4 transition-standard ${
                                            school
                                                ? "bg-card/90 border-border/50 shadow-lg"
                                                : "bg-background border-border/50 border-dashed"
                                        }`}
                                    >
                                        {school ? (
                                            <>
                                                <button
                                                    onClick={() => handleRemove(school.id)}
                                                    className="absolute top-3 right-3 text-muted-foreground hover:text-red-400 p-1 hover:bg-accent rounded-full transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>

                                                <div className="w-10 h-10 rounded-2xl bg-foreground/10 flex items-center justify-center font-bold text-foreground mb-2">
                                                    {index + 1}
                                                </div>

                                                <h3 className="font-extrabold text-center text-lg leading-tight px-4 max-w-full truncate">{school.name}</h3>
                                                <p className="text-muted-foreground text-xs mt-1">{school.region} Region</p>

                                                <div className="mt-4 flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${getTierDetails(Number(school.tier)).color}`}>
                                                        Tier {school.tier}
                                                    </span>
                                                    <span className="text-xs bg-popover px-2.5 py-1 rounded-full border border-border/50 font-extrabold text-foreground/80">
                                                        {school.creditCost || 0} Credits
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold mb-2 mx-auto">
                                                    {index + 1}
                                                </div>
                                                <p className="text-muted-foreground text-xs font-semibold">Stage Position {index + 1}</p>
                                                <span className="text-[10px] text-muted-foreground/70 mt-1 block">Select school below</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Submit Section */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/60 backdrop-blur-md border border-border/50 p-4 rounded-2xl">
                            <div className="flex items-center gap-3">
                                {message ? (
                                    message.type === 'success' ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                                    )
                                ) : (
                                    <Coins className="h-5 w-5 text-yellow-400 shrink-0" />
                                )}
                                <p className={`text-sm ${
                                    message ? (message.type === 'success' ? "text-emerald-400" : "text-rose-400") : "text-muted-foreground"
                                }`}>
                                    {message ? message.text : (
                                        pendingSubs > 0
                                            ? `Locking in will consume ${pendingSubs} substitution${pendingSubs > 1 ? 's' : ''}.`
                                            : `Budget: ${creditsSpent} spent, ${remainingCredits} remaining. (Exact 3-school lineup required)`
                                    )}
                                </p>
                            </div>

                            <button
                                onClick={handleLockIn}
                                disabled={isPending || selectedSchools.length !== 3 || isLockedLocal}
                                className={`w-full md:w-auto px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-standard hover:-translate-y-0.5 ${
                                    isLockedLocal
                                        ? "bg-background text-rose-500/50 cursor-not-allowed border border-rose-500/20"
                                        : selectedSchools.length === 3
                                            ? "bg-foreground text-background cursor-pointer hover:opacity-90"
                                            : "bg-card text-muted-foreground cursor-not-allowed border border-border/50"
                                }`}
                            >
                                {isLockedLocal ? "Draft Locked" : isPending ? "Locking in..." : (
                                    <>
                                        Lock In Lineup <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* School Selection Pool (Only show if NOT locked, or maybe just show it always but disable buttons) */}
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h2 className="text-xl font-bold font-russo uppercase tracking-wider text-foreground">Available School Draft Pool</h2>

                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search schools..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-input text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground/40"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Regions Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
                            {REGIONS.map(region => (
                                <button
                                    key={region}
                                    onClick={() => setSelectedRegion(region)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-standard whitespace-nowrap ${
                                        selectedRegion === region
                                            ? "bg-foreground text-background"
                                            : "bg-card/60 text-muted-foreground hover:text-foreground border border-border/50 hover:bg-card"
                                    }`}
                                >
                                    {region}
                                </button>
                            ))}
                        </div>

                        {/* School List Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSchools.length > 0 ? (
                                filteredSchools.map(school => {
                                    const isSelected = selectedSchools.some(s => s.id === school.id)
                                    const isFull = selectedSchools.length >= 3
                                    const wouldExceedBudget = creditsSpent + school.creditCost > 100
                                    const disabled = !isSelected && (isFull || wouldExceedBudget)
                                    const tierInfo = getTierDetails(Number(school.tier))

                                    return (
                                        <div
                                            key={school.id}
                                            className={`relative p-5 rounded-2xl border transition-standard flex items-center justify-between gap-4 ${
                                                isSelected
                                                    ? "bg-foreground/10 border-foreground/40"
                                                    : "bg-card/40 border-border/50 hover:border-border"
                                            }`}
                                        >
                                            <div>
                                                <h3 className="font-extrabold text-sm text-foreground leading-tight">{school.name}</h3>
                                                <p className="text-muted-foreground text-xs mt-0.5">{school.region} Region</p>

                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${tierInfo.color}`}>
                                                        Tier {school.tier}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-extrabold">
                                                        {school.creditCost} Credits
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleSelect(school)}
                                                disabled={disabled || isLockedLocal}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-standard cursor-pointer ${
                                                    isSelected
                                                        ? "bg-foreground text-background"
                                                        : (disabled || isLockedLocal)
                                                            ? "bg-background text-muted-foreground/50 border border-border/50 cursor-not-allowed"
                                                            : "bg-card text-foreground/80 hover:bg-muted hover:text-foreground"
                                                }`}
                                            >
                                                {isSelected ? "Remove" : "Select"}
                                            </button>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="col-span-full py-12 text-center text-muted-foreground text-sm border border-border/50 border-dashed rounded-3xl">
                                    No schools match your search or filter.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Points Breakdown Modal */}
            <Dialog open={!!breakdownSchool} onOpenChange={(open) => { if (!open) setBreakdownSchool(null) }}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border-border/60">
                    <DialogHeader>
                        <DialogTitle className="font-russo uppercase tracking-wider text-foreground flex items-center gap-2 text-lg">
                            <Chart className="h-5 w-5" /> {breakdownSchool?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs uppercase tracking-widest font-bold">
                            How your points were earned
                        </DialogDescription>
                    </DialogHeader>

                    {loadingExplanation ? (
                        <div className="py-10 flex flex-col items-center gap-3">
                            <Loader2 className="h-6 w-6 text-foreground animate-spin" />
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Crunching scores...</p>
                        </div>
                    ) : !explanations || explanations.length === 0 ? (
                        <div className="py-10 text-center">
                            <Chart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">No scored matches yet. Points appear here as soon as results are settled.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-2 pb-2">
                            {explanations.map(ex => (
                                <div key={ex.matchId} className="bg-card/70 border border-border/60 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            {ex.stage}{ex.dateLabel ? ` · ${ex.dateLabel}` : ""}
                                        </span>
                                        <span className="text-sm font-black text-emerald-400">+{ex.total} pts</span>
                                    </div>

                                    {/* Your Final Score */}
                                    <div className="flex justify-between items-center mb-3 bg-background/60 rounded-xl p-3 border border-border/40">
                                        <span className="text-xs font-black text-amber-300">{breakdownSchool?.name}</span>
                                        <span className="text-xs text-muted-foreground">{ex.base} pts</span>
                                    </div>

                                    {/* Round-by-round progression (only when data exists) */}
                                    {ex.rounds?.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold mb-3">
                                            {ex.rounds.map((r: any, i: number) => (
                                                <span key={i} className="px-2 py-1 rounded-lg bg-background border border-border text-foreground/80">
                                                    R{i + 1} {r.score}
                                                </span>
                                            ))}
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-amber-300 font-black">Final {ex.base}</span>
                                        </div>
                                    )}

                                    {/* Point Math */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                                        <span className="px-2 py-1 rounded-lg bg-background border border-border">Base {ex.base}</span>
                                        {ex.winBonus > 0 && (
                                            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Win Bonus +2</span>
                                        )}
                                        {ex.marginBonus > 0 && (
                                            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Won by 10+ +5</span>
                                        )}
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-amber-300 font-black">= {ex.total} pts</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

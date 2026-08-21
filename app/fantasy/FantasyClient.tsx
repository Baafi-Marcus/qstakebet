"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { submitLineup } from "@/lib/fantasy-actions"
import { MagnifyingGlassIcon as Search, TrophyIcon as Trophy, SparklesIcon as Sparkles, XMarkIcon as X, BanknotesIcon as Coins, ArrowRightIcon as ArrowRight, CheckCircleIcon as CheckCircle2, ExclamationCircleIcon as AlertCircle, ArrowPathRoundedSquareIcon as RefreshCw, ClockIcon as Clock, PencilIcon as Pencil } from "@heroicons/react/24/solid";

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
}

const REGIONS = [
    "All", "Ashanti", "Greater Accra", "Central", "Volta", 
    "Eastern", "Western", "Northern", "Bono", "Bono East", "Ahafo"
]

export function FantasyClient({ stages, currentSchools, currentLineup, nextSchools, nextLineup }: FantasyClientProps) {
    const router = useRouter()
    
    // Determine which stage we are viewing
    const [viewMode, setViewMode] = useState<'current' | 'next'>(stages.currentStage ? 'current' : 'next')
    
    // Determine if we are in "Drafting" or "Viewing Squad" mode
    // We auto-view squad if a lineup exists and we haven't explicitly clicked Edit
    const hasCurrentLineup = !!currentLineup?.schools?.length
    const hasNextLineup = !!nextLineup?.schools?.length
    
    const [isEditingCurrent, setIsEditingCurrent] = useState(!hasCurrentLineup)
    const [isEditingNext, setIsEditingNext] = useState(!hasNextLineup)

    // Context-dependent variables
    const isCurrentView = viewMode === 'current'
    const activeStage = isCurrentView ? stages.currentStage : stages.nextStage
    const activeSchoolsList = isCurrentView ? currentSchools : nextSchools
    const activeSavedLineup = isCurrentView ? currentLineup : nextLineup
    const isEditing = isCurrentView ? isEditingCurrent : isEditingNext
    const setIsEditing = isCurrentView ? setIsEditingCurrent : setIsEditingNext

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

    // Calculate spent budget
    const creditsSpent = selectedSchools.reduce((sum, s) => sum + s.creditCost, 0)
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
                setMessage({ type: "success", text: "Lineup locked in successfully! Ready for the matches." })
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
                return { name: "Tier 1: Giant", color: "from-amber-400 to-amber-600 text-amber-950 shadow-amber-500/20" }
            case 2:
                return { name: "Tier 2: Contender", color: "from-purple-400 to-purple-600 text-purple-950 shadow-purple-500/20" }
            case 3:
                return { name: "Tier 3: Challenger", color: "from-cyan-400 to-cyan-600 text-cyan-950 shadow-cyan-500/20" }
            default:
                return { name: "Tier 4: Underdog", color: "from-slate-400 to-slate-600 text-slate-950 shadow-slate-500/20" }
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-32 md:pb-8">
            {/* Page Header */}
            <div className="relative mb-8 rounded-3xl p-6 md:p-8 overflow-hidden bg-card border border-border/50 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-transparent to-transparent z-0" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-6 w-6 text-amber-400 animate-pulse" />
                            <span className="text-xs font-black tracking-widest text-purple-400 uppercase">NSMQ Fantasy League</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold font-russo bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                            Quiz Manager Dashboard
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Build your ultimate 3-school squad and track your live points!
                        </p>
                    </div>
                    
                    {/* View Switcher Tabs */}
                    <div className="flex bg-background/50 border border-border/50 rounded-2xl p-1">
                        {stages.currentStage && (
                            <button 
                                onClick={() => changeViewMode('current')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    viewMode === 'current' ? 'bg-purple-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Current Matchday
                            </button>
                        )}
                        {stages.nextStage && (
                            <button 
                                onClick={() => changeViewMode('next')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    viewMode === 'next' ? 'bg-purple-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Next Matchday
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stage Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-4 bg-popover/80 border border-border p-5 rounded-2xl">
                    <Trophy className="h-8 w-8 text-purple-400" />
                    <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Stage</div>
                        <div className="text-xl font-black text-foreground">{activeStage?.gameWeek || "Off-Season"}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-popover/80 border border-border p-5 rounded-2xl">
                    <Clock className={`h-8 w-8 ${isLockedLocal ? "text-rose-500" : "text-amber-400 animate-pulse"}`} />
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

            {/* Squad View vs Drafting View */}
            {!isEditing && activeSavedLineup ? (
                // --- MY SQUAD VIEW (READ ONLY) ---
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold font-russo uppercase tracking-wider text-purple-400 flex items-center gap-2">
                            <Sparkles className="h-6 w-6" /> My Squad
                        </h2>
                        {!isLockedLocal && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:bg-accent hover:text-accent-foreground text-sm font-bold rounded-xl transition-colors"
                            >
                                <Pencil className="h-4 w-4" /> Edit Lineup
                            </button>
                        )}
                    </div>
                    
                    {activeSavedLineup.pointsEarned !== undefined && (
                        <div className="bg-gradient-to-br from-purple-900/20 to-card border border-purple-500/20 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Points Earned</h3>
                                <div className="text-4xl font-black text-foreground mt-1">{activeSavedLineup.pointsEarned} <span className="text-lg text-purple-400">PTS</span></div>
                            </div>
                            {isLockedLocal && (
                                <div className="mt-4 md:mt-0 px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold">
                                    Stage Locked - Live Scoring Active
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {activeSavedLineup.schools.map((school: School, index: number) => (
                            <div key={index} className="relative bg-card/90 border border-purple-500/30 rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)] transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center font-black text-xl text-purple-400 mb-4">
                                    {index + 1}
                                </div>
                                <h3 className="font-extrabold text-center text-xl leading-tight mb-2">{school.name}</h3>
                                <p className="text-muted-foreground text-sm mb-4">{school.region} Region</p>
                                
                                <div className="flex gap-2 w-full justify-center">
                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-gradient-to-r ${getTierDetails(Number(school.tier)).color}`}>
                                        Tier {school.tier}
                                    </span>
                                    <span className="text-xs bg-background px-3 py-1.5 rounded-full border border-border font-extrabold">
                                        {school.creditCost} Credits
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // --- DRAFTING VIEW (EDITING) ---
                <>
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold font-russo uppercase tracking-wider text-purple-400 flex items-center gap-2">
                                <Sparkles className="h-5 w-5" /> Draft Your Lineup
                            </h2>
                            {activeSavedLineup && (
                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setSelectedSchools(activeSavedLineup.schools);
                                        setMessage(null);
                                    }}
                                    className="text-sm font-bold text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {[0, 1, 2].map(index => {
                                const school = selectedSchools[index]
                                return (
                                    <div 
                                        key={index} 
                                        className={`relative h-44 rounded-3xl border flex flex-col items-center justify-center p-4 transition-all duration-300 ${
                                            school
                                                ? "bg-card/90 border-purple-500/30 shadow-[0_10px_30px_rgba(168,85,247,0.1)]"
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

                                                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center font-bold text-purple-400 mb-2">
                                                    {index + 1}
                                                </div>

                                                <h3 className="font-extrabold text-center text-lg leading-tight px-4 max-w-full truncate">{school.name}</h3>
                                                <p className="text-muted-foreground text-xs mt-1">{school.region} Region</p>

                                                <div className="mt-4 flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-gradient-to-r shadow-md ${getTierDetails(Number(school.tier)).color}`}>
                                                        Tier {school.tier}
                                                    </span>
                                                    <span className="text-xs bg-popover px-2.5 py-1 rounded-full border border-border/50 font-extrabold text-foreground/80">
                                                        {school.creditCost} Credits
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
                                    <Coins className="h-5 w-5 text-purple-400 shrink-0" />
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
                                className={`w-full md:w-auto px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                    isLockedLocal
                                        ? "bg-background text-rose-500/50 cursor-not-allowed border border-rose-500/20"
                                        : selectedSchools.length === 3
                                            ? "bg-purple-600 text-white hover:bg-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.3)] cursor-pointer"
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
                                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-input text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500/50"
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
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                        selectedRegion === region
                                            ? "bg-purple-600 text-white"
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
                                            className={`relative p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                                                isSelected
                                                    ? "bg-purple-950/20 border-purple-500/40 shadow-lg"
                                                    : "bg-card/40 border-border/50 hover:border-border"
                                            }`}
                                        >
                                            <div>
                                                <h3 className="font-extrabold text-sm text-foreground leading-tight">{school.name}</h3>
                                                <p className="text-muted-foreground text-xs mt-0.5">{school.region} Region</p>

                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded bg-gradient-to-r ${tierInfo.color}`}>
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
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-purple-600 text-white"
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
        </div>
    )
}

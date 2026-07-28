"use client"

import { useState, useTransition, useEffect } from "react"
import { submitLineup } from "@/lib/fantasy-actions"
import { Search, Trophy, Sparkles, X, Coins, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Clock } from "lucide-react"

type School = {
    id: string
    name: string
    region: string
    tier: string
    creditCost: number
}

type FantasyClientProps = {
    initialSchools: School[]
    currentLineup: any | null
    activeGameWeek: string
    deadline: Date | null
}

const REGIONS = [
    "All", "Ashanti", "Greater Accra", "Central", "Volta", 
    "Eastern", "Western", "Northern", "Bono", "Bono East", "Ahafo"
]

export function FantasyClient({ initialSchools, currentLineup, activeGameWeek, deadline }: FantasyClientProps) {
    const [schoolsList] = useState<School[]>(initialSchools)
    const [selectedSchools, setSelectedSchools] = useState<School[]>(() => {
        if (currentLineup?.schools) {
            return currentLineup.schools as School[]
        }
        return []
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRegion, setSelectedRegion] = useState("All")
    
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Calculate spent budget
    const creditsSpent = selectedSchools.reduce((sum, s) => sum + s.creditCost, 0)
    const remainingCredits = 100 - creditsSpent

    // Calculate pending substitutions
    const originalSchoolIds = currentLineup?.schools?.map((s: School) => s.id) || []
    const newSchoolIds = selectedSchools.map(s => s.id)
    const pendingSubs = newSchoolIds.filter(id => !originalSchoolIds.includes(id)).length
    const totalSubstitutions = (currentLineup?.substitutionsMade || 0) + pendingSubs

    const [isLocked, setIsLocked] = useState(false)
    const [timeLeft, setTimeLeft] = useState("")

    useEffect(() => {
        if (!deadline) {
            if (activeGameWeek === "Off-Season") {
                setIsLocked(true)
                setTimeLeft("Off-Season")
            }
            return
        }

        const updateTimer = () => {
            const now = new Date()
            const timeDiff = new Date(deadline).getTime() - now.getTime()

            if (timeDiff <= 0) {
                setIsLocked(true)
                setTimeLeft("Locked")
                return
            }

            // Calculate hours, mins, secs
            const h = Math.floor(timeDiff / (1000 * 60 * 60))
            const m = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
            const s = Math.floor((timeDiff % (1000 * 60)) / 1000)

            setTimeLeft(`${h}h ${m}m ${s}s`)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [deadline, activeGameWeek])

    const handleSelect = (school: School) => {
        if (isLocked) {
            setMessage({ type: "error", text: "The draft is currently locked." })
            return
        }
        if (selectedSchools.find(s => s.id === school.id)) {
            // Remove
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
        if (selectedSchools.length !== 3) {
            setMessage({ type: "error", text: "Please select exactly 3 schools before locking in" })
            return
        }

        startTransition(async () => {
            const schoolIds = selectedSchools.map(s => s.id)
            const result = await submitLineup(activeGameWeek, schoolIds)

            if (result.success) {
                setMessage({ type: "success", text: "Lineup locked in successfully! Ready for the matches." })
            } else {
                setMessage({ type: "error", text: result.error || "Failed to submit lineup" })
            }
        })
    }

    // Filter logic
    const filteredSchools = schoolsList.filter(school => {
        const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRegion = selectedRegion === "All" || school.region === selectedRegion
        return matchesSearch && matchesRegion
    })

    // Get Tier Badge styling
    const getTierDetails = (tier: number) => {
        switch (tier) {
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
            <div className="relative mb-8 rounded-3xl p-6 md:p-8 overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-transparent to-transparent z-0" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-6 w-6 text-amber-400 animate-pulse" />
                            <span className="text-xs font-black tracking-widest text-purple-400 uppercase">NSMQ Fantasy League</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold font-russo bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                            Quiz Manager Dashboard
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Build your ultimate 3-school squad for <strong className="text-white">{activeGameWeek}</strong>.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-4 bg-slate-950/80 border border-white/10 px-5 py-3 rounded-2xl">
                            <Clock className={`h-6 w-6 ${isLocked ? "text-rose-500" : "text-amber-400 animate-pulse"}`} />
                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Deadline</div>
                                <div className={`text-xl font-black ${isLocked ? "text-rose-500" : "text-white"}`}>{timeLeft}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-950/80 border border-white/10 px-5 py-3 rounded-2xl">
                            <RefreshCw className="h-6 w-6 text-cyan-400" />
                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Substitutions</div>
                                <div className="text-xl font-black text-white">{totalSubstitutions} Made</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-950/80 border border-white/10 px-5 py-3 rounded-2xl">
                            <Coins className="h-6 w-6 text-yellow-400" />
                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Remaining Budget</div>
                                <div className="text-xl font-black text-white">{remainingCredits} / 100 Credits</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NSMQ Stage Podium View */}
            <div className="mb-10">
                <h2 className="text-lg font-bold font-russo uppercase tracking-wider mb-4 text-purple-400 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> Your Stage Lineup
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {[0, 1, 2].map(index => {
                        const school = selectedSchools[index]
                        return (
                            <div 
                                key={index} 
                                className={`relative h-44 rounded-3xl border flex flex-col items-center justify-center p-4 transition-all duration-300 ${
                                    school 
                                        ? "bg-slate-900/90 border-purple-500/30 shadow-[0_10px_30px_rgba(168,85,247,0.1)]" 
                                        : "bg-slate-950 border-white/5 border-dashed"
                                }`}
                            >
                                {school ? (
                                    <>
                                        <button 
                                            onClick={() => handleRemove(school.id)}
                                            className="absolute top-3 right-3 text-slate-500 hover:text-red-400 p-1 hover:bg-white/5 rounded-full transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        
                                        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center font-bold text-purple-400 mb-2">
                                            {index + 1}
                                        </div>

                                        <h3 className="font-extrabold text-center text-lg leading-tight px-4 max-w-full truncate">{school.name}</h3>
                                        <p className="text-slate-400 text-xs mt-1">{school.region} Region</p>
                                        
                                        <div className="mt-4 flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-gradient-to-r shadow-md ${getTierDetails(Number(school.tier)).color}`}>
                                                Tier {school.tier}
                                            </span>
                                            <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-full border border-white/5 font-extrabold text-slate-300">
                                                {school.creditCost} Credits
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 font-bold mb-2 mx-auto">
                                            {index + 1}
                                        </div>
                                        <p className="text-slate-500 text-xs font-semibold">Stage Position {index + 1}</p>
                                        <span className="text-[10px] text-slate-600 mt-1 block">Select school below</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Status Messages & Submit Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
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
                            message ? (message.type === 'success' ? "text-emerald-400" : "text-rose-400") : "text-slate-400"
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
                        disabled={isPending || selectedSchools.length !== 3 || isLocked}
                        className={`w-full md:w-auto px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            isLocked 
                                ? "bg-slate-900 text-rose-500/50 cursor-not-allowed border border-rose-500/20"
                                : selectedSchools.length === 3
                                    ? "bg-purple-600 text-white hover:bg-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.3)] cursor-pointer"
                                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                        }`}
                    >
                        {isLocked ? "Draft Locked" : isPending ? "Locking in..." : (
                            <>
                                Lock In Lineup <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* School Selection Pool */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold font-russo uppercase tracking-wider text-white">Available School Draft Pool</h2>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search schools..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-white/5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
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
                                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-slate-900"
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
                                            : "bg-slate-900/40 border-white/5 hover:border-white/10"
                                    }`}
                                >
                                    <div>
                                        <h3 className="font-extrabold text-sm text-white leading-tight">{school.name}</h3>
                                        <p className="text-slate-500 text-xs mt-0.5">{school.region} Region</p>
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded bg-gradient-to-r ${tierInfo.color}`}>
                                                Tier {school.tier}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-extrabold">
                                                {school.creditCost} Credits
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelect(school)}
                                        disabled={disabled || isLocked}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                            isSelected
                                                ? "bg-purple-600 text-white"
                                                : (disabled || isLocked)
                                                    ? "bg-slate-900 text-slate-700 border border-white/5 cursor-not-allowed"
                                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }`}
                                    >
                                        {isSelected ? "Remove" : "Select"}
                                    </button>
                                </div>
                            )
                        })
                    ) : (
                        <div className="col-span-full py-12 text-center text-slate-500 text-sm border border-white/5 border-dashed rounded-3xl">
                            No schools match your search or filter.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { BetSlipContext } from "@/lib/store/context"
import { X, Loader2, Trash2, ChevronDown, Trophy, Target, Timer, Lightbulb, Activity } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { bets } from "@/lib/db/schema"
import { placeBet } from "@/lib/bet-actions"

export function BetSlipSidebar() {
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [bookingCode, setBookingCode] = React.useState("")
    const [isBooking, setIsBooking] = React.useState(false)
    const [bookedCodeResult, setBookedCodeResult] = React.useState<string | null>(null)
    const [error, setError] = React.useState("")
    const [wallet, setWallet] = React.useState<{ balance: number, bonusBalance: number } | null>(null)
    const [betMode, setBetMode] = React.useState<'single' | 'multiple' | 'system'>('single')
    const [userBets, setUserBets] = React.useState<typeof bets.$inferSelect[]>([])
    const { status } = useSession()
    const context = React.useContext(BetSlipContext)

    const selections = context?.selections || []
    const removeSelection = context?.removeSelection || (() => { })
    const clearSlip = context?.clearSlip || (() => { })
    const stake = context?.stake || 1
    const setStake = context?.setStake || (() => { })
    const updateSelectionStake = context?.updateSelectionStake || (() => { })
    const isOpen = context?.isOpen || false
    const closeSlip = context?.closeSlip || (() => { })
    const useBonus = context?.useBonus || false
    const setUseBonus = context?.setUseBonus || (() => { })
    const addSelection = context?.addSelection || (() => { })

    // Helper for sport icons
    const getSportIcon = (sport?: string) => {
        switch (sport?.toLowerCase()) {
            case 'football': return <Trophy className="h-4 w-4 text-white" />
            case 'basketball': return <Target className="h-4 w-4 text-white" />
            case 'volleyball': return <Trophy className="h-4 w-4 text-white" />
            case 'athletics': return <Timer className="h-4 w-4 text-white" />
            case 'quiz': return <Lightbulb className="h-4 w-4 text-white" />
            default: return <Activity className="h-4 w-4 text-white" />
        }
    }

    // Fetch wallet and bets
    React.useEffect(() => {
        if (isOpen) {
            import("@/lib/wallet-actions").then(m => {
                m.getUserWalletBalance().then(w => setWallet(w))
            })
            fetch("/api/user/bets").then(res => res.json()).then(data => {
                if (data.success) setUserBets(data.bets)
            }).catch(_err => console.error("Failed to fetch bets"))
        }
    }, [isOpen])

    const handleLoadBooking = async () => {
        if (!bookingCode) return
        setIsProcessing(true)
        setError("")
        try {
            const { loadBookedBet } = await import("@/lib/bet-actions")
            const res = await loadBookedBet(bookingCode)
            if (res.success && res.selections) {
                // Add selections to context
                res.selections.forEach((sel: any) => {
                    addSelection(sel)
                })
                setBookingCode("")
            } else {
                setError(res.error || "Invalid code")
            }
        } catch (_err) {
            setError("Failed to load code")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleBookBet = async () => {
        if (!selections.length) return
        setIsBooking(true)
        setError("")
        try {
            const { bookBet } = await import("@/lib/bet-actions")
            const res = await bookBet(selections as any)
            if (res.success && res.code) {
                setBookedCodeResult(res.code)
            } else {
                setError(res.error || "Failed to book")
            }
        } catch (_err) {
            setError("System error booking bet")
        } finally {
            setIsBooking(false)
        }
    }

    const totalOdds = selections.reduce((acc, curr) => {
        // Only include active games in odds
        if ((curr as any).matchStatus === 'finished') return acc
        return acc * curr.odds
    }, 1)

    const calculatePotentialWin = () => {
        if (betMode === 'single') {
            return selections.reduce((acc, s) => {
                // Don't count finished selections in win
                if ((s as any).matchStatus === 'finished') return acc
                const sStake = s.stake || stake
                return acc + (sStake * s.odds)
            }, 0)
        }

        // Multiples: only if all games are active (checked in buttons later)
        return stake * totalOdds
    }

    const totalStake = betMode === 'single'
        ? selections.reduce((acc, s) => acc + (s.stake || stake), 0)
        : stake

    const potentialWin = calculatePotentialWin()

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={closeSlip}
            />

            {/* Betslip Sidebar */}
            <div
                className={cn(
                    "bg-slate-900 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-[90] fixed shadow-2xl overflow-hidden",
                    // Mobile: Bottom sheet
                    "bottom-0 left-0 right-0 h-full rounded-t-3xl",
                    isOpen ? "translate-y-0" : "translate-y-full",
                    // Desktop: Right sidebar
                    "lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto lg:h-screen lg:w-[420px] lg:rounded-none lg:translate-y-0",
                    isOpen ? "lg:translate-x-0" : "lg:translate-x-full"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Collapse Handle (Mobile) */}
                <div className="lg:hidden flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
                </div>

                {/* Header with Badge */}
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/95">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {/* Selection Count Badge */}
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-black text-sm">{selections.length}</span>
                            </div>

                            {/* REAL Badge (no toggle) */}
                            <div className="px-3 py-1 bg-green-500 rounded-full">
                                <span className="text-white text-xs font-black uppercase">REAL</span>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={closeSlip}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-all"
                        >
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Remove All Button */}
                    <div className="flex items-center">
                        <button
                            onClick={clearSlip}
                            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            Remove All
                        </button>
                    </div>
                </div>

                {/* Bet Mode Tabs (Single/Multiple/System) */}
                <div className="grid grid-cols-3 gap-0 bg-slate-800/50">
                    {(['single', 'multiple', 'system'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setBetMode(mode)}
                            className={cn(
                                "py-4 text-sm font-bold uppercase transition-all border-b-2",
                                betMode === mode
                                    ? "bg-slate-800 text-white border-white"
                                    : "text-slate-500 border-transparent hover:text-slate-300"
                            )}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {/* Booking Code Section - Hide if selections are present */}
                {selections.length === 0 && (
                    <div className="bg-slate-800/30 px-4 py-4 border-b border-slate-800">
                        <div className="flex items-center gap-2 mb-2 text-slate-300">
                            <span className="text-sm font-bold">Please insert booking code</span>
                            <Activity className="h-3 w-3 opacity-50" />
                        </div>
                        <div className="flex gap-0 rounded-lg overflow-hidden border border-slate-700 focus-within:border-green-500 transition-all">
                            <input
                                type="text"
                                placeholder="Booking Code"
                                value={bookingCode}
                                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && handleLoadBooking()}
                                className="flex-1 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none uppercase font-mono tracking-wider"
                            />
                            <button
                                onClick={handleLoadBooking}
                                disabled={isProcessing || !bookingCode}
                                className="bg-slate-700 hover:bg-slate-600 px-6 py-2 text-sm font-bold text-slate-300 transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                            >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Selections List */}
                {selections.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <X className="h-8 w-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 text-sm font-bold">No selections added</p>
                        <p className="text-slate-600 text-xs mt-2">Add matches to your betslip to get started</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
                            {selections.map((item) => (
                                <div key={item.selectionId} className="bg-slate-800/80 rounded-xl p-4 relative group">
                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeSelection(item.selectionId)}
                                        className="absolute top-3 left-3 p-1 bg-slate-700 hover:bg-red-500 rounded-md transition-all"
                                    >
                                        <X className="h-4 w-4 text-white" />
                                    </button>

                                    <div className="flex items-start gap-3 pl-8">
                                        {/* Dynamic Sport Icon */}
                                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            {getSportIcon(item.sportType)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Selection Name */}
                                            <div className="text-white font-bold text-base mb-1">
                                                {item.label}
                                                {(item as any).matchStatus === 'finished' && (
                                                    <span className="ml-2 text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-black">Finished</span>
                                                )}
                                            </div>
                                            {/* Match Name */}
                                            <div className="text-slate-400 text-sm font-medium mb-1">{item.matchLabel}</div>
                                            {/* Market Type - Hide if finished */}
                                            {(item as any).matchStatus !== 'finished' && (
                                                <div className="text-slate-500 text-xs font-bold uppercase">{item.marketName}</div>
                                            )}

                                            {/* Match Result Display */}
                                            {(item as any).matchStatus === 'finished' && (item as any).matchResult && (
                                                <div className="mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Final Result</div>
                                                    <div className="text-xs text-white font-bold">
                                                        {Object.entries((item as any).matchResult.scores || {}).map(([id, score], idx, arr) => (
                                                            <span key={id}>
                                                                {score as number}{idx < arr.length - 1 ? ' - ' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Odds */}
                                        <div className="text-right flex-shrink-0">
                                            <div className={cn(
                                                "text-white font-black text-xl",
                                                (item as any).matchStatus === 'finished' && "opacity-30 line-through"
                                            )}>
                                                {item.odds.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Single Stake Input */}
                                    {betMode === 'single' && (
                                        <div className="mt-3 pt-3 border-t border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400 text-xs font-bold">Stake</span>
                                                <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-1.5">
                                                    <span className="text-slate-400 text-xs">GHS</span>
                                                    <input
                                                        type="number"
                                                        value={item.stake || stake}
                                                        onChange={(e) => updateSelectionStake(item.selectionId, Math.max(0, Number(e.target.value)))}
                                                        className="w-16 bg-transparent text-right font-bold text-sm text-white focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Bonus Prompt (Green Bar) */}
                        {wallet && wallet.bonusBalance > 0 && (
                            <div className="px-4 py-2 bg-green-600/90">
                                <button
                                    onClick={() => setUseBonus(!useBonus)}
                                    className="w-full text-white text-xs font-bold text-center"
                                >
                                    {useBonus
                                        ? `Using GHS ${wallet.bonusBalance.toFixed(2)} bonus`
                                        : "Add more qualifying selections to boost your bonus"}
                                </button>
                            </div>
                        )}

                        {/* Bottom Section */}
                        <div className="bg-slate-900 border-t border-slate-800">
                            {/* Total Stake Input */}
                            <div className="px-4 py-4 flex items-center justify-between">
                                <span className="text-white font-bold text-sm">Total Stake</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm font-bold">GHS</span>
                                    <input
                                        type="number"
                                        value={betMode === 'single' ? totalStake.toFixed(2) : stake}
                                        onChange={(e) => betMode !== 'single' && setStake(Math.max(0, Number(e.target.value)))}
                                        disabled={betMode === 'single'}
                                        className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-right font-bold text-white focus:outline-none focus:border-green-500 disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-0">
                                {status === "unauthenticated" ? (
                                    <>
                                        <Link
                                            href="/auth/login"
                                            className="py-5 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm uppercase transition-all border-r border-slate-700 flex items-center justify-center"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/auth/register"
                                            className="py-5 bg-green-600 hover:bg-green-500 text-white font-black text-sm uppercase transition-all flex items-center justify-center"
                                        >
                                            Register
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleBookBet}
                                            disabled={isBooking || selections.length === 0}
                                            className="py-5 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm uppercase transition-all border-r border-slate-700 flex items-center justify-center gap-2"
                                        >
                                            {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book Bet"}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                // Check for finished games
                                                const hasFinished = selections.some((s: any) => s.matchStatus === 'finished')
                                                if (hasFinished) {
                                                    setError("Please remove finished games to place bet")
                                                    return
                                                }

                                                if (isProcessing) return
                                                setIsProcessing(true)
                                                setError("")
                                                try {
                                                    if (betMode === 'single') {
                                                        for (const sel of selections) {
                                                            await placeBet(sel.stake || stake, [sel], useBonus)
                                                        }
                                                        clearSlip()
                                                        setUseBonus(false)
                                                        closeSlip()
                                                        window.location.reload()
                                                    } else {
                                                        const result = await placeBet(stake, selections, useBonus)
                                                        if (result.success) {
                                                            clearSlip()
                                                            setUseBonus(false)
                                                            closeSlip()
                                                            window.location.reload()
                                                        } else {
                                                            const resultWithError = result as { success: false; error: string }
                                                            setError(resultWithError.error || "Failed to place bet")
                                                        }
                                                    }
                                                } catch (_err) {
                                                    setError("A system error occurred")
                                                } finally {
                                                    setIsProcessing(false)
                                                }
                                            }}
                                            disabled={isProcessing || totalStake < 1}
                                            className="py-5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-sm uppercase transition-all flex flex-col items-center justify-center gap-1"
                                        >
                                            {isProcessing ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Processing...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <span>Place Bet</span>
                                                    <span className="text-xs font-normal">
                                                        {selections.some((s: any) => s.matchStatus === 'finished')
                                                            ? "Remove finished games"
                                                            : `About to pay ${totalStake.toFixed(2)}`
                                                        }
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Deposit Link */}
                            {status === "authenticated" && (
                                <Link
                                    href="/account/wallet"
                                    onClick={closeSlip}
                                    className="block p-3 text-center text-xs font-bold text-green-500 hover:bg-green-500/10 transition-colors border-t border-slate-800"
                                >
                                    Deposit Funds
                                </Link>
                            )}

                            {error && (
                                <p className="text-xs text-red-500 text-center py-2 font-bold animate-pulse">
                                    {error}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { BetSlipContext } from "@/lib/store/context"
import { X, Loader2, Trash2, ChevronDown, Trophy, Target, Timer, Lightbulb, Activity, Gift } from "lucide-react"
import { BookingSuccessModal } from "@/components/ui/BookingSuccessModal"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { bets } from "@/lib/db/schema"
import { placeBet, bookBet, loadBookedBet } from "@/lib/bet-actions"
import { FINANCE_LIMITS, MULTI_BONUS } from "@/lib/constants"

export function BetSlipSidebar() {
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [bookingCode, setBookingCode] = React.useState("")
    const [isBooking, setIsBooking] = React.useState(false)
    const [bookedCodeResult, setBookedCodeResult] = React.useState<string | null>(null)
    const [error, setError] = React.useState("")
    const [wallet, setWallet] = React.useState<{ balance: number, bonusBalance: number } | null>(null)
    const [gifts, setGifts] = React.useState<any[]>([])
    const [betMode, setBetMode] = React.useState<'single' | 'multiple' | 'system'>('single')
    const [userBets, setUserBets] = React.useState<typeof bets.$inferSelect[]>([])
    const [showGiftModal, setShowGiftModal] = React.useState(false)
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
    const bonusId = context?.bonusId
    const setBonusId = context?.setBonusId || (() => { })
    const bonusAmount = context?.bonusAmount || 0
    const setBonusAmount = context?.setBonusAmount || (() => { })
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

    // Fetch wallet, gifts and bets
    React.useEffect(() => {
        if (isOpen) {
            import("@/lib/wallet-actions").then(m => {
                m.getUserWalletBalance().then(w => setWallet(w))
            })
            import("@/lib/user-actions").then(m => {
                m.getUserGifts().then(res => {
                    if (res.success) setGifts(res.gifts)
                })
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
            const res = await bookBet(selections as any)
            if (res.success && res.code) {
                setBookedCodeResult(res.code)
                closeSlip() // Close the sidebar so modal is centered visible
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

    // NEW: Bonus Calculation logic
    const getBonusDetails = () => {
        if (betMode !== 'multiple' || selections.length < MULTI_BONUS.MIN_SELECTIONS) {
            return { bonusPct: 0, bonusAmount: 0, cappedBonus: 0 };
        }

        const count = selections.length;
        let bonusPct = 0;

        Object.entries(MULTI_BONUS.SCALING)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .some(([threshold, percent]) => {
                if (count >= Number(threshold)) {
                    bonusPct = Number(percent);
                    return true;
                }
                return false;
            });

        const baseWin = potentialWin;
        const bonusAmount = baseWin * (bonusPct / 100);
        const cappedBonus = Math.min(bonusAmount, MULTI_BONUS.MAX_BONUS_AMOUNT_CAP);

        return { bonusPct, bonusAmount, cappedBonus };
    };

    const { cappedBonus } = getBonusDetails();
    const finalPotentialWin = potentialWin + cappedBonus;

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

                {/* Bet Mode Tabs (Single/Multiple) */}
                <div className="grid grid-cols-2 gap-0 bg-slate-800/50">
                    {(['single', 'multiple'] as const).map((mode) => (
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


                {/* Stake All Input for Singles */}
                {betMode === 'single' && selections.length > 0 && (
                    <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-slate-300 text-xs font-bold uppercase">Stake All</span>
                        <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-700 w-32">
                            <span className="text-slate-500 text-xs font-bold">GHS</span>
                            <input
                                type="number"
                                placeholder={FINANCE_LIMITS.BET.MIN_STAKE.toString()}
                                className="bg-transparent text-right font-bold text-sm text-white focus:outline-none w-full"
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) {
                                        selections.forEach(s => updateSelectionStake(s.selectionId, val));
                                    }
                                }}
                            />
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
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50 relative">
                            {/* Booking Success Modal (Centered) */}
                            {bookedCodeResult && (
                                <BookingSuccessModal
                                    code={bookedCodeResult}
                                    selections={selections}
                                    totalOdds={totalOdds}
                                    onClose={() => setBookedCodeResult(null)}
                                />
                            )}

                            {selections.map((item) => (
                                <div key={item.selectionId} className="py-3 border-b border-white/5 relative group last:border-0">
                                    <div className="flex items-start gap-2.5">
                                        {/* Dynamic Sport Icon - Smaller */}
                                        <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/5">
                                            {getSportIcon(item.sportType)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                {/* Selection Name */}
                                                <div className="text-white font-black text-sm truncate">
                                                    {item.label}
                                                    {(item as any).matchStatus === 'finished' && (
                                                        <span className="ml-2 text-[8px] bg-red-500/20 text-red-500 px-1 py-0.5 rounded uppercase font-black">Finished</span>
                                                    )}
                                                </div>

                                                {/* Odds & Remove */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <div className={cn(
                                                        "text-white font-black text-base",
                                                        (item as any).matchStatus === 'finished' && "opacity-30 line-through"
                                                    )}>
                                                        {item.odds.toFixed(2)}
                                                    </div>
                                                    <button
                                                        onClick={() => removeSelection(item.selectionId)}
                                                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Combined Match & Market Name */}
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-slate-400 text-[10px] font-bold truncate max-w-[120px]">{item.matchLabel}</span>
                                                <span className="text-slate-600 text-[10px]">•</span>
                                                <span className="text-slate-500 text-[10px] font-black uppercase truncate">{item.marketName}</span>
                                            </div>

                                            {/* Match Result Display - Compact */}
                                            {(item as any).matchStatus === 'finished' && (item as any).matchResult && (
                                                <div className="mt-1.5 py-1 px-2 bg-slate-800/50 rounded flex items-center gap-2 border border-white/5">
                                                    <span className="text-[8px] text-slate-500 uppercase font-black">Result</span>
                                                    <span className="text-[10px] text-white font-black">
                                                        {Object.entries((item as any).matchResult.scores || {}).map(([id, score], idx, arr) => (
                                                            <React.Fragment key={id}>
                                                                {score as number}{idx < arr.length - 1 ? ' - ' : ''}
                                                            </React.Fragment>
                                                        ))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Single Stake Input - Compact */}
                                    {betMode === 'single' && (
                                        <div className="mt-2.5 flex items-center justify-between gap-4">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Stake</span>
                                            <div className="flex items-center gap-1.5 bg-slate-800/50 rounded-lg px-2 py-1 border border-white/5">
                                                <span className="text-[10px] font-bold text-slate-600">GHS</span>
                                                <input
                                                    type="number"
                                                    value={item.stake || stake}
                                                    onChange={(e) => updateSelectionStake(item.selectionId, Math.max(0, Number(e.target.value)))}
                                                    className="w-14 bg-transparent text-right font-black text-xs text-white focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Unified Compact Summary Card */}
                        <div className="bg-slate-900 border-t border-slate-800 p-2 space-y-2">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-800/50 rounded-lg p-2 border border-slate-800">
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Total Stake</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-500">GHS</span>
                                        {betMode === 'single' ? (
                                            <span className="text-sm font-black text-white">{(totalStake - (useBonus ? bonusAmount : 0)).toFixed(2)}</span>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={stake}
                                                    disabled={useBonus && bonusAmount >= stake}
                                                    onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
                                                    className="bg-transparent text-sm font-black text-white w-14 focus:outline-none border-b border-dashed border-slate-600 focus:border-green-500 transition-colors disabled:opacity-50"
                                                />
                                                {useBonus && (
                                                    <span className="text-[10px] font-bold text-slate-500 line-through">
                                                        {stake.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {useBonus && (
                                        <div className="mt-0.5 flex items-center gap-1 text-[8px] font-black text-purple-400 uppercase">
                                            <Gift className="h-2 w-2" />
                                            -{bonusAmount.toFixed(2)} Gift Applied
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        {gifts.length > 0 && (
                                            <button
                                                onClick={() => setShowGiftModal(true)}
                                                className={cn(
                                                    "p-1 rounded transition-all border",
                                                    useBonus ? "bg-purple-600 border-purple-500 text-white" : "bg-slate-900 border-white/5 text-purple-400 hover:bg-slate-800"
                                                )}
                                            >
                                                <Gift className="h-3 w-3" />
                                            </button>
                                        )}
                                        <span className="text-[9px] uppercase font-bold text-slate-500">Total Odds</span>
                                    </div>
                                    <span className="text-sm font-black text-white">{totalOdds.toFixed(2)}</span>
                                </div>
                                <div className="col-span-1">
                                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Max Bonus</span>
                                    <span className="text-sm font-black text-green-500">
                                        {cappedBonus.toFixed(2)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Potential Win</span>
                                    <div className="text-base font-black text-white tracking-tight leading-none">
                                        GHS {finalPotentialWin.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden">
                                {status === "unauthenticated" ? (
                                    <>
                                        <Link
                                            href="/auth/login"
                                            className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs md:text-sm uppercase transition-all flex items-center justify-center"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/auth/register"
                                            className="py-3 bg-green-600 hover:bg-green-500 text-white font-black text-xs md:text-sm uppercase transition-all flex items-center justify-center"
                                        >
                                            Register
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleBookBet}
                                            disabled={isBooking || selections.length === 0}
                                            className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs md:text-sm uppercase transition-all flex items-center justify-center gap-2 border-r border-slate-700"
                                        >
                                            {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book Bet"}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (selections.some((s: any) => s.matchStatus === 'finished')) {
                                                    setError("Please remove finished games")
                                                    return
                                                }
                                                if (totalStake < FINANCE_LIMITS.BET.MIN_STAKE) {
                                                    setError(`Min stake is GHS ${FINANCE_LIMITS.BET.MIN_STAKE}`)
                                                    return
                                                }

                                                if (isProcessing) return
                                                setIsProcessing(true)
                                                setError("")
                                                try {
                                                    if (betMode === 'single') {
                                                        for (const sel of selections) {
                                                            if ((sel.stake || stake) >= FINANCE_LIMITS.BET.MIN_STAKE) {
                                                                await placeBet(sel.stake || stake, [sel], bonusId, bonusAmount)
                                                            }
                                                        }
                                                        clearSlip()
                                                        closeSlip()
                                                        window.location.reload()
                                                    } else {
                                                        const result = await placeBet(stake, selections, bonusId, bonusAmount)
                                                        if (result.success) {
                                                            clearSlip()
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
                                            disabled={isProcessing || totalStake < FINANCE_LIMITS.BET.MIN_STAKE}
                                            className="py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-xs md:text-sm uppercase transition-all flex flex-col items-center justify-center"
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                "Place Bet"
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
                                    className="block text-center text-[9px] font-bold text-green-500 hover:text-green-400 transition-colors uppercase tracking-widest mt-1"
                                >
                                    Deposit Funds
                                </Link>
                            )}

                            {error && (
                                <p className="text-xs text-red-500 text-center font-bold animate-pulse">
                                    {error}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Gift Selection Modal */}
            {
                showGiftModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowGiftModal(false)} />
                        <div className="relative bg-[#1a1c23] w-full max-w-[340px] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-purple-600/20 rounded-2xl">
                                        <Gift className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Select Gift</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Balance</p>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                    {gifts.map((gift) => (
                                        <div
                                            key={gift.id}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all cursor-pointer group",
                                                bonusId === gift.id ? "bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/20" : "bg-slate-900 border-white/5 hover:border-purple-500/50"
                                            )}
                                            onClick={() => {
                                                setBonusId(gift.id)
                                                setBonusAmount(Math.min(gift.amount, totalStake))
                                            }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className={cn("block text-[10px] font-black uppercase tracking-tighter mb-0.5", bonusId === gift.id ? "text-purple-200" : "text-slate-500")}>{gift.type}</span>
                                                    <span className={cn("text-lg font-black", bonusId === gift.id ? "text-white" : "text-slate-200")}>GHS {gift.amount.toFixed(2)}</span>
                                                </div>
                                                {bonusId === gift.id && (
                                                    <div className="h-5 w-5 bg-white rounded-full flex items-center justify-center">
                                                        <div className="h-2.5 w-2.5 bg-purple-600 rounded-full" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {bonusId && (
                                    <div className="mt-6 pt-6 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Use Amount</span>
                                            <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2 border border-white/5">
                                                <span className="text-xs font-bold text-slate-600">GHS</span>
                                                <input
                                                    type="number"
                                                    value={bonusAmount}
                                                    onChange={(e) => {
                                                        const gift = gifts.find(g => g.id === bonusId)
                                                        if (gift) {
                                                            const val = Math.max(0, Math.min(gift.amount, Number(e.target.value)))
                                                            setBonusAmount(val)
                                                        }
                                                    }}
                                                    className="w-20 bg-transparent text-right font-black text-sm text-white focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    const gift = gifts.find(g => g.id === bonusId)
                                                    if (gift) setBonusAmount(gift.amount)
                                                }}
                                                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase rounded-lg transition-all"
                                            >
                                                Use Max
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setBonusAmount(0)
                                                    setBonusId(undefined)
                                                }}
                                                className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-lg transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mt-8">
                                    <button
                                        onClick={() => {
                                            setBonusId(undefined)
                                            setBonusAmount(0)
                                            setUseBonus(false)
                                            setShowGiftModal(false)
                                        }}
                                        className="py-4 bg-slate-900 hover:bg-slate-800 text-slate-500 font-black text-[10px] uppercase rounded-2xl transition-all"
                                    >
                                        Clear Selection
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUseBonus(!!bonusId)
                                            setShowGiftModal(false)
                                        }}
                                        className="py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase rounded-2xl transition-all shadow-lg shadow-purple-500/20"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )
}

'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { VirtualsHeader } from '../components/VirtualsHeader'
import { BetSlipContext } from '@/lib/store/context'
import { useRouter } from 'next/navigation'
import { simulateQPenaltyMatch } from '@/lib/q-penalty-engine'
import { generateQPenaltyMarkets, evaluateQPenaltyBet, checkQPenaltyCorrelation } from '@/lib/q-penalty-odds'
import { useQPenaltyMatchLoop } from '@/hooks/useQPenaltyMatchLoop'
import { VirtualSelection } from '@/lib/virtuals'
import { ShieldAlert, Info, Trophy, Timer, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { audio } from '@/lib/audio'
import { QPenaltyLivePlayer } from './components/QPenaltyLivePlayer'
import { QPenaltyGoalView } from './components/QPenaltyGoalView'
import { placeBet } from '@/lib/bet-actions'
import { getUserWalletBalance } from '@/lib/wallet-actions'
import { getUserGifts } from '@/lib/user-actions'
import { settleQPenaltyBet, getPlayableSchools } from '@/lib/virtual-actions'
import { VirtualGameHistory } from '../components/VirtualGameHistory'
import { GiftSelectionModal } from '@/components/ui/GiftSelectionModal'
import { QGamesBetSlip } from '../components/QGamesBetSlip'

interface QPenaltyClientProps {
    userProfile?: { balance: number; bonusBalance: number };
    isAuthenticated?: boolean;
}

export default function QPenaltyClient({ userProfile = { balance: 0, bonusBalance: 0 }, isAuthenticated = false }: QPenaltyClientProps) {
    const router = useRouter()
    const gameState = useQPenaltyMatchLoop()
    const context = React.useContext(BetSlipContext)

    const [currentBalance, setCurrentBalance] = useState(userProfile.balance)
    const [currentBonusBalance, setCurrentBonusBalance] = useState(userProfile.bonusBalance)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [previousResult, setPreviousResult] = useState<string>('AWAITING MATCH')
    const [selections, setSelections] = useState<VirtualSelection[]>([])
    const [isBetSlipOpen, setIsBetSlipOpen] = useState(false)

    const [showExitConfirm, setShowExitConfirm] = useState(false)
    const [showGiftModal, setShowGiftModal] = useState(false)

    const [placedBets, setPlacedBets] = useState<any[]>([]) // Pending in current UI
    const [betHistory, setBetHistory] = useState<any[]>([]) // Separate Q-Penalty history
    const [playableSchools, setPlayableSchools] = useState<any[]>([])
    const [userGifts, setUserGifts] = useState<any[]>([])

    // Navigation Guard
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (placedBets.some(b => b.status === 'PENDING') || selections.length > 0) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [placedBets, selections.length])

    // Persistence & Sync
    useEffect(() => {
        const refresh = async () => {
            const result = await getUserWalletBalance()
            setCurrentBalance(result.balance)
            setCurrentBonusBalance(result.bonusBalance)
            
            const [schools, gifts] = await Promise.all([
                getPlayableSchools('university'),
                getUserGifts()
            ])
            setPlayableSchools(schools)
            if (gifts.success) setUserGifts(gifts.gifts)

            // Move storage logic here to avoid synchronous setState warning
            const savedHistory = localStorage.getItem('q_penalty_history')
            if (savedHistory) {
                const history = JSON.parse(savedHistory)
                setBetHistory(history)
                if (history.length > 0 && history[0].outcome) {
                    const outcome = history[0].outcome
                    const winner = outcome.winner === 'A' ? outcome.teamA : outcome.teamB
                    setPreviousResult(`${winner.shortName} (${outcome.scoreA}-${outcome.scoreB})`)
                }
            }
        }
        refresh()
    }, [])

    useEffect(() => {
        localStorage.setItem('q_penalty_history', JSON.stringify(betHistory))
    }, [betHistory])

    // Match outcome generation
    const { outcome, markets } = useMemo(() => {
        const matchId = `QP-${gameState.roundId}-${gameState.matchSeed}`
        const sim = simulateQPenaltyMatch(matchId, gameState.matchSeed, gameState.timestamp, playableSchools)
        const mkts = generateQPenaltyMarkets(sim)
        return { outcome: sim, markets: mkts }
    }, [gameState.matchSeed, gameState.roundId, gameState.timestamp, playableSchools])

    // Settlement
    useEffect(() => {
        if (gameState.phase === 'SETTLEMENT') {
            const processSettlement = async () => {
                const pending = placedBets.filter(b => b.status === 'PENDING')
                if (pending.length === 0) return

                for (const bet of pending) {
                    const result = await settleQPenaltyBet(bet.id, gameState.matchSeed, gameState.timestamp)
                    if (result.success) {
                        const status = (result as any).status?.toUpperCase() || 'WON'
                        setPlacedBets(prev => prev.map(b => b.id === bet.id ? { ...b, status } : b))
                        // Also Add to history
                        setBetHistory(prev => [{
                             ...bet, 
                             status,
                             outcome: outcome // Save outcome for later viewing
                        }, ...prev].slice(0, 50))
                    }
                }
                
                // Refresh balance
                const wallet = await getUserWalletBalance()
                setCurrentBalance(wallet.balance)
                setCurrentBonusBalance(wallet.bonusBalance)
            }
            processSettlement()
        }
        if (gameState.phase === 'RESET') {
            const handleReset = async () => {
                setSelections([])
                const winner = outcome.winner === 'A' ? outcome.teamA : outcome.teamB
                setPreviousResult(`${winner.shortName} (${outcome.scoreA}-${outcome.scoreB})`)
                // Refresh balance one last time for the user
                const wallet = await getUserWalletBalance()
                setCurrentBalance(wallet.balance)
                setCurrentBonusBalance(wallet.bonusBalance)
            }
            handleReset()
        }
    }, [gameState.phase, outcome, placedBets, gameState.matchSeed, gameState.timestamp])

    const handlePlaceBet = async (stake: number, totalOdds: number, potentialPayout: number) => {
        if (!isAuthenticated) {
             alert("Please login to place bets")
             return
        }

        const bonusId = context?.bonusId
        const bonusAmount = context?.balanceType === 'gift' ? stake : 0

        const result = await placeBet(stake, selections as any, bonusId, bonusAmount, 'multi')
        
        if (result.success) {
            const betId = (result as any).betId
            setPlacedBets(prev => [...prev, {
                id: betId,
                stake,
                selections: [...selections],
                status: 'PENDING',
                payout: potentialPayout,
                timestamp: Date.now()
            }])
            
            // Refresh balance
            const wallet = await getUserWalletBalance()
            setCurrentBalance(wallet.balance)
            setCurrentBonusBalance(wallet.bonusBalance)

            haptics.success()
            audio.success()
            setSelections([])
        } else {
            alert((result as any).error || "Failed to place bet")
        }
    }

    const isLocked = gameState.phase !== 'BETTING_OPEN'
    const hasConflicts = checkQPenaltyCorrelation(selections)

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <VirtualsHeader
                onBack={() => {
                    if (placedBets.some(b => b.status === 'PENDING') || selections.length > 0) {
                        setShowExitConfirm(true)
                    } else {
                        router.push('/virtuals')
                    }
                }}
                selectedCategory="all"
                onCategoryChange={() => { }}
                setSelectedRegion={() => { }}
                availableRegions={[]}
                balance={currentBalance}
                bonusBalance={currentBonusBalance}
                hasPendingBets={placedBets.some(b => b.status === 'PENDING')}
                onOpenHistory={() => setIsHistoryOpen(true)}
                isAuthenticated={isAuthenticated}
                isSimulationActive={gameState.phase !== 'BETTING_OPEN'}
                onNextRound={() => { }}
                disableSkip={true}
                setLocalShowGiftModal={setShowGiftModal}
                customSubNavNode={
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-wrap">Last Round:</span>
                        <span className="text-xs font-black text-emerald-400">{previousResult}</span>
                    </div>
                }
            />

            <main className="flex-1 overflow-y-auto scrollbar-nav">
                {/* Visual Section: Scoreboard & Pitch */}
                <div className="flex flex-col">
                    <QPenaltyLivePlayer outcome={outcome} gameState={gameState} />
                    
                    {/* The Pitch/Goal Area */}
                    <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-slate-900 border-b border-white/5 relative overflow-hidden bg-gradient-to-b from-slate-900 to-emerald-950/20">
                         <QPenaltyGoalView outcome={outcome} gameState={gameState} />
                         
                         {/* Phase Overlay */}
                         <div className="absolute top-4 left-4 z-30 flex flex-col items-start">
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1">
                                 {gameState.phase.replace('_', ' ')}
                             </span>
                             <div className="text-3xl font-black font-mono text-emerald-400">
                                 {gameState.timeRemaining}s
                             </div>
                         </div>

                         {/* Commentary Overlay (Lowered and cleaned) */}
                         {gameState.phase === 'IN_PROGRESS' && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                                <div className="bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4">
                                    <span className="text-sm font-black text-white italic uppercase tracking-wider">
                                        {outcome.commentary[Math.floor((30 - gameState.timeRemaining) / 3)] || "Intense Shootout..."}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Markets Section - Auto-hide during match */}
                <div className={cn(
                    "p-4 space-y-6 pb-32 transition-all duration-700 ease-in-out",
                    gameState.phase === 'IN_PROGRESS' ? "opacity-0 h-0 overflow-hidden pointer-events-none translate-y-20" : "opacity-100"
                )}>
                    {markets.map(market => (
                        <div key={market.id} className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{market.name}</h3>
                                <Info className="h-3.5 w-3.5 text-slate-700" />
                            </div>
                            <div className={cn(
                                "grid gap-2",
                                market.selections.length === 3 ? "grid-cols-3" : "grid-cols-2"
                            )}>
                                {market.selections.map(sel => {
                                    const isSelected = selections.some(s => s.selectionId === sel.id)
                                    return (
                                        <button
                                            key={sel.id}
                                            disabled={isLocked}
                                            onClick={() => {
                                                haptics.light()
                                                audio.light()
                                                if (isSelected) {
                                                    setSelections(prev => prev.filter(s => s.selectionId !== sel.id))
                                                } else {
                                                    setSelections(prev => [...prev, {
                                                        matchId: outcome.matchId,
                                                        matchLabel: `${outcome.teamA.shortName} vs ${outcome.teamB.shortName}`,
                                                        marketName: market.name,
                                                        selectionId: sel.id,
                                                        label: sel.label,
                                                        odds: sel.odds,
                                                        sportType: 'quiz'
                                                    } as unknown as VirtualSelection])
                                                }
                                            }}
                                            className={cn(
                                                "p-3 rounded-2xl border flex flex-col items-center justify-center transition-all min-h-[64px]",
                                                isSelected
                                                    ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                                    : 'bg-slate-900 border-white/5 active:scale-95 disabled:opacity-50'
                                            )}
                                        >
                                            <span className="text-[10px] font-black uppercase text-center opacity-70 mb-0.5">{sel.label}</span>
                                            <span className="font-mono font-black text-base">{sel.odds.toFixed(2)}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Floating Betslip */}
            {selections.length > 0 && !isBetSlipOpen && (
                <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
                    <button 
                        onClick={() => setIsBetSlipOpen(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-10 active:scale-95 transition-all"
                    >
                        <div className="flex flex-col items-start">
                             <span className="text-[10px] font-black uppercase opacity-70">Review Bet</span>
                             <span className="text-sm font-black">{selections.length} Selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="h-8 w-[1px] bg-white/20" />
                             <div className="text-right">
                                  <span className="text-[10px] font-black uppercase opacity-70">Closes In</span>
                                  <div className="text-sm font-black font-mono">{gameState.timeRemaining}s</div>
                             </div>
                        </div>
                    </button>
                </div>
            )}

            {/* FULL SCREEN BETSLIP OVERLAY */}
            {isBetSlipOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-2xl h-full max-h-[90vh] bg-slate-900 rounded-[2.5rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative">
                        {/* Header with Timer */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                            <div className="flex flex-col">
                                <h2 className="text-lg font-black uppercase tracking-[0.2em] text-emerald-400">Review Selections</h2>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Q-PENALTY #{gameState.roundId}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Closing In</span>
                                    <span className={cn(
                                        "text-xl font-mono font-black",
                                        gameState.timeRemaining < 10 ? "text-red-500 animate-pulse" : "text-amber-400"
                                    )}>
                                        {gameState.phase === 'BETTING_OPEN' ? `${gameState.timeRemaining}s` : 'LOCKED'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsBetSlipOpen(false)}
                                    className="p-3 hover:bg-white/10 rounded-2xl transition-all"
                                >
                                    <X className="h-6 w-6 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <QGamesBetSlip
                                selections={selections}
                                onClear={() => { setSelections([]); setIsBetSlipOpen(false); }}
                                onRemove={(id: string) => {
                                    const newSels = selections.filter(s => s.selectionId !== id);
                                    setSelections(newSels);
                                    if (newSels.length === 0) setIsBetSlipOpen(false);
                                }}
                                onPlaceBet={async (s: number, o: number, p: number) => {
                                    await handlePlaceBet(s, o, p);
                                    setIsBetSlipOpen(false);
                                }}
                                isLocked={isLocked}
                                balance={currentBalance}
                                bonusBalance={currentBonusBalance}
                                hasConflicts={hasConflicts}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl scale-in-center">
                        <div className="flex flex-col items-center text-center space-y-4">
                             <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                                 <AlertTriangle className="h-8 w-8 text-amber-500" />
                             </div>
                             <div>
                                 <h3 className="text-xl font-black uppercase tracking-tight">Leave Game?</h3>
                                 <p className="text-sm text-slate-400 font-medium px-4 mt-1">You have pending bets or selections. Leaving may result in missing the final result.</p>
                             </div>
                        </div>
                        <div className="flex flex-col gap-3">
                             <button 
                                 onClick={() => router.push('/virtuals')}
                                 className="w-full p-4.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                             >
                                 Exit Anyway
                             </button>
                             <button 
                                 onClick={() => setShowExitConfirm(false)}
                                 className="w-full p-4.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all border border-white/5"
                             >
                                 Stay & Play
                             </button>
                        </div>
                    </div>
                </div>
            )}

            <VirtualGameHistory 
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                betHistory={betHistory}
                gameType="penalty"
            />

            <GiftSelectionModal 
                isOpen={showGiftModal}
                onClose={() => setShowGiftModal(false)}
                gifts={userGifts} 
                onApply={(giftId, amount) => {
                    context?.setBonusId(giftId)
                    context?.setBonusAmount(amount)
                    context?.setUseBonus(!!giftId)
                    context?.setBalanceType(giftId ? 'gift' : 'cash')
                }}
                totalOdds={selections.reduce((acc, s) => acc * s.odds, 1) || 1.0}
                selectionsCount={selections.length || 0}
                totalStake={selections.length > 0 ? 1 : 1}
            />
        </div>
    )
}

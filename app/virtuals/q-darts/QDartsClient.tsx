'use client'

import React, { useMemo, useState } from 'react'
import { VirtualsHeader } from '../components/VirtualsHeader'
import { useRouter } from 'next/navigation'
import { simulateQDartsMatch } from '@/lib/q-darts-engine'
import { generateQDartsMarkets, QDartsMarket, checkQDartsCorrelation, evaluateQDartsBet } from '@/lib/q-darts-odds'
import { useQDartsMatchLoop } from '@/hooks/useQDartsMatchLoop'
import { VirtualSelection } from '@/lib/virtuals'
import { ShieldAlert, Info, Target } from 'lucide-react'
import { QDartsLivePlayer } from './components/QDartsLivePlayer'
import { QDartsBetSlip } from './components/QDartsBetSlip'
import { QDarts3DBoard } from './components/QDarts3DBoard'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { audio } from '@/lib/audio'

interface QDartsClientProps {
    userProfile?: { balance: number; bonusBalance: number };
    isAuthenticated?: boolean;
}

export default function QDartsClient({ userProfile = { balance: 0, bonusBalance: 0 }, isAuthenticated = false }: QDartsClientProps) {
    const router = useRouter()

    // Deterministic match loop synchronized to global epoch
    const gameState = useQDartsMatchLoop()

    const [balanceType, setBalanceType] = useState<'cash' | 'gift'>('cash')
    const [currentBalance, setCurrentBalance] = useState(userProfile.balance)
    const [currentBonusBalance, setCurrentBonusBalance] = useState(userProfile.bonusBalance)
    const [selections, setSelections] = useState<VirtualSelection[]>([])
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [isBetSlipOpen, setIsBetSlipOpen] = useState(false)
    // We track the exact historical match score to show on top during subsequent rounds
    const [previousScore, setPreviousScore] = useState<string>('AWAITING MATCH')

    // Track the last seen server values specifically to detect deposits
    const lastServerBalance = React.useRef(userProfile.balance)
    const lastServerBonus = React.useRef(userProfile.bonusBalance)
    const hasSyncedOnMount = React.useRef(false)

    interface PlacedBet {
        id: string;
        stake: number;
        selections: VirtualSelection[];
        status: string;
        payout: number;
        balanceType: 'cash' | 'gift';
        selectionOutcomes?: boolean[]; // Individual selection results
    }
    const [placedBets, setPlacedBets] = useState<PlacedBet[]>([])

    // Persistence: Load from localStorage on mount & Sync with server
    React.useEffect(() => {
        const savedBets = localStorage.getItem('qdarts_placed_bets')
        const savedBalance = localStorage.getItem('qdarts_balance')
        const savedBonus = localStorage.getItem('qdarts_bonus')

        if (!hasSyncedOnMount.current) {
            if (savedBets) setPlacedBets(JSON.parse(savedBets))

            // On Mount: Trust the saved balance if it exists (preserves local deductions)
            // If no save, use the server value
            setCurrentBalance(savedBalance ? parseFloat(savedBalance) : userProfile.balance)
            setCurrentBonusBalance(savedBonus ? parseFloat(savedBonus) : userProfile.bonusBalance)
            hasSyncedOnMount.current = true

            // Derive Previous Result on mount
            const prevRoundId = gameState.roundId - 1
            const prevSeed = prevRoundId * 1337
            const prevSim = simulateQDartsMatch(`Q-${prevRoundId}-${prevSeed}`, prevSeed, Date.now())
            if (prevSim) {
                setPreviousScore(`${prevSim.playerA.name} ${prevSim.totalScoreA} - ${prevSim.totalScoreB} ${prevSim.playerB.name}`)
            }
        } else {
            // Subsequent updates: ONLY sync if server values INCREASE (deposit or external refresh)
            if (userProfile.balance > lastServerBalance.current) {
                const diff = userProfile.balance - lastServerBalance.current
                setCurrentBalance(prev => prev + diff)
            }
            if (userProfile.bonusBalance > lastServerBonus.current) {
                const diff = userProfile.bonusBalance - lastServerBonus.current
                setCurrentBonusBalance(prev => prev + diff)
            }
        }

        lastServerBalance.current = userProfile.balance
        lastServerBonus.current = userProfile.bonusBalance
    }, [userProfile.balance, userProfile.bonusBalance])

    // Persistence: Save to localStorage on change
    React.useEffect(() => {
        localStorage.setItem('qdarts_placed_bets', JSON.stringify(placedBets))
        localStorage.setItem('qdarts_balance', currentBalance.toString())
        localStorage.setItem('qdarts_bonus', currentBonusBalance.toString())
    }, [placedBets, currentBalance, currentBonusBalance])

    // Navigation Protection
    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (placedBets.some(b => b.status === 'PENDING') || selections.length > 0) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [placedBets, selections.length])

    // Body Scroll Lock for Overlays
    React.useEffect(() => {
        if (isBetSlipOpen || isHistoryOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isBetSlipOpen, isHistoryOpen])

    const handleLeaveGame = () => {
        const hasActiveBets = placedBets.some(b => b.status === 'PENDING')
        const confirmMsg = hasActiveBets
            ? "You have active bets! Are you sure you want to leave the game?"
            : "Are you sure you want to exit Q-DARTS?"

        if (window.confirm(confirmMsg)) {
            router.push('/virtuals')
        }
    }

    // Generate the one global match for this seed
    const { outcome, markets } = useMemo(() => {
        const matchId = `Q-${gameState.roundId}-${gameState.matchSeed}`
        const sim = simulateQDartsMatch(matchId, gameState.matchSeed, gameState.timestamp)
        const mkts = generateQDartsMarkets(sim)
        return { outcome: sim, markets: mkts }
    }, [gameState.matchSeed, gameState.roundId, gameState.timestamp])

    // Settlement Logic
    React.useEffect(() => {
        if (gameState.phase === 'SETTLEMENT') {
            setPreviousScore(`${outcome.playerA.name} ${outcome.totalScoreA} - ${outcome.totalScoreB} ${outcome.playerB.name}`)

            setPlacedBets(prev => prev.map(bet => {
                if (bet.status !== 'PENDING') return bet;

                // Q-Darts is strictly accumulator: ALL must win
                const selResults = bet.selections.map(sel => evaluateQDartsBet(sel, outcome))
                const allWon = selResults.every(res => res === true)

                if (allWon) {
                    let winAmount = bet.payout

                    // GIFT RULE: If it was a gift bet, winnings = (payout - stake) added to main balance
                    if (bet.balanceType === 'gift') {
                        winAmount = Math.max(0, bet.payout - bet.stake)
                    }

                    if (winAmount > 0) {
                        setCurrentBalance(curr => curr + winAmount)
                        console.log(`Bet Won! GHS ${winAmount.toFixed(2)} added to your main balance.`)
                    }
                }

                return { ...bet, status: allWon ? 'WON' : 'LOST', selectionOutcomes: selResults }
            }))
        }

        if (gameState.phase === 'RESET') {
            setSelections([])
        }
    }, [gameState.phase, outcome])

    const handlePlaceBet = async (stake: number, totalOdds: number, potentialPayout: number) => {
        // Mock API call delay
        await new Promise(r => setTimeout(r, 500))

        // Dynamic Balance Deduction
        if (balanceType === 'cash') {
            setCurrentBalance(prev => Math.max(0, prev - stake))
        } else {
            setCurrentBonusBalance(prev => Math.max(0, prev - stake))
        }

        setPlacedBets(prev => [...prev, {
            id: `bet-${Date.now()}`,
            stake,
            selections: [...selections],
            status: 'PENDING',
            payout: potentialPayout,
            balanceType: balanceType // Track which balance was used for settlement
        }])

        haptics.success() // Success pulse
        audio.success() // Success sound
        setSelections([])
        alert(`Bet Placed Successfully via ${balanceType === 'gift' ? 'Gift' : 'Cash'}!`)
    }

    const hasConflicts = checkQDartsCorrelation(selections)

    // Temporary helper for UI
    const isLocked = gameState.phase !== 'BETTING_OPEN'

    return (
        <div className="min-h-screen bg-background flex flex-col text-white overflow-hidden h-screen bg-slate-950">
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <VirtualsHeader
                    onBack={handleLeaveGame}
                    selectedCategory={'all'}
                    onCategoryChange={() => { }}
                    setSelectedRegion={() => { }}
                    availableRegions={[]}
                    balanceType={balanceType}
                    onBalanceTypeChange={setBalanceType}
                    balance={currentBalance}
                    bonusBalance={currentBonusBalance}
                    hasPendingBets={placedBets.some(b => b.status === 'PENDING')}
                    onOpenHistory={() => setIsHistoryOpen(true)}
                    isAuthenticated={isAuthenticated}
                    onNextRound={() => { }}
                    disableSkip={true}
                    customSubNavNode={
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pre-Match Result:</span>
                            <span className="text-xs font-black text-amber-400">{previousScore}</span>
                        </div>
                    }
                />

                <main className="flex-1 flex flex-col relative overflow-hidden">
                    <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                        <QDartsLivePlayer outcome={outcome} gameState={gameState} phase={gameState.phase} />

                        {/* Scrollable Area for 3D Board & Markets */}
                        <div className="flex-1 overflow-y-auto scrollbar-nav flex flex-col">
                            {/* 3D Board - Sticky at top during match */}
                            <div className={cn(
                                "w-full transition-all duration-700 ease-in-out px-4 pt-2 shrink-0 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-20",
                                isLocked ? "h-[320px] md:h-[420px] border-b border-white/5" : "h-0 opacity-0 overflow-hidden pt-0"
                            )}>
                                <QDarts3DBoard outcome={outcome} timeRemaining={gameState.timeRemaining} phase={gameState.phase} />
                            </div>

                            {/* Markets Section */}
                            <div className="p-4 space-y-6 pb-40">
                                <div className="flex items-center justify-between px-1 border-b border-white/5 pb-2 mb-4">
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">Available Markets</h2>
                                    {isLocked && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Live Action</span>
                                        </div>
                                    )}
                                </div>

                                {markets.map(market => (
                                    <div key={market.id} className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{market.name}</h3>
                                            <div className="group/tip relative flex items-center">
                                                <Info className="h-3.5 w-3.5 text-slate-700 hover:text-emerald-500 cursor-help transition-colors" />
                                                <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-900 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-slate-300 hidden group-hover/tip:block z-[1000] shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 pointer-events-none">
                                                    <div className="text-emerald-400 uppercase mb-1 flex items-center gap-1.5">
                                                        <ShieldAlert className="h-3 w-3" />
                                                        Market Guide
                                                    </div>
                                                    {market.description}
                                                </div>
                                            </div>
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
                                                            haptics.light() // Soft click feedback
                                                            audio.light() // Soft click sound
                                                            if (isSelected) setSelections(prev => prev.filter(s => s.selectionId !== sel.id))
                                                            else setSelections(prev => [...prev, {
                                                                matchId: outcome.matchId,
                                                                matchLabel: `${outcome.playerA.name} vs ${outcome.playerB.name}`,
                                                                schoolA: outcome.playerA.name,
                                                                schoolB: outcome.playerB.name,
                                                                schoolC: '',
                                                                marketName: market.name,
                                                                selectionId: sel.id,
                                                                label: sel.label,
                                                                odds: sel.odds,
                                                                timestamp: Date.now()
                                                            }])
                                                        }}
                                                        className={cn(
                                                            "p-2 rounded-xl border flex flex-col items-center justify-center transition-all min-h-[54px] relative overflow-hidden",
                                                            isSelected
                                                                ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[0.98]'
                                                                : 'bg-slate-900 border-white/5 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                                                        )}
                                                    >
                                                        <span className="text-[10px] font-black uppercase text-center leading-tight opacity-70 mb-0.5">{sel.label}</span>
                                                        <span className="font-mono font-black text-sm">{sel.odds.toFixed(2)}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FLOATING BET BUTTON */}
                    {selections.length > 0 && !isBetSlipOpen && (
                        <button
                            onClick={() => setIsBetSlipOpen(true)}
                            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all animate-in slide-in-from-bottom-10 active:scale-95"
                        >
                            <div className="flex flex-col items-start leading-none gap-1 border-r border-white/20 pr-3">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Betslip</span>
                                <span className="text-sm font-black">{selections.length} {selections.length === 1 ? 'Selection' : 'Selections'}</span>
                            </div>
                            <div className="flex flex-col items-end leading-none gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Starts In</span>
                                <span className="text-sm font-black font-mono">{gameState.phase === 'BETTING_OPEN' ? `${gameState.timeRemaining}s` : 'LOCKED'}</span>
                            </div>
                        </button>
                    )}

                    {/* FULL SCREEN BETSLIP OVERLAY */}
                    {isBetSlipOpen && (
                        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300 flex flex-col items-center justify-center p-4">
                            <div className="w-full max-w-2xl h-full max-h-[90vh] bg-slate-900 rounded-[2.5rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative">
                                {/* Header with Timer */}
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                                    <div className="flex flex-col">
                                        <h2 className="text-lg font-black uppercase tracking-[0.2em] text-emerald-400">Review Selections</h2>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Q-DARTS #{gameState.roundId}</span>
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
                                            <ShieldAlert className="h-6 w-6 rotate-45 text-slate-400" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <QDartsBetSlip
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
                                        balanceType={balanceType}
                                        setBalanceType={setBalanceType}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* BET HISTORY OVERLAY */}
            {isHistoryOpen && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Bet History</h2>
                            <button
                                onClick={() => { 
                                    haptics.bullseye(); 
                                    audio.bullseye();
                                    alert("Feedback triggered! If you didn't feel vibration, check your sound. Some browsers require interaction before playing audio."); 
                                }}
                                className="text-[9px] text-slate-500 uppercase font-black hover:text-white transition-colors text-left"
                            >
                                (Test Feedback)
                            </button>
                        </div>
                        <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ShieldAlert className="h-5 w-5 rotate-45 text-slate-400" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 shadow-inner">
                        {placedBets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-2">
                                <Target className="h-12 w-12" />
                                <p className="text-xs font-bold uppercase tracking-widest">No bets placed yet</p>
                            </div>
                        ) : (
                            placedBets.slice().reverse().map(bet => (
                                <div key={bet.id} className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-3 shadow-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Accumulator</p>
                                            <p className="text-xs font-bold">GHS {bet.stake.toFixed(2)}</p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                                            bet.status === 'WON' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                                bet.status === 'LOST' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                                    "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        )}>
                                            {bet.status}
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                        {bet.selections.map((sel, idx) => {
                                            const isSettled = bet.status !== 'PENDING'
                                            const isWin = bet.selectionOutcomes ? bet.selectionOutcomes[idx] : false
                                            
                                            return (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{sel.marketName}</span>
                                                        <span className={cn(
                                                            "text-xs font-bold",
                                                            isSettled ? (isWin ? "text-emerald-400" : "text-red-400") : "text-white"
                                                        )}>
                                                            {sel.label}
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "font-mono text-xs font-black",
                                                        isSettled ? (isWin ? "text-emerald-400" : "text-red-400") : "text-emerald-400/60"
                                                    )}>
                                                        {sel.odds.toFixed(2)}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {bet.status === 'WON' && (
                                        <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-emerald-500/60">Payout</span>
                                            <span className="text-sm font-black text-emerald-400">GHS {bet.payout.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

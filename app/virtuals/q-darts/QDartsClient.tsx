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

interface QDartsClientProps {
    userProfile?: { balance: number; bonusBalance: number };
    isAuthenticated?: boolean;
}

export default function QDartsClient({ userProfile = { balance: 0, bonusBalance: 0 }, isAuthenticated = false }: QDartsClientProps) {
    const router = useRouter()

    // Deterministic match loop synchronized to global epoch
    const gameState = useQDartsMatchLoop()

    const [balanceType, setBalanceType] = useState<'cash' | 'gift'>('cash')
    const [selections, setSelections] = useState<VirtualSelection[]>([])
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)

    interface PlacedBet { id: string; stake: number; selections: VirtualSelection[]; status: string; payout: number }
    const [placedBets, setPlacedBets] = useState<PlacedBet[]>([])

    // We track the exact historical match score to show on top during subsequent rounds
    const [previousScore, setPreviousScore] = useState<string>('AWAITING MATCH')

    // Generate the one global match for this seed
    const { outcome, markets } = useMemo(() => {
        const matchId = `Q-${gameState.roundId}-${gameState.matchSeed}`
        const sim = simulateQDartsMatch(matchId, gameState.matchSeed)
        const mkts = generateQDartsMarkets(sim)
        return { outcome: sim, markets: mkts }
    }, [gameState.matchSeed, gameState.roundId])

    // Settlement Logic
    React.useEffect(() => {
        if (gameState.phase === 'SETTLEMENT') {
            setPreviousScore(`${outcome.playerA.name} ${outcome.totalScoreA} - ${outcome.totalScoreB} ${outcome.playerB.name}`)

            setPlacedBets(prev => prev.map(bet => {
                if (bet.status !== 'PENDING') return bet;

                // Q-Darts is strictly accumulator: ALL must win
                const allWon = bet.selections.every(sel => evaluateQDartsBet(sel, outcome))

                if (allWon) {
                    console.log(`Bet Won! You won GHS ${bet.payout.toFixed(2)}`)
                }

                return { ...bet, status: allWon ? 'WON' : 'LOST' }
            }))
        }

        if (gameState.phase === 'RESET') {
            setSelections([])
        }
    }, [gameState.phase, outcome])

    const handlePlaceBet = async (stake: number, totalOdds: number, potentialPayout: number) => {
        // Mock API call
        await new Promise(r => setTimeout(r, 500))

        setPlacedBets(prev => [...prev, {
            id: `bet-${Date.now()}`,
            stake,
            selections: [...selections],
            status: 'PENDING',
            payout: potentialPayout
        }])

        setSelections([])
        alert('Bet Placed Successfully! Good luck!')
    }

    const hasConflicts = checkQDartsCorrelation(selections)

    // Temporary helper for UI
    const isLocked = gameState.phase !== 'BETTING_OPEN'

    return (
        <div className="min-h-screen bg-background flex flex-col text-white overflow-hidden h-screen">
            <VirtualsHeader
                onBack={() => router.push('/virtuals')}
                selectedCategory={'all'}
                onCategoryChange={() => { }}
                setSelectedRegion={() => { }}
                availableRegions={[]}
                balanceType={balanceType}
                onBalanceTypeChange={setBalanceType}
                balance={userProfile.balance}
                bonusBalance={userProfile.bonusBalance}
                hasPendingBets={placedBets.some(b => b.status === 'PENDING')}
                onOpenHistory={() => setIsHistoryOpen(true)}
                isAuthenticated={isAuthenticated}
                onNextRound={() => { }}
                disableSkip={true} // Q-DARTS is a fixed-time global game, no skipping
                customSubNavNode={
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pre-Match Result:</span>
                        <span className="text-xs font-black text-amber-400">{previousScore}</span>
                    </div>
                }
            />

            <main className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_360px] relative bg-slate-950 overflow-hidden">
                <div className="flex-1 flex flex-col relative h-full overflow-hidden">

                    <QDartsLivePlayer outcome={outcome} timeRemaining={gameState.timeRemaining} phase={gameState.phase} />

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
                                {isLocked && <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Live Action</span>
                                </div>}
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

                {/* RIGHT PANEL: Bet Slip (Sidebar on MD+, Popup on Mobile) */}
                <div className={cn(
                    "bg-slate-950 border-l border-white/5 flex flex-col overflow-hidden transition-all duration-300",
                    selections.length > 0 ? "h-[50vh] md:h-full translate-y-0" : "h-0 md:h-full translate-y-full md:translate-y-0 opacity-0 md:opacity-100"
                )}>
                    {selections.length > 0 ? (
                        <QDartsBetSlip
                            selections={selections}
                            onClear={() => setSelections([])}
                            onRemove={(id) => setSelections(prev => prev.filter(s => s.selectionId !== id))}
                            onPlaceBet={handlePlaceBet}
                            isLocked={isLocked}
                            balance={userProfile.balance}
                            bonusBalance={userProfile.bonusBalance}
                            balanceType={balanceType}
                        />
                    ) : (
                        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-700 p-8 text-center space-y-4">
                            <Target className="h-12 w-12 opacity-20" />
                            <p className="text-xs font-black uppercase tracking-widest opacity-40">Your betslip is empty</p>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Select odds from the left to start building your bet</p>
                        </div>
                    )}
                </div>

                {/* BET HISTORY OVERLAY */}
                {isHistoryOpen && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Bet History</h2>
                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <ShieldAlert className="h-5 w-5 rotate-45" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {placedBets.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-2">
                                    <Target className="h-12 w-12" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No bets placed yet</p>
                                </div>
                            ) : (
                                placedBets.slice().reverse().map(bet => (
                                    <div key={bet.id} className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-3">
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
                                            {bet.selections.map((sel, idx) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sel.marketName}</span>
                                                        <span className="text-xs font-bold text-white">{sel.label}</span>
                                                    </div>
                                                    <span className="font-mono text-xs font-black text-emerald-400">@{sel.odds.toFixed(2)}</span>
                                                </div>
                                            ))}
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

            </main>
        </div>
    )
}

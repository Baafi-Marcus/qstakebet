'use client'

import React, { useMemo, useState } from 'react'
import { VirtualsHeader } from '../components/VirtualsHeader'
import { BetSlipContext } from '@/lib/store/context'
import { useRouter } from 'next/navigation'
import { simulateQPenaltyMatch } from '@/lib/q-penalty-engine'
import { generateQPenaltyMarkets, evaluateQPenaltyBet, checkQPenaltyCorrelation } from '@/lib/q-penalty-odds'
import { useQPenaltyMatchLoop } from '@/hooks/useQPenaltyMatchLoop'
import { VirtualSelection } from '@/lib/virtuals'
import { ShieldAlert, Info, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { audio } from '@/lib/audio'
// We'll build these next
import { QPenaltyLivePlayer } from './components/QPenaltyLivePlayer'
import { QPenaltyGoalView } from './components/QPenaltyGoalView'

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
    const [selections, setSelections] = useState<VirtualSelection[]>([])
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [isBetSlipOpen, setIsBetSlipOpen] = useState(false)
    const [previousResult, setPreviousResult] = useState<string>('AWAITING MATCH')

    const lastServerBalance = React.useRef(userProfile.balance)
    const lastServerBonus = React.useRef(userProfile.bonusBalance)
    const hasSyncedOnMount = React.useRef(false)

    const [placedBets, setPlacedBets] = useState<any[]>([])

    // Persistence & Sync
    React.useEffect(() => {
        const savedBets = localStorage.getItem('qpenalty_placed_bets')
        const savedBalance = localStorage.getItem('qpenalty_balance')
        
        if (!hasSyncedOnMount.current) {
            if (savedBets) setPlacedBets(JSON.parse(savedBets))
            setCurrentBalance(savedBalance ? parseFloat(savedBalance) : userProfile.balance)
            hasSyncedOnMount.current = true
        } else {
            if (userProfile.balance > lastServerBalance.current) {
                setCurrentBalance(prev => prev + (userProfile.balance - lastServerBalance.current))
            }
        }
        lastServerBalance.current = userProfile.balance
    }, [userProfile.balance])

    // Match outcome generation
    const { outcome, markets } = useMemo(() => {
        const matchId = `QP-${gameState.roundId}-${gameState.matchSeed}`
        const sim = simulateQPenaltyMatch(matchId, gameState.matchSeed, gameState.timestamp)
        const mkts = generateQPenaltyMarkets(sim)
        return { outcome: sim, markets: mkts }
    }, [gameState.matchSeed, gameState.roundId, gameState.timestamp])

    // Settlement
    React.useEffect(() => {
        if (gameState.phase === 'SETTLEMENT') {
            setPreviousResult(`${outcome.teamA.shortName} ${outcome.scoreA} - ${outcome.scoreB} ${outcome.teamB.shortName}`)
            
            setPlacedBets(prev => prev.map(bet => {
                if (bet.status !== 'PENDING') return bet
                const selResults = bet.selections.map((sel: any) => evaluateQPenaltyBet(sel, outcome))
                const allWon = selResults.every((res: boolean) => res === true)
                
                if (allWon) {
                    setCurrentBalance(curr => curr + bet.payout)
                }
                return { ...bet, status: allWon ? 'WON' : 'LOST' }
            }))
        }
        if (gameState.phase === 'RESET') {
            setSelections([])
        }
    }, [gameState.phase, outcome])

    const handlePlaceBet = async (stake: number, totalOdds: number, potentialPayout: number) => {
        await new Promise(r => setTimeout(r, 500))
        setCurrentBalance(prev => prev - stake)
        setPlacedBets(prev => [...prev, {
            id: `bet-${Date.now()}`,
            stake,
            selections: [...selections],
            status: 'PENDING',
            payout: potentialPayout,
            timestamp: Date.now()
        }])
        haptics.success()
        audio.success()
        setSelections([])
        setIsBetSlipOpen(false)
    }

    const isLocked = gameState.phase !== 'BETTING_OPEN'

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden h-screen">
            <VirtualsHeader
                onBack={() => router.push('/virtuals')}
                selectedCategory={'all'}
                onCategoryChange={() => { }}
                setSelectedRegion={() => { }}
                availableRegions={[]}
                balance={currentBalance}
                bonusBalance={currentBonusBalance}
                hasPendingBets={placedBets.some(b => b.status === 'PENDING')}
                onOpenHistory={() => setIsHistoryOpen(true)}
                isAuthenticated={isAuthenticated}
                onNextRound={() => { }}
                disableSkip={true}
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
                    <div className="w-full aspect-video bg-slate-900 border-b border-white/5 relative overflow-hidden bg-gradient-to-b from-slate-900 to-emerald-950/20">
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
                    </div>
                </div>

                {/* Markets Section */}
                <div className="p-4 space-y-6 pb-32">
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
                                                if (isSelected) setSelections(prev => prev.filter(s => s.selectionId !== sel.id))
                                                else setSelections(prev => [...prev, {
                                                    matchId: outcome.matchId,
                                                    matchLabel: `${outcome.teamA.shortName} vs ${outcome.teamB.shortName}`,
                                                    schoolA: outcome.teamA.shortName,
                                                    schoolB: outcome.teamB.shortName,
                                                    schoolC: '',
                                                    marketName: market.name,
                                                    selectionId: sel.id,
                                                    label: sel.label,
                                                    odds: sel.odds,
                                                    timestamp: Date.now()
                                                }])
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
            {selections.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
                    <button 
                        onClick={() => setIsBetSlipOpen(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-10"
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
        </div>
    )
}

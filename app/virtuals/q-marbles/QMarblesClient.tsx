'use client'

import React, { useMemo, useState } from 'react'
import { VirtualsHeader } from '../components/VirtualsHeader'
import { BetSlipContext } from '@/lib/store/context'
import { useRouter } from 'next/navigation'
import { simulateQMarblesRace } from '@/lib/q-marbles-engine'
import { generateQMarblesMarkets, evaluateQMarblesBet } from '@/lib/q-marbles-odds'
import { useQMarblesMatchLoop } from '@/hooks/useQMarblesMatchLoop'
import { VirtualSelection } from '@/lib/virtuals'
import { ShieldAlert, Info, Trophy, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { audio } from '@/lib/audio'
import { QMarblesTrack } from './components/QMarblesTrack'
import { QMarblesLivePlayer } from './components/QMarblesLivePlayer'

interface QMarblesClientProps {
    userProfile?: { balance: number; bonusBalance: number };
    isAuthenticated?: boolean;
}

export default function QMarblesClient({ userProfile = { balance: 0, bonusBalance: 0 }, isAuthenticated = false }: QMarblesClientProps) {
    const router = useRouter()
    const gameState = useQMarblesMatchLoop()
    const context = React.useContext(BetSlipContext)

    const [currentBalance, setCurrentBalance] = useState(userProfile.balance)
    const [currentBonusBalance, setCurrentBonusBalance] = useState(userProfile.bonusBalance)
    const [selections, setSelections] = useState<VirtualSelection[]>([])
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [isBetSlipOpen, setIsBetSlipOpen] = useState(false)
    const [previousWinner, setPreviousWinner] = useState<string>('AWAITING RACE')

    const lastServerBalance = React.useRef(userProfile.balance)
    const hasSyncedOnMount = React.useRef(false)

    const [placedBets, setPlacedBets] = useState<any[]>([])

    // Persistence & Sync
    React.useEffect(() => {
        const savedBets = localStorage.getItem('qmarbles_placed_bets')
        const savedBalance = localStorage.getItem('qmarbles_balance')
        
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
        const matchId = `QM-${gameState.roundId}-${gameState.matchSeed}`
        const sim = simulateQMarblesRace(matchId, gameState.matchSeed, gameState.timestamp)
        const mkts = generateQMarblesMarkets(sim)
        return { outcome: sim, markets: mkts }
    }, [gameState.matchSeed, gameState.roundId, gameState.timestamp])

    // Settlement
    React.useEffect(() => {
        if (gameState.phase === 'SETTLEMENT') {
            const winner = outcome.marbles.find(m => m.id === outcome.winner)
            setPreviousWinner(winner?.shortName || 'Unknown')
            
            setPlacedBets(prev => prev.map(bet => {
                if (bet.status !== 'PENDING') return bet
                const selResults = bet.selections.map((sel: any) => evaluateQMarblesBet(sel, outcome))
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
        <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden h-screen font-inter">
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
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-wrap">Last Winner:</span>
                        <span className="text-xs font-black text-amber-400">{previousWinner}</span>
                    </div>
                }
            />

            <main className="flex-1 overflow-y-auto scrollbar-nav">
                {/* Visual Section: Live Player & Track */}
                <div className="flex flex-col bg-slate-950/40">
                    <QMarblesLivePlayer outcome={outcome} gameState={gameState} />
                    
                    <div className="w-full aspect-video p-4 relative overflow-hidden flex flex-col items-center justify-center">
                         <QMarblesTrack outcome={outcome} gameState={gameState} />
                         
                         {/* Phase Time Overlay (Small) */}
                         <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/5">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                 {gameState.phase.replace('_', ' ')}
                             </span>
                             <div className="h-3 w-[1px] bg-white/10 mx-1" />
                             <div className="text-xs font-black font-mono text-emerald-400">
                                 {gameState.timeRemaining}s
                             </div>
                         </div>
                    </div>
                </div>

                {/* Markets Section */}
                <div className="p-4 space-y-8 pb-32">
                    {markets.map(market => (
                        <div key={market.id} className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                                    {market.name}
                                </h3>
                                <Info className="h-3.5 w-3.5 text-slate-700" />
                            </div>
                            <div className={cn(
                                "grid gap-2.5",
                                market.id === 'winner' || market.id === 'place' ? "grid-cols-3" : "grid-cols-2"
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
                                                    matchLabel: `Marble Race #${gameState.roundId}`,
                                                    schoolA: 'Race',
                                                    schoolB: '',
                                                    schoolC: '',
                                                    marketName: market.name,
                                                    selectionId: sel.id,
                                                    label: sel.label,
                                                    odds: sel.odds,
                                                    timestamp: Date.now()
                                                }])
                                            }}
                                            className={cn(
                                                "p-3.5 rounded-2xl border flex flex-col items-center justify-center transition-all min-h-[68px] relative overflow-hidden group",
                                                isSelected
                                                    ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                                                    : 'bg-slate-900 border-white/5 active:scale-95 disabled:opacity-50'
                                            )}
                                        >
                                            <span className="text-[10px] font-black uppercase text-center opacity-60 mb-0.5 group-hover:opacity-100 transition-opacity">{sel.label}</span>
                                            <span className="font-mono font-black text-base tracking-tight">{sel.odds.toFixed(2)}</span>
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
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4.5 rounded-[2rem] shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center justify-between animate-in slide-in-from-bottom-12 backdrop-blur-md"
                    >
                        <div className="flex flex-col items-start leading-none gap-1">
                             <span className="text-[10px] font-black uppercase opacity-60 tracking-wider">Your Selections</span>
                             <span className="text-base font-black">{selections.length} {selections.length === 1 ? 'Market' : 'Markets'}</span>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="h-10 w-[1px] bg-white/10" />
                             <div className="text-right leading-none gap-1 flex flex-col">
                                 <span className="text-[10px] font-black uppercase opacity-60 tracking-wider">Race Start</span>
                                 <div className="text-base font-black font-mono text-amber-300">{gameState.timeRemaining}s</div>
                             </div>
                        </div>
                    </button>
                </div>
            )}
        </div>
    )
}

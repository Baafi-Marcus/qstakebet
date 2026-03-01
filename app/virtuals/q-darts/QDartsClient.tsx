'use client'

import React, { useMemo, useState } from 'react'
import { VirtualsHeader } from '../components/VirtualsHeader'
import { useRouter } from 'next/navigation'
import { simulateQDartsMatch } from '@/lib/q-darts-engine'
import { generateQDartsMarkets, QDartsMarket, checkQDartsCorrelation, evaluateQDartsBet } from '@/lib/q-darts-odds'
import { useQDartsMatchLoop } from '@/hooks/useQDartsMatchLoop'
import { VirtualSelection } from '@/lib/virtuals'
import { ShieldAlert, Info } from 'lucide-react'
import { QDartsLivePlayer } from './components/QDartsLivePlayer'
import { QDartsBetSlip } from './components/QDartsBetSlip'
import { QDarts3DBoard } from './components/QDarts3DBoard'

interface QDartsClientProps {
    userProfile?: { balance: number; bonusBalance: number };
    isAuthenticated?: boolean;
}

export default function QDartsClient({ userProfile = { balance: 0, bonusBalance: 0 }, isAuthenticated = false }: QDartsClientProps) {
    const router = useRouter()

    // Hardcoded seed for development - in prod this comes from a backend epoch
    const gameState = useQDartsMatchLoop(10000)

    const [balanceType, setBalanceType] = useState<'cash' | 'gift'>('cash')
    const [selections, setSelections] = useState<VirtualSelection[]>([])

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
        <div className="min-h-screen bg-background flex flex-col text-white">
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
                onOpenHistory={() => { }}
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

            <main className="flex-1 flex flex-col md:flex-row max-h-[calc(100vh-56px)] overflow-hidden">
                <div className="flex-1 flex flex-col bg-slate-950/40 relative">

                    <QDartsLivePlayer outcome={outcome} timeRemaining={gameState.timeRemaining} phase={gameState.phase} />

                    {/* CENTER: Markets List (Only interactable during BETTING_OPEN) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
                        {isLocked ? (
                            <div className="flex-1 flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
                                <QDarts3DBoard outcome={outcome} timeRemaining={gameState.timeRemaining} phase={gameState.phase} />
                            </div>
                        ) : (
                            markets.map(market => (
                                <div key={market.id} className="space-y-3">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">{market.name}</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {market.selections.map(sel => {
                                            const isSelected = selections.some(s => s.selectionId === sel.id)
                                            return (
                                                <button
                                                    key={sel.id}
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
                                                    className={`p-3 rounded-xl border flex justify-between items-center transition-all ${isSelected
                                                        ? 'bg-purple-600 border-purple-400 shadow-lg'
                                                        : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                                                        }`}
                                                >
                                                    <span className="text-xs font-bold">{sel.label}</span>
                                                    <span className="font-mono font-black">{sel.odds.toFixed(2)}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>

                {/* RIGHT/BOTTOM: Bet Slip Placeholder */}
                {selections.length > 0 && (
                    <div className="w-full md:w-96 absolute md:relative bottom-0 z-40 max-h-[50vh] md:max-h-none flex flex-col">
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
                    </div>
                )}

            </main>
        </div>
    )
}

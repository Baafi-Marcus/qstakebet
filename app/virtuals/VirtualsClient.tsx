"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Selection as BetSlipSelection } from "@/lib/store/context"
import { MatchDetailsModal } from "@/components/ui/MatchDetailsModal"
import { cn } from "@/lib/utils"
import {
    generateVirtualMatches,
    simulateMatch,
    getRecentVirtualResults,
    VirtualMatchOutcome,
    VirtualSchool,
    DEFAULT_SCHOOLS,
    getSchoolAcronym,
    getTicketId,
    checkSelectionWin,
    calculateTotalOdds,
    VirtualSelection,
    ClientVirtualBet,
    ResolvedSelection,
    ResolvedSlip
} from "@/lib/virtuals"
import { updateSchoolStats, getAIStrengths, getPlayableSchools, settleVirtualBet } from "@/lib/virtual-actions"
import { placeBet } from "@/lib/bet-actions"
import { Match } from "@/lib/types"
import { MULTI_BONUS } from "@/lib/constants"

// New Modular Components
import { VirtualsHeader } from "./components/VirtualsHeader"
import { VirtualsMatchList } from "./components/VirtualsMatchList"
import { VirtualsBetSlip } from "./components/VirtualsBetSlip"
import { VirtualsResults } from "./components/VirtualsResults"
import { VirtualsHistory } from "./components/VirtualsHistory"
import { VirtualsLivePlayer } from "./components/VirtualsLivePlayer"

interface VirtualsClientProps {
    user?: { id: string; email: string; name?: string | null };
    profile?: { balance: number; currency: string; bonusBalance?: number };
    schools: VirtualSchool[];
    userSeed?: number;
}

const MAX_GAME_PAYOUT = 3000;

export function VirtualsClient({ profile, schools, userSeed = 0, user }: VirtualsClientProps) {
    const router = useRouter()

    // Status / UI State
    const [activeMarket, setActiveMarket] = useState<'winner' | 'total_points' | 'winning_margin' | 'highest_scoring_round' | 'round_winner' | 'perfect_round' | 'shutout_round' | 'first_bonus' | 'comeback_win' | 'comeback_team' | 'lead_changes' | 'late_surge'>('winner')
    const [activeSchools, setActiveSchools] = useState<VirtualSchool[]>(schools || DEFAULT_SCHOOLS)
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'regional' | 'national'>('national')
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
    const [betMode, setBetMode] = useState<'single' | 'multi'>('single')
    const [showSlip, setShowSlip] = useState(false)
    const [currentRound, setCurrentRound] = useState(() => Math.floor(Date.now() / 60000))
    const [aiStrengths, setAiStrengths] = useState<Record<string, number>>({})
    const [selections, setSelections] = useState<VirtualSelection[]>([])
    const [globalStake, setGlobalStake] = useState(0)
    const [betHistory, setBetHistory] = useState<ClientVirtualBet[]>([])
    const [slipTab, setSlipTab] = useState<'selections' | 'pending'>('selections')
    const [isSimulating, setIsSimulating] = useState(false)
    const [simulationProgress, setSimulationProgress] = useState(0)
    const [pendingSlips, setPendingSlips] = useState<ClientVirtualBet[]>([])
    const [lastOutcome, setLastOutcome] = useState<any>(null)
    const [showResultsModal, setShowResultsModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [activeLiveMatchId, setActiveLiveMatchId] = useState<string | null>(null)
    const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null)
    const [confirmCashoutSlipId, setConfirmCashoutSlipId] = useState<string | null>(null)
    const [currentCommentary, setCurrentCommentary] = useState<string>("Ready for kickoff!")
    const [autoNextRoundCountdown, setAutoNextRoundCountdown] = useState<number | null>(null)
    const [countdown, setCountdown] = useState<string | null>(null)
    const [balanceType, setBalanceType] = useState<'cash' | 'gift'>('cash')
    const [gifts, setGifts] = useState<any[]>([])
    const [bonusId, setBonusId] = useState<string | undefined>(undefined)
    const [bonusAmount, setBonusAmount] = useState<number>(0)
    const [showGiftModal, setShowGiftModal] = useState(false)

    const isSimulatingRef = useRef(false)
    const outcomesRef = useRef<VirtualMatchOutcome[]>([])

    const isAuthenticated = !!user

    // Load dynamic data
    useEffect(() => {
        getPlayableSchools().then(s => s.length > 0 && setActiveSchools(s))
    }, [])

    useEffect(() => {
        const names = activeSchools.map(s => s.name);
        getAIStrengths(names).then(stats => {
            const strengthMap: Record<string, number> = {};
            stats.forEach(s => s.name && s.form && (strengthMap[s.name] = s.form));
            setAiStrengths(strengthMap);
        });
    }, [currentRound, activeSchools])

    // Load bet history
    useEffect(() => {
        fetch('/api/user/bets?type=virtual&limit=20')
            .then(res => res.ok && res.json())
            .then(data => {
                if (data?.bets) {
                    const virtualBets = data.bets.map((bet: any) => ({
                        id: bet.id,
                        selections: bet.selections,
                        stake: bet.stake,
                        totalOdds: bet.totalOdds,
                        potentialPayout: bet.potentialPayout,
                        status: bet.status,
                        roundId: bet.selections?.[0]?.matchId ? parseInt(bet.selections[0].matchId.split('-')[1]) : 0,
                        totalReturns: bet.status === 'won' ? bet.potentialPayout : 0,
                        totalStake: bet.stake,
                        timestamp: new Date(bet.createdAt).getTime(),
                        mode: bet.mode || 'single'
                    }))
                    setBetHistory(virtualBets)
                }
            })

        // Fetch Gifts if authenticated
        if (isAuthenticated) {
            import("@/lib/user-actions").then(m => {
                m.getUserGifts().then(res => {
                    if (res.success) setGifts(res.gifts)
                })
            })
        }
    }, [isAuthenticated])

    // Memos
    const { matches, outcomes } = useMemo(() => {
        const count = selectedCategory === 'regional' ? 15 : 9
        const gen = generateVirtualMatches(count, activeSchools, currentRound, selectedCategory, selectedRegion || undefined, aiStrengths, userSeed);
        outcomesRef.current = gen.outcomes
        return gen
    }, [currentRound, activeSchools, aiStrengths, userSeed, selectedCategory, selectedRegion])

    const availableRegions = useMemo(() => [...new Set(activeSchools.map(s => s.region))].sort(), [activeSchools])

    const filteredMatches = useMemo(() => {
        if (selectedCategory === 'all') return matches
        return matches.filter(m => {
            if (selectedCategory === 'regional') return m.stage === "Regional Qualifier"
            if (selectedCategory === 'national') return m.stage === "National Championship"
            return true
        })
    }, [matches, selectedCategory])

    const activeLiveMatch = useMemo(() => matches.find(m => m.id === activeLiveMatchId), [activeLiveMatchId, matches])

    const hasConflicts = useMemo(() => {
        const counts: Record<string, number> = {}
        selections.forEach(s => counts[s.matchId] = (counts[s.matchId] || 0) + 1)
        return Object.values(counts).some(c => c > 1)
    }, [selections])

    // Handlers
    const nextRound = () => {
        setCurrentRound(prev => prev + 1)
        setSelections([])
        setSimulationProgress(0)
        setIsSimulating(false)
    }

    const kickoff = async () => {
        if (isSimulating) return
        setIsSimulating(true)
        isSimulatingRef.current = true
        setSimulationProgress(0)
        setShowSlip(false)

        const startMatch = pendingSlips.length > 0 ? pendingSlips[0].selections[0].matchId : matches[0]?.id
        setActiveLiveMatchId(startMatch)

        // Countdown
        const phases: any[] = ['READY', '3', '2', '1', 'START']
        for (const p of phases) {
            setCountdown(p)
            await new Promise(r => setTimeout(r, p === 'READY' || p === 'START' ? 600 : 800))
        }
        setCountdown(null)

        // Simulation
        const duration = 60000; const steps = 60
        for (let i = 1; i <= steps; i++) {
            if (!isSimulatingRef.current) break
            await new Promise(r => setTimeout(r, duration / steps))
            setSimulationProgress(i)

            const liveOutcome = outcomesRef.current.find(o => o.id === activeLiveMatchId)
            if (liveOutcome?.commentary) {
                const latest = liveOutcome.commentary.filter(c => c.time <= i).sort((a, b) => b.time - a.time)[0]
                if (latest) setCurrentCommentary(latest.text)
            }
        }

        // Settlement
        const resolvedSlips: ResolvedSlip[] = pendingSlips.map(slip => {
            const results = slip.selections.map((sel: any) => {
                const parts = sel.matchId.split("-")
                const outcome = simulateMatch(parseInt(parts[1]), parseInt(parts[2]), schools, parts[3] as any, parts[4] || undefined, aiStrengths, userSeed)
                return { ...sel, won: checkSelectionWin(sel, outcome), outcome }
            })

            let totalReturns = 0
            if (slip.mode === 'multi') {
                const allWon = results.every(r => r.won)
                totalReturns = allWon ? (calculateTotalOdds(results) * slip.totalStake) : 0
                // Simple bonus logic for brevity, matches original
                if (slip.selections.length >= 5 && allWon) totalReturns *= 1.1;
            } else {
                results.forEach(r => r.won && (totalReturns += Math.min(r.odds * (r.stakeUsed || 0), MAX_GAME_PAYOUT)))
            }

            if (slip.cashedOut) {
                totalReturns = slip.totalStake
                return { ...slip, results, totalReturns, status: 'Cashed Out' } as any
            }

            return { ...slip, results, totalReturns, status: totalReturns > 0 ? 'WON' : 'LOST' } as any
        })

        if (resolvedSlips.length > 0) {
            setBetHistory(prev => [...resolvedSlips, ...prev])
            resolvedSlips.forEach(s => settleVirtualBet(s.id, currentRound, userSeed))
            setTimeout(() => router.refresh(), 1000)
        }

        setLastOutcome({
            allRoundResults: outcomesRef.current,
            roundId: currentRound,
            results: resolvedSlips.flatMap(s => s.results || []),
            resolvedSlips: resolvedSlips
        })
        setIsSimulating(false)
        isSimulatingRef.current = false
        setSimulationProgress(60)
        setShowResultsModal(true)
        setPendingSlips([])
        setActiveLiveMatchId(null)
        setAutoNextRoundCountdown(15)
    }

    // Auto-advance results
    useEffect(() => {
        if (autoNextRoundCountdown !== null) {
            if (autoNextRoundCountdown <= 0) {
                setAutoNextRoundCountdown(null);
                nextRound();
                setShowResultsModal(false);
            } else {
                const timer = setTimeout(() => {
                    setAutoNextRoundCountdown(prev => prev !== null ? prev - 1 : null);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [autoNextRoundCountdown]);

    const handleConfirmCashout = () => {
        if (!confirmCashoutSlipId) return
        setPendingSlips(prev => prev.map(s => s.id === confirmCashoutSlipId ? { ...s, cashedOut: true, status: 'Cashed Out', totalReturns: s.totalStake } : s))
        setConfirmCashoutSlipId(null)
    }

    const toggleSelection = (selection: any) => {
        const match = matches.find(m => m.id === selection.matchId)
        if (!match) return
        const virtualSelection = {
            ...selection,
            schoolA: match.participants[0]?.name,
            schoolB: match.participants[1]?.name,
            schoolC: match.participants[2]?.name,
            stage: match.stage,
            tournamentName: match.tournamentName,
            matchLabel: match.participants.map(p => p.name).join(' vs ')
        }

        setSelections(prev => {
            if (prev.find(s => s.selectionId === virtualSelection.selectionId)) {
                return prev.filter(s => s.selectionId !== virtualSelection.selectionId)
            }
            return [...prev, virtualSelection]
        })
    }

    const addToSlip = async () => {
        const totalStake = betMode === 'single' ? globalStake * selections.length : globalStake
        const balance = balanceType === 'cash' ? (profile?.balance || 0) : (profile?.bonusBalance || 0)

        // Use selected bonus if balanceType is 'gift'
        const finalBonusId = balanceType === 'gift' ? bonusId : undefined
        const finalBonusAmount = balanceType === 'gift' ? bonusAmount : 0

        if (totalStake > balance) return alert("Insufficient balance")

        const res = await placeBet(totalStake, selections, finalBonusId, finalBonusAmount, betMode) as any
        if (res.success) {
            setPendingSlips(prev => [...prev, {
                id: res.betId,
                selections: selections.map(s => ({ ...s, stakeUsed: betMode === 'single' ? globalStake : (totalStake / selections.length) })),
                mode: betMode,
                totalStake,
                totalOdds: calculateTotalOdds(selections),
                status: 'PENDING',
                potentialPayout: calculateTotalOdds(selections) * totalStake,
                timestamp: Date.now(),
                roundId: currentRound,
                stake: totalStake // Fix for prop spreading
            } as any])
            setSelections([])
            setSlipTab('pending')
            router.refresh()
        }
    }

    const skipToResult = () => {
        isSimulatingRef.current = false;
        setSimulationProgress(60);
    }

    const isSimulationActive = isSimulating || simulationProgress > 0

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <VirtualsHeader
                onBack={() => router.back()}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                setSelectedRegion={setSelectedRegion}
                availableRegions={availableRegions}
                balanceType={balanceType}
                onBalanceTypeChange={setBalanceType}
                balance={profile?.balance || 0}
                bonusBalance={profile?.bonusBalance || 0}
                hasPendingBets={pendingSlips.length > 0}
                onOpenHistory={() => setShowHistoryModal(true)}
                isSimulationActive={isSimulationActive}
                onSkip={skipToResult}
                isAuthenticated={isAuthenticated}
            />

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {activeLiveMatch && (
                        <VirtualsLivePlayer
                            match={activeLiveMatch}
                            schools={activeSchools}
                            aiStrengths={aiStrengths}
                            userSeed={userSeed}
                            simulationProgress={simulationProgress}
                            currentCommentary={currentCommentary}
                            countdown={countdown}
                            onClose={() => setActiveLiveMatchId(null)}
                            onSkip={skipToResult}
                            isSimulating={isSimulating}
                        />
                    )}

                    <VirtualsMatchList
                        isSimulationActive={isSimulationActive}
                        selectedCategory={selectedCategory}
                        selectedRegion={selectedRegion}
                        setSelectedRegion={setSelectedRegion}
                        availableRegions={availableRegions}
                        activeMarket={activeMarket}
                        setActiveMarket={setActiveMarket}
                        filteredMatches={filteredMatches}
                        isSimulating={isSimulating}
                        selections={selections}
                        toggleSelection={toggleSelection}
                        lastOutcome={lastOutcome}
                        outcomes={outcomes}
                        currentRound={currentRound}
                        simulationProgress={simulationProgress}
                        schools={activeSchools}
                        aiStrengths={aiStrengths}
                        userSeed={userSeed}
                        setSelectedMatchForDetails={setSelectedMatchForDetails}
                    />
                </main>
            </div>

            <VirtualsBetSlip
                isSimulationActive={isSimulationActive}
                pendingSlips={pendingSlips}
                selections={selections}
                isSimulating={isSimulating}
                onKickoff={kickoff}
                showSlip={showSlip}
                setShowSlip={setShowSlip}
                slipTab={slipTab}
                setSlipTab={setSlipTab}
                balanceType={balanceType}
                setBalanceType={setBalanceType}
                profile={profile}
                betMode={betMode}
                setBetMode={setBetMode}
                toggleSelection={toggleSelection}
                setSelections={setSelections}
                matches={matches}
                setSelectedMatchForDetails={setSelectedMatchForDetails}
                globalStake={globalStake}
                setGlobalStake={setGlobalStake}
                onPlaceBet={addToSlip}
                confirmCashoutSlipId={confirmCashoutSlipId}
                setConfirmCashoutSlipId={setConfirmCashoutSlipId}
                onConfirmCashout={handleConfirmCashout}
                hasConflicts={hasConflicts}
                isAuthenticated={isAuthenticated}
                gifts={gifts}
                bonusId={bonusId}
                setBonusId={setBonusId}
                bonusAmount={bonusAmount}
                setBonusAmount={setBonusAmount}
                showGiftModal={showGiftModal}
                setShowGiftModal={setShowGiftModal}
            />

            <VirtualsResults
                isOpen={showResultsModal}
                onClose={() => setShowResultsModal(false)}
                onNextRound={nextRound}
                lastOutcome={lastOutcome}
                autoNextRoundCountdown={autoNextRoundCountdown}
                betMode={betMode}
            />

            <VirtualsHistory
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                betHistory={betHistory}
            />

            {selectedMatchForDetails && (
                <MatchDetailsModal
                    match={selectedMatchForDetails}
                    onClose={() => setSelectedMatchForDetails(null)}
                    onOddsClick={toggleSelection}
                    checkSelected={(sid) => selections.some(s => s.selectionId === sid)}
                    checkIsCorrelated={() => false}
                />
            )}
        </div>
    );
}

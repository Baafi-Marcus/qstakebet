"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Selection as BetSlipSelection } from "@/lib/store/context"
import { MatchRow } from "@/components/ui/MatchRow"
import { MatchDetailsModal } from "@/components/ui/MatchDetailsModal"
import { cn } from "@/lib/utils"
import {
    generateVirtualMatches,
    simulateMatch,
    getRecentVirtualResults,
    VirtualMatchOutcome,
    VirtualSchool,
    DEFAULT_SCHOOLS // Added for AI strength fetching
} from "@/lib/virtuals"
import { updateSchoolStats, getAIStrengths, getPlayableSchools, settleVirtualBet } from "@/lib/virtual-actions" // Added for AI stats and Real Schools
import { placeBet } from "@/lib/bet-actions"
import { Match } from "@/lib/types"
import { MULTI_BONUS } from "@/lib/constants"
import {
    Zap, ShieldAlert,
    ChevronRight,
    Trophy, X, Info, ChevronLeft, ArrowLeft, Home, Ticket,
    Banknote,
    AlertTriangle,
    Wallet
} from "lucide-react"

interface VirtualsClientProps {
    user?: { id: string; email: string };
    profile?: { balance: number; currency: string; bonusBalance?: number };
    schools: VirtualSchool[];
    userSeed?: number; // Unique per user
}

const MAX_STAKE = 5000;
const MAX_GAME_PAYOUT = 3000; // GHS 3,000 aggregate cap per match

// Dynamic Stake Limits - Fix 6
const STAKE_LIMITS = {
    MATCH_WINNER: 50,
    PROPS: 20,
    TOTAL_SLIP: 100
};

function getCombinations<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    function backtrack(start: number, path: T[]) {
        if (path.length === size) {
            result.push([...path]);
            return;
        }
        for (let i = start; i < array.length; i++) {
            path.push(array[i]);
            backtrack(i + 1, path);
            path.pop();
        }
    }
    backtrack(0, []);
    return result;
}

function calculateTotalOdds(selections: { odds: number }[]) {
    // ... existing implementation ...
    if (selections.length === 0) return 0;
    const raw = selections.reduce((acc, s) => acc * s.odds, 1);
    return raw;
}

interface VirtualSelection {
    matchId: string;
    selectionId: string;
    label: string;
    odds: number;
    marketName: string;
    matchLabel: string;
    schoolA: string;
    schoolB: string;
    stakeUsed?: number; // Fix 6
}

interface VirtualBet {
    id: string;
    selections: VirtualSelection[];
    stake: number;
    potentialPayout: number;
    status: string;
    timestamp: number;
    roundId: number;
    time?: string;
    mode?: string;
    totalStake: number;
    totalOdds: number;
    combinations?: { selections: VirtualSelection[]; odds: number }[];
    stakePerCombo?: number;
    cashedOut?: boolean;
    totalReturns?: number;
    results?: ResolvedSelection[];
}

interface ResolvedSelection extends VirtualSelection {
    won: boolean;
    outcome: VirtualMatchOutcome;
}

interface ResolvedSlip extends VirtualBet {
    combinations?: {
        selections: ResolvedSelection[];
        won: boolean;
        return: number;
        odds: number;
    }[];
    results: ResolvedSelection[];
    totalReturns: number;
}

const getSchoolAcronym = (name: string, allParticipants: string[] = []) => {
    if (!name || typeof name !== 'string') return "";

    // Generate basic acronym
    const base = name
        .split(/[\s/-]+/)
        .map(word => word[0]?.toUpperCase())
        .join('');

    if (allParticipants.length <= 1) return base;

    // Check for collisions and identical names
    const acronyms: string[] = [];
    allParticipants.forEach((pName, pIdx) => {
        const ac = pName.split(/[\s/-]+/).map(w => w[0]?.toUpperCase()).join('');

        // Handle identical name collisions or acronym collisions
        let suffix = 0;
        let finalAc = ac;

        // Check if this specific name has appeared before in this list
        const occurrences = allParticipants.slice(0, pIdx).filter(n => n === pName).length;
        if (occurrences > 0) {
            suffix = occurrences;
            finalAc = `${ac}${suffix}`;
        }

        // Also check if this acronym conflicts with a DIFFERENT school's acronym
        while (acronyms.includes(finalAc)) {
            suffix++;
            finalAc = `${ac}${suffix}`;
        }

        acronyms.push(finalAc);
    });

    const myIndex = allParticipants.indexOf(name);
    // If multiple identical names, find the right one by checking unique indices
    // This is simple: just return the acronym at the First occurrence or consistent index
    // For the purpose of "ASH1 vs ASH2", we search for the specific instance index if possible.
    // However, the caller usually just passes the name. Let's return based on the first occurrence's pre-calculated acronym
    // for simplicity, or just return the acronyms[myIndex].

    // Better: let the UI pass the index if it wants strictly unique suffixes for same names.
    // If not, we'll just return the first occurrence's acronym.
    return acronyms[myIndex] || base;
}

const normalizeSchoolName = (name: string) => {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

export function VirtualsClient({ profile, schools, userSeed = 0 }: VirtualsClientProps) {
    const router = useRouter()

    // Core Game State
    const [activeTab, setActiveTab] = useState<'all' | 'regional' | 'national'>('all')
    const [activeMarket, setActiveMarket] = useState<
        'winner' |
        'total_points' |
        'winning_margin' |
        'highest_scoring_round' |
        'round_winner' |
        'perfect_round' |
        'shutout_round' |
        'first_bonus' |
        'comeback_win' |
        'comeback_team' |
        'lead_changes' |
        'late_surge'
    >('winner')
    // const [historyTab, setHistoryTab] = useState<'results' | 'bets'>('results') // Unused
    const [betMode, setBetMode] = useState<'single' | 'multi'>('single')
    const [showSlip, setShowSlip] = useState(false)
    const [currentRound, setCurrentRound] = useState(() => {
        const now = Date.now()
        const cycleTime = 60000 // 1 minute
        return Math.floor(now / cycleTime)
    })

    // REAL SCHOOLS: Fetch from DB
    const [activeSchools, setActiveSchools] = useState<VirtualSchool[]>(schools || DEFAULT_SCHOOLS)

    useEffect(() => {
        const loadSchools = async () => {
            const realSchools = await getPlayableSchools();
            if (realSchools.length > 0) {
                setActiveSchools(realSchools);
            }
        }
        loadSchools();
    }, [])

    // AI LEARNING: Store strengths in state
    const [aiStrengths, setAiStrengths] = useState<Record<string, number>>({})

    // Fetch AI Strengths on Load / Round Change
    useEffect(() => {
        const loadAI = async () => {
            const names = activeSchools.map(s => s.name); // Use dynamic schools list
            const stats = await getAIStrengths(names);
            const strengthMap: Record<string, number> = {};
            stats.forEach(s => {
                if (s.name && s.form) strengthMap[s.name] = s.form;
            });
            setAiStrengths(strengthMap);
        }
        loadAI();
    }, [currentRound, activeSchools]) // Re-run if schools change


    const recentResults = useMemo(() => {
        return getRecentVirtualResults(6, schools, currentRound, userSeed)
    }, [currentRound, schools, userSeed])

    const { matches, outcomes } = useMemo(() => {
        return generateVirtualMatches(8, schools, currentRound, aiStrengths, userSeed);
    }, [currentRound, schools, aiStrengths, userSeed])

    // Keep outcomes in a ref for access during simulation without triggering re-renders
    const outcomesRef = useRef<VirtualMatchOutcome[]>(outcomes)
    useEffect(() => {
        outcomesRef.current = outcomes
    }, [outcomes])

    const [selections, setSelections] = useState<VirtualSelection[]>([])
    const [globalStake, setGlobalStake] = useState(0)

    // Split history: betHistory for user bets, validHistory for past results if needed (though user only wants bet history corrected)
    const [betHistory, setBetHistory] = useState<VirtualBet[]>([])
    const [slipTab, setSlipTab] = useState<'selections' | 'pending'>('selections')

    // Load bet history from database on mount
    useEffect(() => {
        const loadBetHistory = async () => {
            try {
                const response = await fetch('/api/user/bets?type=virtual&limit=20')
                if (response.ok) {
                    const data = await response.json()
                    // Transform database bets to VirtualBet format
                    const virtualBets = data.bets.map((bet: any) => ({
                        id: bet.id,
                        selections: bet.selections,
                        stake: bet.stake,
                        totalOdds: bet.totalOdds,
                        potentialPayout: bet.potentialPayout,
                        status: bet.status,
                        results: [], // Results are in selections
                        totalReturns: bet.status === 'won' ? bet.potentialPayout : 0,
                        isGift: bet.isBonusBet
                    }))
                    setBetHistory(virtualBets)
                }
            } catch (error) {
                console.error('Failed to load bet history:', error)
            }
        }
        loadBetHistory()
    }, [])

    const [isSimulating, setIsSimulating] = useState(false)
    const [simulationProgress, setSimulationProgress] = useState(0)
    const [pendingSlips, setPendingSlips] = useState<VirtualBet[]>([])
    const [lastOutcome, setLastOutcome] = useState<{
        allRoundResults: VirtualMatchOutcome[];
        roundId: number;
        resolvedSlips: ResolvedSlip[];
        results: ResolvedSelection[];
    } | null>(null)
    const [showResultsModal, setShowResultsModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [activeLiveMatch, setActiveLiveMatch] = useState<string | null>(null)
    const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null)
    const [viewedHistoryTicket, setViewedHistoryTicket] = useState<VirtualBet | null>(null)
    const [confirmCashoutSlipId, setConfirmCashoutSlipId] = useState<string | null>(null)
    const [countdown, setCountdown] = useState<'READY' | '3' | '2' | '1' | 'START' | null>(null)
    const [balanceType, setBalanceType] = useState<'cash' | 'gift'>('cash')
    const isSimulatingRef = useRef(false)


    const activeOutcome = useMemo(() => {
        if (!activeLiveMatch) return null;
        return simulateMatch(currentRound, matches.findIndex(m => m.id === activeLiveMatch), schools, activeLiveMatch.includes('regional') ? 'regional' : 'national', aiStrengths, userSeed);
    }, [activeLiveMatch, currentRound, matches, schools, aiStrengths, userSeed])

    const filteredMatches = useMemo(() => {
        if (activeTab === 'all') return matches
        return matches.filter(m => {
            if (activeTab === 'regional') return m.stage === "Regional Qualifier"
            if (activeTab === 'national') return m.stage === "National Championship"
            return true
        })
    }, [matches, activeTab])

    // Handle browser back button when results modal is open
    useEffect(() => {
        if (showResultsModal) {
            // Push a new history state when modal opens
            window.history.pushState({ modalOpen: true }, '');

            const handlePopState = () => {
                // Close modal instead of navigating away
                setShowResultsModal(false);
                // Push state again to stay on the page
                window.history.pushState({ modalOpen: false }, '');
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [showResultsModal]);

    const nextRound = () => {
        setCurrentRound(prev => prev + 1)
        setSelections([])
        setSimulationProgress(0)
        setIsSimulating(false)
    }

    // Handle browser back button to advance to next round
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state?.virtualGameState) {
                // Close modal and advance to next round
                setShowResultsModal(false);
                nextRound();
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);



    const kickoff = async () => {
        if (isSimulating) return

        // Save current game state to browser history before simulation
        window.history.pushState({
            virtualGameState: {
                round: currentRound,
                selections: selections,
                pendingSlips: pendingSlips
            }
        }, '');

        setIsSimulating(true)
        isSimulatingRef.current = true
        setSimulationProgress(0)
        setShowSlip(false) // Auto-hide slip on kickoff

        if (matches.length > 0) {
            // Priority 1: Match from a pending slip
            // Priority 2: First match in the list
            const bettedMatchId = pendingSlips.length > 0 ? pendingSlips[0].selections[0].matchId : matches[0].id
            setActiveLiveMatch(bettedMatchId)
        }

        // Countdown - Run for EVERY round to build hype
        setCountdown('READY')
        await new Promise(r => setTimeout(r, 600))
        setCountdown('3')
        await new Promise(r => setTimeout(r, 800))
        setCountdown('2')
        await new Promise(r => setTimeout(r, 800))
        setCountdown('1')
        await new Promise(r => setTimeout(r, 800))
        setCountdown('START')
        await new Promise(r => setTimeout(r, 600))
        setCountdown(null)


        // Progress over 60 seconds
        const duration = 60000
        const intervals = 60
        const step = duration / intervals

        for (let i = 1; i <= intervals; i++) {
            if (!isSimulatingRef.current) break; // Use ref to handle closure/skip
            await new Promise(r => setTimeout(r, step))
            setSimulationProgress(prev => Math.min(60, prev + 1))
        }

        // Finalize results
        // Finalize results using the PRE-CALCULATED outcomes (Consistency)
        const allRoundResults = outcomesRef.current;

        // SAVE RESULTS TO AI BRAIN
        // Fire and forget - don't await to avoid blocking UI
        updateSchoolStats(allRoundResults).catch(e => console.error("AI Learning Failed:", e));



        // Helper for checking wins across all 14 markets
        const checkSelectionWin = (selection: VirtualSelection, outcome: VirtualMatchOutcome) => {
            if (!outcome) return false;

            const { marketName, label } = selection;

            if (marketName === "Match Winner") {
                const winner = outcome.schools[outcome.winnerIndex];
                // Map "1", "2", "3" to the actual school name
                let predictedWinner = label;
                if (label === "1") predictedWinner = outcome.schools[0];
                if (label === "2") predictedWinner = outcome.schools[1];

                return normalizeSchoolName(predictedWinner) === normalizeSchoolName(winner);
            }

            if (marketName === "Total Points") {
                const total = outcome.totalScores.reduce((a, b) => a + b, 0);
                const line = parseFloat(label.split(' ')[1]);
                const type = label.split(' ')[0];
                return type === "Over" ? total > line : total < line;
            }

            if (marketName === "Winning Margin") {
                const sorted = [...outcome.totalScores].sort((a, b) => b - a);
                const margin = sorted[0] - sorted[1];
                if (label === "1-10") return margin >= 1 && margin <= 10;
                if (label === "11-25") return margin >= 11 && margin <= 25;
                if (label === "26+") return margin >= 26;
            }


            if (marketName === "Perfect Round") {
                // Any round perfect
                const isPerfect = outcome.stats.perfectRound.some(p => p);
                return label === "Yes" ? isPerfect : !isPerfect;
            }

            // Handle Per-Round Perfect Markets
            if (marketName.startsWith("Perfect Round ")) {
                const roundNum = parseInt(marketName.split(" ")[2]); // "Perfect Round 1" -> 1
                if (!isNaN(roundNum)) {
                    const roundIndex = roundNum - 1;
                    const isPerfect = outcome.stats.perfectRound[roundIndex];
                    return label === "Yes" ? isPerfect : !isPerfect;
                }
            }

            if (marketName === "Shutout Round") {
                const isShutout = outcome.stats.shutoutRound.some(s => s);
                return label === "Yes" ? isShutout : !isShutout;
            }

            if (marketName.includes("Winner")) {
                // "Round 1 Winner" -> "Round 1"
                const roundNum = parseInt(marketName.split(" ")[1]);
                const roundIndex = roundNum - 1;
                const roundScores = outcome.rounds[roundIndex].scores;
                const maxScore = Math.max(...roundScores);
                const winnerIdx = roundScores.indexOf(maxScore);

                // Check for draw in round
                const winnersCount = roundScores.filter(s => s === maxScore).length;
                if (winnersCount > 1) return false; // Draw = Lost for now

                let predictedWinner = label;
                if (label === "1") predictedWinner = outcome.schools[0];
                if (label === "2") predictedWinner = outcome.schools[1];

                return normalizeSchoolName(predictedWinner) === normalizeSchoolName(outcome.schools[winnerIdx]);
            }

            if (marketName === "First Bonus") {
                let predictedWinner = label;
                if (label === "1") predictedWinner = outcome.schools[0];
                if (label === "2") predictedWinner = outcome.schools[1];
                return normalizeSchoolName(predictedWinner) === normalizeSchoolName(outcome.schools[outcome.stats.firstBonusIndex]);
            }

            if (marketName === "Fastest Buzz") {
                let predictedWinner = label;
                if (label === "1") predictedWinner = outcome.schools[0];
                if (label === "2") predictedWinner = outcome.schools[1];
                return normalizeSchoolName(predictedWinner) === normalizeSchoolName(outcome.schools[outcome.stats.firstBonusIndex]);
            }

            if (marketName === "Comeback Win") {
                const isComeback = outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0;
                return label === "Yes" ? isComeback : !isComeback;
            }

            if (marketName === "Comeback Team") {
                const isComeback = outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0;
                const comebackWinner = isComeback ? outcome.schools[outcome.winnerIndex] : "None";
                return normalizeSchoolName(label) === normalizeSchoolName(comebackWinner);
            }

            if (marketName === "Lead Changes") {
                const line = 2.5;
                const changes = outcome.stats.leadChanges;
                const type = label.split(' ')[0];
                return type === "Over" ? changes > line : changes < line;
            }

            if (marketName === "Late Surge") {
                return normalizeSchoolName(label) === normalizeSchoolName(outcome.schools[outcome.stats.lateSurgeIndex]);
            }

            if (marketName === "Strong Start") {
                return normalizeSchoolName(label) === normalizeSchoolName(outcome.schools[outcome.stats.strongStartIndex]);
            }

            if (marketName === "Highest Points") {
                // Total winner
                return normalizeSchoolName(label) === normalizeSchoolName(outcome.schools[outcome.winnerIndex]);
            }

            if (marketName === "Leader After Round 1") {
                // Check scores after R1
                const r1Scores = outcome.rounds[0].scores;
                const max = Math.max(...r1Scores);
                const winnerIdx = r1Scores.indexOf(max);
                // Handle draw?
                const winnersCount = r1Scores.filter(s => s === max).length;
                if (winnersCount > 1) return false;
                return normalizeSchoolName(label) === normalizeSchoolName(outcome.schools[winnerIdx]);
            }


            return false;
        }

        const resolvedSlips: ResolvedSlip[] = pendingSlips.map(slip => {
            if (slip.mode === 'system') {
                const resolvedCombinations = (slip.combinations || []).map((combo: { selections: VirtualSelection[], odds: number }) => {
                    const comboResults: ResolvedSelection[] = combo.selections.map((sel: VirtualSelection) => {
                        const parts = sel.matchId.split("-")
                        const rId = parseInt(parts[1])
                        const mIdx = parseInt(parts[2])
                        const cat = parts[3] as 'regional' | 'national'

                        // Regenerate outcome specifically for this match to ensure correctness across rounds
                        // Ideally we should use the stored outcomes, but for slip resolution of past/different rounds we might need re-simulation.
                        // Important: Pass aiStrengths to maintain consistency with how it was generated!
                        const outcome = simulateMatch(rId, mIdx, schools, cat, aiStrengths);

                        const won = checkSelectionWin(sel, outcome);

                        return { ...sel, won, outcome }
                    })

                    const comboWon = comboResults.every(r => r.won)
                    const comboOdds = calculateTotalOdds(comboResults)
                    const comboReturn = comboWon ? (comboOdds * (slip.stakePerCombo || 0)) : 0
                    return { selections: comboResults, won: comboWon, return: comboReturn, odds: comboOdds }
                })
                // ... rest of system logic
                const rawTotalReturns = resolvedCombinations.reduce((acc: number, c: { return: number }) => acc + c.return, 0)

                // 🎰 10x STAKE SAFETY CAP for Systems
                const totalStake = slip.totalStake || ((slip.stakePerCombo || 0) * (slip.combinations || []).length);
                const maxAllowedReturn = totalStake * 3000; // Just use a high safety cap
                const totalReturns = Math.min(rawTotalReturns, maxAllowedReturn);

                // Small Book Cap removed as requested
                const allResults = Array.from(new Set(resolvedCombinations.flatMap(c => c.selections)));
                return { ...slip, combinations: resolvedCombinations, results: allResults, totalReturns, status: totalReturns > 0 ? 'WON' : 'LOST' } as ResolvedSlip
            }

            const results: ResolvedSelection[] = slip.selections.map((sel: VirtualSelection) => {
                const parts = sel.matchId.split("-")
                const rId = parseInt(parts[1])
                const mIdx = parseInt(parts[2])
                const cat = parts[3] as 'regional' | 'national'

                // Regenerate outcome specifically for this match to ensure correctness across rounds
                const outcome = simulateMatch(rId, mIdx, schools, cat, aiStrengths);

                const won = checkSelectionWin(sel, outcome);

                return { ...sel, won, outcome }
            })

            let totalReturns = 0
            let isWon = false

            if (slip.mode === 'multi') {
                const allWon = results.every(r => r.won)
                const multiOdds = calculateTotalOdds(results)
                const rawReturn = allWon ? (multiOdds * slip.totalStake) : 0

                // Match SportyBet Logic: Base Win + Bonus (Capped at 250)
                // No artificial 10x stake cap.

                let bonusAmount = 0;
                if (slip.selections.length >= MULTI_BONUS.MIN_SELECTIONS) {
                    let bonusPct = 0;
                    Object.entries(MULTI_BONUS.SCALING)
                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                        .some(([threshold, percent]) => {
                            if (slip.selections.length >= Number(threshold)) {
                                bonusPct = Number(percent);
                                return true;
                            }
                            return false;
                        });
                    bonusAmount = Math.min(rawReturn * (bonusPct / 100), MULTI_BONUS.MAX_BONUS_AMOUNT_CAP);
                }

                totalReturns = rawReturn + bonusAmount;


                isWon = allWon && totalReturns > 0
            } else {
                // Single logic: per-game returns
                // 🛑 Fix 5: Aggregate Payout Cap (per match) - Capping stacked markets
                const gameReturns: Record<string, number> = {};

                results.forEach((r) => {
                    if (r.won) {
                        const amount = r.odds * (r.stakeUsed ?? 0);
                        gameReturns[r.matchId] = (gameReturns[r.matchId] || 0) + amount;
                    }
                });

                // Apply GHS 3,000 cap per game before summing
                Object.keys(gameReturns).forEach((matchId: string) => {
                    if (gameReturns[matchId] > MAX_GAME_PAYOUT) {
                        gameReturns[matchId] = MAX_GAME_PAYOUT;
                    }
                });

                const cappedReturn = Object.values(gameReturns).reduce((a: number, b: number) => a + b, 0);

                // No 10x cap for singles. Just sum the returns.
                totalReturns = cappedReturn;


                isWon = totalReturns > 0
            }

            let finalResults = results
            let finalReturns = totalReturns
            let finalStatus = isWon ? 'WON' : 'LOST'

            // GUARANTEED WIN: If cashed out, force WON status and set returns to EXACT STAKE (Refund)
            // But we still process results so user can see what WOULD have happened
            if (slip.cashedOut) {
                // Keep the actual results calculation for history display
                finalResults = results;

                // Refund Stake logic: User gets back exactly what they put in (already refunded in handleConfirmCashout)
                finalReturns = slip.totalStake;
                finalStatus = 'Cashed Out';
            }

            return {
                ...slip,
                results: finalResults,
                totalReturns: finalReturns,
                status: finalStatus,
                combinations: undefined // Fix type incompatibility with ResolvedSlip
            } as ResolvedSlip
        })

        // Flatten all results from all slips for the ResultsModal summary
        const flattenedResults = resolvedSlips.flatMap(slip => slip.results)

        // FIX: Only add actual resolved tickets to bet history, not generic round results
        if (resolvedSlips.length > 0) {
            setBetHistory(prev => [...resolvedSlips, ...prev])

            // 💰 SERVER SETTLEMENT: Pay out winners on the server
            resolvedSlips.forEach(async (slip) => {
                try {
                    await settleVirtualBet(slip.id, currentRound, userSeed)
                } catch (e) {
                    console.error("Failed to settle slip:", slip.id, e)
                }
            })

            // REFRESH BALANCE: Small delay to allow DB settlement to commit
            setTimeout(() => {
                router.refresh()
            }, 1000)
        }

        setLastOutcome({ allRoundResults, roundId: currentRound, resolvedSlips, results: flattenedResults })
        setIsSimulating(false)
        isSimulatingRef.current = false
        setSimulationProgress(60)
        setShowResultsModal(true)
        setPendingSlips([])
        setActiveLiveMatch(null)
    }

    const handleConfirmCashout = () => {
        if (!confirmCashoutSlipId) return;

        const slip = pendingSlips.find(s => s.id === confirmCashoutSlipId);
        if (!slip) {
            setConfirmCashoutSlipId(null);
            return;
        }

        // 1. Refund Stake - (Handled by server/reload)

        // 2. Mark as Cashed Out in Pending (Do NOT move to history yet)
        setPendingSlips(prev => prev.map(s =>
            s.id === confirmCashoutSlipId
                ? { ...s, cashedOut: true, status: 'Cashed Out', totalReturns: slip.totalStake }
                : s
        ));

        // 3. Close Confirmation
        setConfirmCashoutSlipId(null);
    };


    const skipToResult = () => {
        isSimulatingRef.current = false
        setIsSimulating(false)
        setSimulationProgress(60)
    }

    // 🔗 MARKET CORRELATION GROUPS (Rule of 3)
    // Markets are grouped by their core outcome driver
    const getMarketDriver = (marketName: string): 'WIN' | 'POINTS' | 'FLOW' | null => {
        const winDrivers = ['Winner', 'Margin', 'Comeback', 'Late Surge'];
        const pointsDrivers = ['Points', 'Round', 'Phase', 'Perfect', 'Shutout'];
        const flowDrivers = ['Bonus', 'Lead Changes'];

        if (winDrivers.some(d => marketName.includes(d))) return 'WIN';
        if (pointsDrivers.some(d => marketName.includes(d))) return 'POINTS';
        if (flowDrivers.some(d => marketName.includes(d))) return 'FLOW';
        return null; // Don't block if unknown
    };

    const toggleSelection = (selection: BetSlipSelection) => {
        const match = matches.find(m => m.id === selection.matchId)
        if (!match) return

        const virtualSelection: VirtualSelection = {
            ...selection,
            schoolA: match.participants[0]?.name || "",
            schoolB: match.participants[1]?.name || ""
        }

        setSelections(prev => {
            const exists = prev.find(s => s.selectionId === virtualSelection.selectionId)
            if (exists) {
                const newSels = prev.filter(s => s.selectionId !== virtualSelection.selectionId)
                // Auto-switch to Multi if > 1 selection, Single if 1
                const count = newSels.length;
                if (count > 1) {
                    setBetMode('multi')
                } else if (count === 1) {
                    setBetMode('single')
                }
                return newSels
            }

            // 🔒 CORRELATION CHECK (Rule of 3)
            // Check if adding this selection would violate the "one market per driver per match" rule
            const newDriver = getMarketDriver(virtualSelection.marketName);
            const sameMatchSelections = prev.filter(s => s.matchId === virtualSelection.matchId);

            const conflictingSelection = sameMatchSelections.find(s => {
                const existingDriver = getMarketDriver(s.marketName);
                // Conflict ONLY if it's a DIFFERENT market in the same driver group
                return existingDriver === newDriver && s.marketName !== virtualSelection.marketName;
            });

            if (conflictingSelection) {
                // ❌ SILENTLY BLOCK
                return prev;
            }

            // Auto-switch to Multi if adding makes it > 1
            if ([...prev, virtualSelection].length > 1) {
                setBetMode('multi')
            }
            return [...prev, virtualSelection]
        })
    }

    // Helper to check if a market would be correlated (for visual disabled state)
    const checkIsCorrelated = (): boolean => {
        // User requested to remove strict visual blocking to allow Single bets on same-match markets.
        // We still enforce Single-mode via hasConflicts logic.
        return false;
    };

    const totalOdds = useMemo(() => {
        return calculateTotalOdds(selections)
    }, [selections])

    // Check if any match has multiple selections
    const hasConflicts = useMemo(() => {
        const matchCounts: Record<string, number> = {}
        selections.forEach(s => {
            matchCounts[s.matchId] = (matchCounts[s.matchId] || 0) + 1
        })
        return Object.values(matchCounts).some(count => count > 1)
    }, [selections])

    // Effect to force single mode if conflicts exist
    useEffect(() => {
        if (hasConflicts && betMode === 'multi') {
            // Wait for next tick to avoid cascading render warning
            const timer = setTimeout(() => {
                setBetMode('single')
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [hasConflicts, betMode])

    const addToSlip = async () => {
        if (selections.length === 0) return

        let totalStakeUsed = 0;
        const finalSelections = [...selections];
        const combinations: { selections: VirtualSelection[], odds: number }[] = [];
        const stakePerCombo = 0;

        if (betMode === 'single') {
            totalStakeUsed = globalStake * selections.length
        } else if (betMode === 'multi') {
            totalStakeUsed = globalStake
        }

        if (totalStakeUsed > (balanceType === 'cash' ? (profile?.balance || 0) : (profile?.bonusBalance || 0))) {
            alert(`Insufficient ${balanceType} balance.`);
            return;
        }

        const serverSelections = finalSelections.map(s => ({
            matchId: s.matchId,
            selectionId: s.selectionId,
            label: s.label,
            odds: s.odds,
            marketName: s.marketName,
            matchLabel: s.matchLabel
        }));

        try {
            // Place real bet via server action
            const result = await placeBet(
                totalStakeUsed,
                serverSelections,
                undefined,
                balanceType === 'gift' ? totalStakeUsed : 0,
                betMode
            ) as { success: true; betId: string } | { success: false; error: string };

            if (result.success) {
                const totalOdds = calculateTotalOdds(finalSelections);
                const baseWin = betMode === 'single'
                    ? finalSelections.reduce((acc, s) => acc + ((s.stakeUsed || globalStake) * (s.odds || 1)), 0)
                    : totalStakeUsed * totalOdds;

                let bonusAmount = 0;
                if (betMode === 'multi' && finalSelections.length >= MULTI_BONUS.MIN_SELECTIONS) {
                    let bonusPct = 0;
                    Object.entries(MULTI_BONUS.SCALING)
                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                        .some(([threshold, percent]) => {
                            if (finalSelections.length >= Number(threshold)) {
                                bonusPct = Number(percent);
                                return true;
                            }
                            return false;
                        });
                    bonusAmount = Math.min(baseWin * (bonusPct / 100), MULTI_BONUS.MAX_BONUS_AMOUNT_CAP);
                }

                const potPayout = baseWin + bonusAmount;

                const newSlip: VirtualBet = {
                    id: result.betId || `slip-${Date.now()}`,
                    selections: finalSelections.map(s => ({ ...s, stakeUsed: betMode === 'single' ? globalStake : (totalStakeUsed / selections.length) })),
                    mode: betMode,
                    totalStake: totalStakeUsed,
                    totalOdds: totalOdds,
                    combinations: combinations,
                    stakePerCombo: stakePerCombo,
                    time: new Date().toLocaleTimeString(),
                    status: 'PENDING',
                    stake: totalStakeUsed,
                    potentialPayout: potPayout,
                    timestamp: Date.now(),
                    roundId: currentRound
                }

                setPendingSlips(prev => [...prev, newSlip])
                setSelections([])
                setSlipTab('pending')
                // refresh profile or wait for next round to refresh balance if needed
                // For now, local UI update will follow round end or we can trigger a router refresh
                router.refresh();
            } else {
                alert(result.error || "Failed to place bet");
            }
        } catch (e) {
            console.error("Bet placement failed:", e);
            alert("An error occurred while placing your bet.");
        }
    }

    const renderSimulationPlayer = () => {
        const match = matches.find(m => m.id === activeLiveMatch);
        if (!match) return null;
        const stage = match.id.split("-")[3] as 'regional' | 'national';
        const outcome = simulateMatch(parseInt(match.id.split("-")[1]), parseInt(match.id.split("-")[2]), schools, stage, aiStrengths);
        const currentRoundIdx = Math.min(4, Math.floor((simulationProgress / 60) * 5));
        const displayScores = outcome.rounds[currentRoundIdx]?.scores || [0, 0];
        const isFullTime = simulationProgress >= 60;

        return (
            <div className="shrink-0 bg-slate-950 border-b border-white/10 relative z-30">
                {/* Countdown Overlay */}
                {countdown && (
                    <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                            <div className="px-6 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-8 shadow-2xl shadow-red-600/20">
                                Prepare to win
                            </div>
                            <div className={cn(
                                "text-8xl md:text-[10rem] font-black italic tracking-tighter transition-all duration-300",
                                countdown === 'START' ? "text-emerald-400 scale-110 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]" : "text-white"
                            )}>
                                {countdown}
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative bg-emerald-950/80 overflow-hidden h-[200px] flex flex-col">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-x-8 inset-y-8 border-2 border-white/20 rounded-lg" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full" />
                    </div>

                    <div className="relative z-10 p-4 flex flex-col items-center justify-center flex-1">
                        <div className="flex flex-col items-center gap-1 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">{match.stage} • Matchday {parseInt(match.id.split("-")[1])}</span>
                            </div>
                            <div className="px-2 py-0.5 bg-white/10 rounded text-[8px] font-black text-white/40 uppercase tracking-widest">
                                Round {currentRoundIdx + 1}
                            </div>
                            {!isSimulating && (
                                <button
                                    onClick={() => setActiveLiveMatch(null)}
                                    className="absolute right-4 top-4 p-2 bg-black/20 hover:bg-black/40 text-white/50 hover:text-white rounded-full transition-colors z-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 md:gap-10 w-full max-w-xl justify-center mb-4">
                            {outcome.schools.map((school: string, sIdx: number) => (
                                <React.Fragment key={sIdx}>
                                    <div className="flex flex-col items-center gap-2 flex-1">
                                        <div className="text-5xl font-black italic text-white drop-shadow-lg tabular-nums">
                                            {displayScores[sIdx]}
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest text-center truncate w-full max-w-[100px]">{school}</span>
                                    </div>
                                    {sIdx === 0 && <div className="text-white/20 font-black italic text-xs mb-6 px-4">VS</div>}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="w-full max-w-xs grid grid-cols-5 gap-1">
                            {outcome.rounds.slice(0, 5).map((r, rIdx) => (
                                <div key={rIdx} className={cn(
                                    "flex flex-col items-center p-1 rounded border transition-all duration-300",
                                    rIdx === currentRoundIdx ? "bg-white/20 border-white/40 scale-110 shadow-lg" :
                                        "bg-black/20 border-white/5 opacity-10"
                                )}>
                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className={cn("h-full", rIdx === currentRoundIdx ? "bg-emerald-400 w-full" : "w-0")} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skip Button - Compact inside player */}
                    {isSimulating && simulationProgress < 60 && (
                        <button
                            onClick={kickoff}
                            className="absolute bottom-4 right-4 bg-black/40 hover:bg-white text-white hover:text-black border border-white/10 hover:border-white px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                            Skip
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Custom Virtuals Navbar */}
            <div className="flex items-center bg-slate-900 shadow-lg border-b border-white/5 sticky top-0 z-50 py-3 px-4 gap-4">
                {/* Left: Back Button */}
                <button
                    onClick={() => router.push('/')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors shrink-0"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="h-6 w-px bg-white/10 shrink-0" />

                {/* Middle: Scrollable Filters */}
                <div className="flex-1 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn("text-xs font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg whitespace-nowrap", activeTab === 'all' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-slate-500 hover:text-slate-300")}
                        >
                            All Matches
                        </button>
                        <button
                            onClick={() => setActiveTab('regional')}
                            className={cn("text-xs font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg whitespace-nowrap", activeTab === 'regional' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-slate-500 hover:text-slate-300")}
                        >
                            Regional
                        </button>
                        <button
                            onClick={() => setActiveTab('national')}
                            className={cn("text-xs font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg whitespace-nowrap", activeTab === 'national' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-slate-500 hover:text-slate-300")}
                        >
                            National
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pl-2 border-l border-white/10">
                    <div
                        onClick={() => setBalanceType('cash')}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-3 py-1.5 border transition-all cursor-pointer active:scale-95",
                            balanceType === 'cash' ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-950/30 border-white/5 opacity-60"
                        )}
                    >
                        <Wallet className={cn("h-3 w-3", balanceType === 'cash' ? "text-green-500" : "text-slate-400")} />
                        <span className={cn("text-xs font-black font-mono", balanceType === 'cash' ? "text-white" : "text-slate-500")}>
                            {(profile?.balance || 0).toFixed(2)}
                        </span>
                    </div>

                    <div
                        onClick={() => setBalanceType('gift')}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-3 py-1.5 border transition-all cursor-pointer active:scale-95",
                            balanceType === 'gift' ? "bg-purple-500/10 border-purple-500/40" : "bg-slate-950/30 border-white/5 opacity-60"
                        )}
                    >
                        <Zap className={cn("h-3 w-3", balanceType === 'gift' ? "text-purple-400" : "text-slate-500")} />
                        <span className={cn("text-xs font-black font-mono", balanceType === 'gift' ? "text-purple-300" : "text-slate-500")}>
                            {(profile?.bonusBalance || 0).toFixed(2)}
                        </span>
                    </div>

                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors relative"
                    >
                        <Ticket className="h-4 w-4" />
                        {/* Dot indicator if active bets exist? */}
                        {betHistory.some(b => b.status === "PENDING") && (
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-slate-900" />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                    {/* PLAYER VIEW */}
                    {activeLiveMatch && renderSimulationPlayer()}

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-44 md:pb-32">
                        {/* Market Scroller */}
                        <div className="flex bg-slate-950/80 border-b border-white/5 overflow-x-auto no-scrollbar py-2 px-4 -mx-4 md:-mx-8 mb-4">
                            <div className="flex items-center gap-4 min-w-max">
                                {[
                                    { id: 'winner', label: 'Match Winner' },
                                    { id: 'total_points', label: 'Total Points' },
                                    { id: 'winning_margin', label: 'Winning Margin' },
                                    { id: 'round_winner', label: 'Round Winners' },
                                    { id: 'perfect_round', label: 'Perfect Round' },
                                    { id: 'shutout_round', label: 'Shutout Round' },
                                    { id: 'first_bonus', label: 'First Bonus' },
                                    { id: 'comeback_win', label: 'Comeback Win' },
                                    { id: 'comeback_team', label: 'Comeback Team' },
                                    { id: 'lead_changes', label: 'Lead Changes' },
                                    { id: 'late_surge', label: 'Late Surge' },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setActiveMarket(m.id as typeof activeMarket)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap",
                                            activeMarket === m.id
                                                ? "bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20"
                                                : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        {m.label.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Match List Header */}
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-y border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span className="flex-1">Match / Contestants</span>
                            <div className="flex gap-4 md:gap-8 pr-12 min-w-[200px] justify-end">
                                <span>{activeMarket === 'winner' ? '1 - 2 - 3' : 'Selections'}</span>
                            </div>
                        </div>

                        {/* Match List */}
                        <div className="flex flex-col mb-12 bg-slate-950/20 rounded-b-2xl border-x border-b border-white/5">
                            {filteredMatches.map((match) => (
                                <div key={match.id} className="relative group">
                                    <MatchRow
                                        match={match}
                                        activeMarket={activeMarket}
                                        onOddsClick={toggleSelection}
                                        checkSelected={(sid) => selections.some(s => s.selectionId === sid)}
                                        checkIsCorrelated={() => false}
                                        onMoreClick={(m) => !isSimulating && setSelectedMatchForDetails(m)}
                                        isSimulating={isSimulating}
                                        isFinished={!isSimulating && lastOutcome?.roundId === currentRound}
                                        currentRoundIdx={Math.min(4, Math.floor((simulationProgress / 60) * 5))}
                                        currentScores={(() => {
                                            if (!isSimulating && lastOutcome?.roundId !== currentRound) return undefined;

                                            // If finished, show final scores from lastOutcome
                                            if (!isSimulating && lastOutcome?.roundId === currentRound) {
                                                const matchOutcome = lastOutcome.allRoundResults.find(r => r.id === match.id);
                                                return matchOutcome?.totalScores as [number, number];
                                            }

                                            // If simulating, current progress scores
                                            const parts = match.id.split("-");
                                            const stage = parts[3] === "Regional Qualifier" ? "regional" : "national";
                                            const outcome = simulateMatch(parseInt(parts[1]), parseInt(parts[2]), schools, stage);
                                            const cRoundIdx = Math.min(4, Math.floor((simulationProgress / 60) * 5));
                                            const roundsToShow = outcome.rounds.slice(0, cRoundIdx + 1);
                                            return [0, 1].map(sIdx => roundsToShow.reduce((acc, r) => acc + r.scores[sIdx], 0)) as [number, number];
                                        })()}
                                    />
                                    {isSimulating && (
                                        <button
                                            onClick={() => setActiveLiveMatch(match.id)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-red-600/20 z-10"
                                        >
                                            View Live
                                        </button>
                                    )}
                                </div>
                            ))}
                            {filteredMatches.length === 0 && (
                                <div className="py-20 text-center">
                                    <p className="text-slate-500 font-bold uppercase tracking-widest">No matches in Round {currentRound}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Pending Slips
                            </h2>
                        </div>

                        {/* Pending list removed from here as it moves inside Betslip modal */}
                    </div>

                    {/* Fixed Bottom Navigation - SportyBet Style Tab Bar */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 px-2 flex flex-col justify-center pb-[env(safe-area-inset-bottom,16px)] pt-2">
                        <div className="max-w-[1400px] mx-auto w-full flex items-stretch h-[56px] md:h-[64px] gap-2">
                            {/* Left Section: Contextual Actions */}
                            <div className="flex-1 flex items-center gap-2">
                                <button
                                    onClick={nextRound}
                                    disabled={isSimulating}
                                    className="h-full px-4 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl border border-white/5 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Next
                                </button>

                                {isSimulating && (
                                    <div className="hidden sm:flex flex-1 h-full bg-slate-950 rounded-xl border border-white/5 overflow-hidden flex-col justify-center px-4">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter mb-1">
                                            <span className="text-red-500 animate-pulse">LIVE</span>
                                            <span className="text-white">{Math.round((simulationProgress / 60) * 100)}%</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-600 transition-all duration-1000"
                                                style={{ width: `${(simulationProgress / 60) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Center Section: The Betslip Tab (Sporty Style) */}
                            <button
                                onClick={() => setShowSlip(!showSlip)}
                                className={cn(
                                    "flex-1 max-w-[140px] h-full relative flex flex-col items-center justify-center transition-all duration-300 active:scale-95",
                                    selections.length > 0
                                        ? "bg-red-600 text-white shadow-[0_-4px_15px_rgba(220,38,38,0.3)] rounded-t-xl translate-y-[-4px]"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <Zap className={cn("h-5 w-5 mb-1", selections.length > 0 ? "fill-white" : "fill-current animate-pulse")} />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">Betslip</span>

                                {selections.length > 0 && (
                                    <div className="absolute top-1 right-3 w-6 h-6 bg-white text-red-600 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg animate-in zoom-in duration-300">
                                        {selections.length}
                                    </div>
                                )}

                                {pendingSlips.length > 0 && selections.length === 0 && (
                                    <div className="absolute top-1 right-3 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#121212] shadow-lg">
                                        {pendingSlips.length}
                                    </div>
                                )}
                            </button>

                            {/* Right Section: Kickoff Action */}
                            <div className="flex-1 flex items-center justify-end gap-2">
                                <button
                                    onClick={kickoff}
                                    disabled={isSimulating || pendingSlips.length === 0}
                                    className={cn(
                                        "h-full px-6 font-black uppercase text-[11px] tracking-[0.2em] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2",
                                        isSimulating ? "bg-slate-800 text-slate-500" :
                                            pendingSlips.length === 0 ? "bg-slate-800 text-slate-600 cursor-not-allowed" :
                                                "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                    )}
                                >
                                    {isSimulating ? "LIVE" : "KICKOFF"}
                                    {!isSimulating && pendingSlips.length > 0 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Fullscreen Modal Bet Slip */}
                    {
                        showSlip && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center">
                                {/* Backdrop */}
                                <div
                                    className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                                    onClick={() => setShowSlip(false)}
                                />

                                {/* Fullscreen Modal Content */}
                                <div className="relative w-full h-full bg-slate-900 flex flex-col animate-in fade-in duration-200">
                                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                                        <div className="flex items-center gap-3">
                                            <Zap className="h-5 w-5 text-purple-400" />
                                            <h2 className="font-black text-sm uppercase tracking-[0.2em] text-white">Instant Slip</h2>
                                        </div>
                                        <button onClick={() => setShowSlip(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Selections / My Bets Tabs */}
                                    <div className="p-2 grid grid-cols-2 gap-1 bg-slate-900 border-b border-white/5">
                                        <button
                                            onClick={() => setSlipTab('selections')}
                                            className={cn(
                                                "py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-2",
                                                slipTab === 'selections' ? "bg-slate-800 text-white shadow-xl" : "text-slate-500"
                                            )}
                                        >
                                            Selections
                                            {selections.length > 0 && (
                                                <span className="w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]">
                                                    {selections.length}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setSlipTab('pending')}
                                            className={cn(
                                                "py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-2",
                                                slipTab === 'pending' ? "bg-slate-800 text-white shadow-xl" : "text-slate-500"
                                            )}
                                        >
                                            My Bets
                                            {pendingSlips.length > 0 && (
                                                <span className="w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]">
                                                    {pendingSlips.length}
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {slipTab === 'selections' ? (
                                        <>
                                            {/* Balance Selector in Slip */}
                                            <div className="flex gap-2 mb-4">
                                                <button
                                                    onClick={() => setBalanceType('cash')}
                                                    className={cn(
                                                        "flex-1 py-2 px-3 rounded-xl border flex flex-col items-center justify-center transition-all",
                                                        balanceType === 'cash' ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-800/40 border-white/5 opacity-60"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <Wallet className={cn("h-3 w-3", balanceType === 'cash' ? "text-green-500" : "text-slate-500")} />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Cash</span>
                                                    </div>
                                                    <span className={cn("text-xs font-black font-mono", balanceType === 'cash' ? "text-white" : "text-slate-500")}>
                                                        {(profile?.balance || 0).toFixed(2)}
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => setBalanceType('gift')}
                                                    className={cn(
                                                        "flex-1 py-2 px-3 rounded-xl border flex flex-col items-center justify-center transition-all",
                                                        balanceType === 'gift' ? "bg-purple-500/10 border-purple-500/40" : "bg-slate-800/40 border-white/5 opacity-60"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <Zap className={cn("h-3 w-3", balanceType === 'gift' ? "text-purple-400" : "text-slate-500")} />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Gift</span>
                                                    </div>
                                                    <span className={cn("text-xs font-black font-mono", balanceType === 'gift' ? "text-purple-300" : "text-slate-500")}>
                                                        {(profile?.bonusBalance || 0).toFixed(2)}
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Singles/Multi/System Toggle */}
                                            <div className="flex bg-slate-900 rounded-lg p-1 border border-white/5 mb-4 max-w-[200px] shadow-inner">
                                                {(['single', 'multi'] as const).map((mode) => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setBetMode(mode)}
                                                        className={cn(
                                                            "flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all",
                                                            betMode === mode
                                                                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                                                : "text-slate-500 hover:text-slate-300"
                                                        )}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Selections List - Ultra Compact */}
                                            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                                                {selections.map((sel) => (
                                                    <div
                                                        key={sel.selectionId}
                                                        onClick={() => {
                                                            if (isSimulating) return;
                                                            const match = matches.find(m => m.id === sel.matchId);
                                                            if (match) {
                                                                setSelectedMatchForDetails(match);
                                                                setShowSlip(false);
                                                            }
                                                        }}
                                                        className="bg-slate-800/40 rounded border border-slate-700/40 relative group hover:border-purple-500/30 transition-all py-2 px-3 cursor-pointer active:scale-[0.98]"
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSelection(sel);
                                                            }}
                                                            className="absolute top-1 left-1 text-slate-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>

                                                        {/* Compact single row layout */}
                                                        <div className="flex items-center justify-between gap-3 pl-5">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-[9px] font-bold text-white leading-tight truncate">
                                                                    {sel.label.replace(/^O /, 'Over ').replace(/^U /, 'Under ')}
                                                                </div>
                                                                <div className="text-[8px] text-slate-400 leading-tight truncate mt-0.5">
                                                                    {sel.matchLabel.split(' vs ').map(name => getSchoolAcronym(name, [sel.schoolA, sel.schoolB])).join(' vs ')}
                                                                </div>
                                                                <div className="text-[7px] text-slate-500 uppercase tracking-wide mt-0.5">
                                                                    {sel.marketName}
                                                                </div>
                                                                {/* Individual Leg Stake (Singles Mode Overlay) */}
                                                                {betMode === 'single' && (
                                                                    <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between">
                                                                        <span className="text-[7px] font-black text-slate-500 uppercase italic">MAX {sel.marketName === "Match Winner" ? STAKE_LIMITS.MATCH_WINNER : STAKE_LIMITS.PROPS}</span>
                                                                        <div className="flex items-center gap-1 bg-black/40 rounded p-1 border border-white/10">
                                                                            <span className="text-[7px] text-slate-500 font-bold">GHS</span>
                                                                            <input
                                                                                type="number"
                                                                                value={sel.stakeUsed || ""}
                                                                                onChange={(e) => {
                                                                                    const val = parseFloat(e.target.value);
                                                                                    const limit = sel.marketName === "Match Winner" ? STAKE_LIMITS.MATCH_WINNER : STAKE_LIMITS.PROPS;
                                                                                    const cappedVal = isNaN(val) ? 0 : Math.min(val, limit);

                                                                                    setSelections(prev => prev.map(s =>
                                                                                        s.selectionId === sel.selectionId ? { ...s, stakeUsed: cappedVal } : s
                                                                                    ));
                                                                                }}
                                                                                className="w-10 bg-transparent text-right focus:outline-none text-white font-mono text-[9px]"
                                                                                placeholder="0.00"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <div className="text-sm font-black text-accent font-mono">{sel.odds.toFixed(2)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="p-3 border-t border-white/10 bg-slate-900 space-y-2">
                                                {/* Alerts at bottom for visibility */}
                                                {hasConflicts && (
                                                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                                        <ShieldAlert className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                                        <p className="text-[7px] font-bold text-red-400 leading-tight">Multiple markets from same match = Singles only</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-400">
                                                    <div className="flex flex-col">
                                                        <span>Total Stake</span>
                                                        <span className="text-[7px] text-slate-500 lowercase leading-none mt-0.5">limit {STAKE_LIMITS.TOTAL_SLIP}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-black/40 rounded p-1.5 border border-white/10">
                                                        <span className="text-[8px] text-slate-500 font-bold">GHS</span>
                                                        <input
                                                            type="number"
                                                            value={globalStake || ""}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (val > STAKE_LIMITS.TOTAL_SLIP) {
                                                                    setGlobalStake(STAKE_LIMITS.TOTAL_SLIP);
                                                                } else {
                                                                    setGlobalStake(isNaN(val) ? 0 : val);
                                                                }
                                                            }}
                                                            className="w-12 bg-transparent text-right focus:outline-none text-white font-mono text-[9px]"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-400">
                                                    <span>Total Odds</span>
                                                    <div className="text-white font-mono text-sm">
                                                        {calculateTotalOdds(selections).toFixed(2)}
                                                    </div>
                                                </div>

                                                {(() => {
                                                    const baseWin = (betMode === 'single'
                                                        ? selections.reduce((acc, s) => acc + ((s.stakeUsed || globalStake) * s.odds), 0)
                                                        : calculateTotalOdds(selections) * globalStake
                                                    );
                                                    const count = selections.length;

                                                    if (betMode !== 'multi' || count < MULTI_BONUS.MIN_SELECTIONS) return null;

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

                                                    const bonusAmount = baseWin * (bonusPct / 100);
                                                    const cappedBonus = Math.min(bonusAmount, MULTI_BONUS.MAX_BONUS_AMOUNT_CAP);

                                                    if (cappedBonus <= 0) return null;

                                                    return (
                                                        <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-400">
                                                            <span className="flex items-center gap-1.5 text-purple-400">
                                                                <Trophy className="h-3 w-3" />
                                                                Max Bonus ({bonusPct}%)
                                                            </span>
                                                            <div className="text-purple-400 font-mono text-sm">
                                                                + GHS {cappedBonus.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-400">
                                                    <span>Potential Return</span>
                                                    <div className="text-green-400 font-mono text-right flex flex-col items-end">
                                                        <span className="text-sm">
                                                            GHS {(() => {
                                                                const totalStake = betMode === 'single'
                                                                    ? selections.reduce((acc, s) => acc + (s.stakeUsed || globalStake), 0)
                                                                    : globalStake;
                                                                const baseWin = betMode === 'single'
                                                                    ? selections.reduce((acc, s) => acc + ((s.stakeUsed || globalStake) * s.odds), 0)
                                                                    : calculateTotalOdds(selections) * globalStake;

                                                                // Calculate Bonus (Sporty Style)
                                                                let bonusAmount = 0;
                                                                if (betMode === 'multi' && selections.length >= MULTI_BONUS.MIN_SELECTIONS) {
                                                                    let bonusPct = 0;
                                                                    Object.entries(MULTI_BONUS.SCALING)
                                                                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                                                                        .some(([threshold, percent]) => {
                                                                            if (selections.length >= Number(threshold)) {
                                                                                bonusPct = Number(percent);
                                                                                return true;
                                                                            }
                                                                            return false;
                                                                        });
                                                                    bonusAmount = Math.min(baseWin * (bonusPct / 100), MULTI_BONUS.MAX_BONUS_AMOUNT_CAP);
                                                                }

                                                                const totalPotential = baseWin + bonusAmount;

                                                                // GIFT RULE: Deduct stake from winnings
                                                                const payoutDisplay = (balanceType === 'gift' ? Math.max(0, totalPotential - totalStake) : totalPotential).toFixed(2);
                                                                return payoutDisplay;
                                                            })()}
                                                        </span>
                                                        {balanceType === 'gift' ? (
                                                            <span className="text-[7px] text-purple-400 font-bold uppercase tracking-tighter">Profit only credited (Stake deducted)</span>
                                                        ) : (
                                                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter">Total Payout (Stake + Profit)</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={addToSlip}
                                                    disabled={globalStake <= 0 && selections.every(s => !s.stakeUsed || s.stakeUsed <= 0)}
                                                    className={cn(
                                                        "w-full py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] shadow-lg transition-all active:scale-95",
                                                        (globalStake > 0 || selections.some(s => s.stakeUsed && s.stakeUsed > 0))
                                                            ? "bg-red-600 hover:bg-red-500 text-white"
                                                            : "bg-slate-700 text-slate-500 cursor-not-allowed"
                                                    )}
                                                >
                                                    Place Bet
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col h-full bg-slate-900">
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                {pendingSlips.map((slip) => (
                                                    <div key={slip.id} className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-right-4 duration-300">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                                                                    <Ticket className="h-4 w-4 text-red-500" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{slip.time}</span>
                                                                    <span className="text-[10px] font-black text-white">{slip.selections.length} Legs • {slip.mode}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="text-xs font-black text-accent">GHS {slip.totalStake.toFixed(2)}</div>
                                                                {slip.cashedOut && (
                                                                    <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[7px] font-black uppercase rounded border border-green-500/20 animate-pulse">
                                                                        Cashed Out
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {slip.cashedOut ? (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[8px] font-black uppercase rounded border border-green-500/20 animate-pulse whitespace-nowrap">
                                                                    Cashed Out
                                                                </span>
                                                                <span className="text-[7px] text-slate-500 font-bold">Ref: {slip.totalStake.toFixed(2)}</span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setConfirmCashoutSlipId(slip.id)}
                                                                disabled={isSimulating}
                                                                className={cn(
                                                                    "flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 text-slate-500 hover:text-white bg-white/5",
                                                                    isSimulating ? "opacity-30 cursor-not-allowed" : "hover:bg-red-500/20 hover:text-red-400"
                                                                )}
                                                            >
                                                                <Banknote className="h-4 w-4" />
                                                                <span className="text-[7px] font-black uppercase">Cashout</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {pendingSlips.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center h-full opacity-30 py-20 text-center">
                                                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                                                            <Ticket className="h-8 w-8" />
                                                        </div>
                                                        <p className="text-xs font-bold uppercase tracking-widest leading-loose">No active bets.<br />Add selections to get started!</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 border-t border-white/10 bg-slate-900 flex gap-3">
                                                <button
                                                    onClick={() => setSlipTab('selections')}
                                                    className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-wider text-[10px] transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Add More
                                                </button>
                                                <button
                                                    onClick={kickoff}
                                                    disabled={isSimulating || pendingSlips.length === 0}
                                                    className={cn(
                                                        "flex-[2] py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2",
                                                        isSimulating ? "bg-slate-800 text-slate-500" :
                                                            pendingSlips.length === 0 ? "bg-slate-800 text-slate-600 cursor-not-allowed" :
                                                                "bg-red-600 text-white shadow-red-600/30"
                                                    )}
                                                >
                                                    {isSimulating ? "LIVE" : "KICKOFF"}
                                                </button>
                                            </div>

                                            {/* Confirmation Modal Overlay */}
                                            {confirmCashoutSlipId && (
                                                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                                                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xs shadow-2xl flex flex-col items-center text-center space-y-4">
                                                        <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 mb-2">
                                                            <Banknote className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-white font-black uppercase tracking-wider text-sm mb-1">Confirm Cashout</h3>
                                                            <p className="text-slate-400 text-xs">
                                                                Refund <span className="text-white font-bold">GHS {pendingSlips.find(s => s.id === confirmCashoutSlipId)?.totalStake.toFixed(2)}</span>?
                                                                <br />This will cancel the bet.
                                                            </p>
                                                        </div>
                                                        <div className="flex w-full gap-2">
                                                            <button
                                                                onClick={() => setConfirmCashoutSlipId(null)}
                                                                className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold uppercase tracking-wider"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={handleConfirmCashout}
                                                                className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/20"
                                                            >
                                                                Confirm
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }
                </main >
            </div >

            {/* Modal for Results - SportyBet Style */}
            {
                showResultsModal && lastOutcome && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
                        <div className="relative bg-[#1a1b1e] w-full max-w-lg h-full md:h-[90vh] md:rounded-b-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300">

                            {/* Sticky Red Header */}
                            <div className="bg-red-600 px-4 py-3 flex items-center justify-between text-white shadow-md z-10">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => { setShowResultsModal(false); nextRound(); }} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                                        <ArrowLeft className="h-6 w-6" />
                                    </button>
                                    <h2 className="text-lg font-bold tracking-tight">Ticket Details</h2>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="p-1 hover:bg-black/10 rounded-full transition-colors">
                                        <Info className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => { setShowResultsModal(false); nextRound(); }} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                                        <Home className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto bg-slate-900 custom-scrollbar">
                                {/* Ticket Summary */}
                                <div className="p-4 border-b border-white/5 bg-slate-900/50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ticket ID: 801{lastOutcome?.roundId}</span>
                                            <h3 className="text-lg font-black text-white">{betMode === 'multi' ? 'Multiple' : 'Single'}</h3>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Return</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 font-bold block mb-1">23/10 09:15</span>
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-md text-[10px] font-black uppercase inline-block",
                                                (lastOutcome?.resolvedSlips || []).every((s: ResolvedSlip) => s.status === 'WON') ? "bg-green-500/20 text-green-400" :
                                                    (lastOutcome?.resolvedSlips || []).some((s: ResolvedSlip) => s.status === 'WON') ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-500"
                                            )}>
                                                {(lastOutcome?.resolvedSlips || []).every((s: ResolvedSlip) => s.status === 'WON') ? 'Won' :
                                                    (lastOutcome?.resolvedSlips || []).some((s: ResolvedSlip) => s.status === 'WON') ? 'Partial' : 'Lost'}
                                            </div>
                                            <div className="text-2xl font-black text-white mt-1">
                                                {(() => {
                                                    const totalReturn = (lastOutcome?.resolvedSlips || []).reduce((acc: number, s: ResolvedSlip) => acc + (s.totalReturns ?? 0), 0);
                                                    return totalReturn.toFixed(2);
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Stake</div>
                                            <div className="text-sm font-black text-white">
                                                {(lastOutcome?.results || []).reduce((acc: number, r) => acc + (r.stakeUsed ?? 0), 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Odds</div>
                                            <div className="text-sm font-black text-white">
                                                {calculateTotalOdds(lastOutcome?.results || []).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Selection Rows */}
                                <div className="divide-y divide-white/5">
                                    {(lastOutcome?.results || []).map((r, idx: number) => (
                                        <div key={idx} className="p-4 flex gap-4 transition-colors hover:bg-white/[0.02]">
                                            {/* Status Icon */}
                                            <div className="mt-1 flex-shrink-0">
                                                {r.won ? (
                                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-[10px] font-bold">✓</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                        <X className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selection Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] text-slate-500 font-bold mb-1">23/10 16:45</div>
                                                <div className="text-sm font-bold text-white mb-2 truncate">
                                                    {[r.schoolA, r.schoolB].map((s: string) => getSchoolAcronym(s, [r.schoolA, r.schoolB])).join(' vs ')}
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-bold text-slate-400">FT Score:</span>
                                                    <span className="text-[10px] font-black text-white">
                                                        {r.outcome.totalScores[0]} : {r.outcome.totalScores[1]}
                                                    </span>
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded flex-shrink-0">
                                                        <Zap className="h-2.5 w-2.5 text-green-500 fill-current" />
                                                        <span className="text-[8px] font-bold text-green-500 uppercase">Tracker</span>
                                                    </div>
                                                </div>

                                                {/* Details Box */}
                                                <div className="bg-slate-950/50 rounded-lg p-3 space-y-2 border border-white/5 relative group overflow-hidden">
                                                    {r.won && (
                                                        <div className="absolute right-2 bottom-2 text-green-500/10 opacity-40 group-hover:opacity-60 transition-opacity">
                                                            <Trophy className="h-8 w-8" />
                                                        </div>
                                                    )}

                                                    <div className="flex gap-3 text-[10px]">
                                                        <span className="w-14 text-slate-500 font-bold flex-shrink-0">Pick:</span>
                                                        <div className="flex items-center gap-1.5 font-black text-white">
                                                            <span>{r.label.replace(/^O /, 'Over ').replace(/^U /, 'Under ')} @ {r.odds.toFixed(2)}</span>
                                                            {r.won && <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-[8px]">✓</div>}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 text-[10px]">
                                                        <span className="w-14 text-slate-500 font-bold flex-shrink-0">Market:</span>
                                                        <span className="font-bold text-slate-300">{r.marketName}</span>
                                                    </div>

                                                    <div className="flex gap-3 text-[10px]">
                                                        <span className="w-14 text-slate-500 font-bold flex-shrink-0">Outcome:</span>
                                                        <span className="font-bold text-slate-300">
                                                            {(() => {
                                                                const market = r.marketName;
                                                                const outcome = r.outcome;
                                                                if (market === "Match Winner") return getSchoolAcronym(outcome.schools[outcome.winnerIndex], outcome.schools);
                                                                if (market === "Total Points") return `Total ${outcome.totalScores.reduce((a: number, b: number) => a + b, 0)} pts`;
                                                                if (market === "Winning Margin") {
                                                                    const sorted = [...outcome.totalScores].sort((a: number, b: number) => b - a);
                                                                    const margin = sorted[0] - sorted[1];
                                                                    if (margin >= 1 && margin <= 10) return "1-10";
                                                                    if (margin >= 11 && margin <= 25) return "11-25";
                                                                    return "26+";
                                                                }
                                                                if (market === "Highest Round" || market === "Highest Scoring Round") {
                                                                    // Calculate winning phase
                                                                    if (!outcome.rounds || outcome.rounds.length < 5) return "Pending";
                                                                    const rScore = (rIdx: number) => outcome.rounds[rIdx].scores.reduce((a: number, b: number) => a + b, 0);
                                                                    const p1 = rScore(0);
                                                                    const p2 = rScore(1) + rScore(2);
                                                                    const p3 = rScore(3) + rScore(4);

                                                                    const max = Math.max(p1, p2, p3);
                                                                    if (p1 === max) return "Round 1";
                                                                    if (p2 === max) return "Rounds 2 & 3";
                                                                    if (p3 === max) return "Rounds 4 & 5";
                                                                    return "Round 1";
                                                                }
                                                                if (market === "Perfect Round") return outcome.stats.perfectRound.some((p: boolean) => p) ? "Yes" : "No";
                                                                if (market === "Shutout Round") return outcome.stats.shutoutRound.some((s: boolean) => s) ? "Yes" : "No";
                                                                if (market === "Comeback Win") {
                                                                    return (outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0) ? "Yes" : "No";
                                                                }
                                                                if (market === "Comeback Team") {
                                                                    const isComeback = outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0;
                                                                    return isComeback ? outcome.schools[outcome.winnerIndex] : "None";
                                                                }
                                                                if (market === "First Bonus") return outcome.schools[outcome.stats.firstBonusIndex];
                                                                if (market === "Late Surge") return outcome.schools[outcome.stats.lateSurgeIndex];
                                                                if (market === "Lead Changes") return `${outcome.stats.leadChanges} Changes`;
                                                                if (market.includes("Winner")) {
                                                                    const roundNum = parseInt(market.split(" ")[1]);
                                                                    const roundIndex = roundNum - 1;
                                                                    const scores = outcome.rounds[roundIndex].scores;
                                                                    const max = Math.max(...scores);
                                                                    const winnerIdx = scores.indexOf(max);
                                                                    return outcome.schools[winnerIdx];
                                                                }
                                                                return "Settled";
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fixed Footer Action */}
                            <div className="p-4 bg-slate-900 border-t border-white/5">
                                <button
                                    onClick={() => { setShowResultsModal(false); nextRound(); }}
                                    className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-wider text-sm shadow-xl shadow-red-600/20 transition-all active:scale-95"
                                >
                                    Continue to Next Round
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* History Modal */}
            {
                showHistoryModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowHistoryModal(false)} />
                        <div className="relative bg-slate-900 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl border border-white/10 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black uppercase tracking-widest">Bet History</h2>
                                <button onClick={() => setShowHistoryModal(false)} className="p-2 bg-white/5 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="space-y-8">
                                {betHistory.map((h, i) => {
                                    const date = new Date();
                                    const day = date.getDate().toString().padStart(2, '0');
                                    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                                    const isWon = (h.totalReturns ?? 0) > 0;
                                    // Derive a stable Ticket ID from the slip ID

                                    return (
                                        <div
                                            key={i}
                                            className="flex gap-6 cursor-pointer group/item hover:bg-white/[0.02] p-2 -mx-2 rounded-2xl transition-all"
                                            onClick={() => setViewedHistoryTicket(h)}
                                        >
                                            <div className="flex flex-col items-center pt-2 min-w-[40px]">
                                                <span className="text-2xl font-black text-slate-500 leading-none group-hover/item:text-accent transition-colors">{day}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">{month}</span>
                                            </div>

                                            <div className="flex-1 bg-slate-800/20 rounded-xl overflow-hidden border border-white/5 shadow-xl">
                                                <div className={cn(
                                                    "p-2.5 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em]",
                                                    isWon ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300"
                                                )}>
                                                    <span className="flex items-center gap-2">
                                                        {h.mode || 'Single'}
                                                        {isWon && <Trophy className="h-3 w-3 fill-white" />}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {isWon ? "Won" : "Lost"}
                                                        <ChevronRight className="h-3 w-3 opacity-50" />
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-3 bg-slate-900/40">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Total Return</span>
                                                        <span className={cn("font-black font-mono text-sm", isWon ? "text-green-400" : "text-slate-300")}>
                                                            {(h.totalReturns ?? 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Total Stake</span>
                                                        <span className="font-black font-mono text-xs text-white">
                                                            {(h.totalStake ?? 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex justify-between items-center">
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">QuickGame</span>
                                                    <span className="text-[8px] font-bold text-slate-500">Ticket ID: {h.id.includes('-') ? h.id.split('-')[1].slice(-6) : h.id.slice(-6)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {betHistory.length === 0 && (
                                    <div className="text-center py-20">
                                        <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                            <Ticket className="h-6 w-6 text-slate-600" />
                                        </div>
                                        <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">No transaction history yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Ticket Details View Modal (From History) */}
            {
                viewedHistoryTicket && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setViewedHistoryTicket(null)} />
                        <div className="relative bg-[#1a1b1e] w-full max-w-lg h-full md:h-[90vh] md:rounded-b-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-white/10">

                            <div className="bg-red-600 px-4 py-3 flex items-center justify-between text-white shadow-md z-10">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setViewedHistoryTicket(null)} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                                        <ArrowLeft className="h-6 w-6" />
                                    </button>
                                    <h2 className="text-lg font-bold tracking-tight">Ticket Details</h2>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="p-1 hover:bg-black/10 rounded-full transition-colors" onClick={() => setViewedHistoryTicket(null)}>
                                        <Home className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-900 custom-scrollbar">
                                <div className="p-4 border-b border-white/5 bg-slate-900/50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ticket ID: 801{viewedHistoryTicket.id?.toString().slice(-4) || 'XXXX'}</span>
                                            <h3 className="text-lg font-black text-white">{viewedHistoryTicket.mode === 'multi' ? 'Multiple' : 'Single'}</h3>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Return</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Ticket Settled</span>
                                            <span className={cn(
                                                "font-black",
                                                (viewedHistoryTicket.totalReturns ?? 0) > viewedHistoryTicket.totalStake ? "text-emerald-500" :
                                                    (viewedHistoryTicket.totalReturns ?? 0) > 0 ? "text-yellow-500" : "text-white/20"
                                            )}>
                                                {(viewedHistoryTicket.totalReturns ?? 0) > 0 ? `+ GHS ${(viewedHistoryTicket.totalReturns ?? 0).toFixed(2)} ` : 'GHS 0.00'}
                                            </span>
                                            <div className="text-2xl font-black text-white mt-1">
                                                {(viewedHistoryTicket.totalReturns ?? 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Stake</div>
                                            <div className="text-sm font-black text-white">
                                                {viewedHistoryTicket.totalStake.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</div>
                                            <div className="text-sm font-black text-white uppercase tracking-widest">{viewedHistoryTicket.status}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {(viewedHistoryTicket.results || []).map((r: ResolvedSelection, idx: number) => (
                                        <div key={idx} className="p-4 flex gap-4 transition-colors hover:bg-white/[0.02]">
                                            <div className="mt-1 flex-shrink-0">
                                                {r.won ? (
                                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-[10px] font-bold">✓</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                        <X className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] text-slate-500 font-bold mb-1">Match Detail</div>
                                                <div className="text-sm font-bold text-white mb-2 truncate">
                                                    {[r.schoolA, r.schoolB].map((s: string) => getSchoolAcronym(s, [r.schoolA, r.schoolB])).join(' vs ')}
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-bold text-slate-400">FT Score:</span>
                                                    <span className="text-[10px] font-black text-white">
                                                        {r.outcome ? (
                                                            `${r.outcome.totalScores[0]} : ${r.outcome.totalScores[1]} `
                                                        ) : (
                                                            <span className="text-green-400">Cashed Out</span>
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="bg-slate-950/50 rounded-lg p-3 space-y-2 border border-white/5 relative group overflow-hidden">
                                                    <div className="flex gap-3 text-[10px]">
                                                        <span className="w-14 text-slate-500 font-bold flex-shrink-0">Pick:</span>
                                                        <div className="flex items-center gap-1.5 font-black text-white">
                                                            <span>{r.label.replace(/^O /, 'Over ').replace(/^U /, 'Under ')} @ {r.odds.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 text-[10px]">
                                                        <span className="w-14 text-slate-500 font-bold flex-shrink-0">Market:</span>
                                                        <span className="font-bold text-slate-300">{r.marketName}</span>
                                                    </div>
                                                    <div className="flex gap-3 text-[10px]">
                                                        <span className="w-14 text-slate-500 font-bold flex-shrink-0">Outcome:</span>
                                                        <span className="font-bold text-slate-300">
                                                            {(() => {
                                                                const market = r.marketName;
                                                                const outcome = r.outcome;
                                                                if (!outcome) return "Cashed Out"; // Safety guard

                                                                if (market === "Match Winner") return getSchoolAcronym(outcome.schools[outcome.winnerIndex], outcome.schools);
                                                                if (market === "Total Points") return `Total ${outcome.totalScores.reduce((a: number, b: number) => a + b, 0)} pts`;
                                                                if (market === "Winning Margin") {
                                                                    const sorted = [...outcome.totalScores].sort((a: number, b: number) => b - a);
                                                                    const margin = sorted[0] - sorted[1];
                                                                    if (margin >= 1 && margin <= 10) return "1-10";
                                                                    if (margin >= 11 && margin <= 25) return "11-25";
                                                                    return "26+";
                                                                }
                                                                if (market === "Highest Round" || market === "Highest Scoring Round") {
                                                                    // Calculate winning phase
                                                                    if (!outcome.rounds || outcome.rounds.length < 5) return "Pending";
                                                                    const rScore = (rIdx: number) => outcome.rounds[rIdx].scores.reduce((a: number, b: number) => a + b, 0);
                                                                    const p1 = rScore(0);
                                                                    const p2 = rScore(1) + rScore(2);
                                                                    const p3 = rScore(3) + rScore(4);

                                                                    const max = Math.max(p1, p2, p3);
                                                                    if (p1 === max) return "Round 1";
                                                                    if (p2 === max) return "Rounds 2 & 3";
                                                                    if (p3 === max) return "Rounds 4 & 5";
                                                                    return "Round 1"; // Fallback
                                                                }
                                                                if (market === "Perfect Round") return outcome.stats.perfectRound.some((p: boolean) => p) ? "Yes" : "No";
                                                                if (market.startsWith("Perfect Round ")) {
                                                                    const roundNum = parseInt(market.split(" ")[2]);
                                                                    if (!isNaN(roundNum)) {
                                                                        return outcome.stats.perfectRound[roundNum - 1] ? "Yes" : "No";
                                                                    }
                                                                }
                                                                if (market === "Shutout Round") return outcome.stats.shutoutRound.some((s: boolean) => s) ? "Yes" : "No";
                                                                if (market === "Comeback Win") {
                                                                    return (outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0) ? "Yes" : "No";
                                                                }
                                                                if (market === "Comeback Team") {
                                                                    const isComeback = outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0;
                                                                    return isComeback ? outcome.schools[outcome.winnerIndex] : "None";
                                                                }
                                                                if (market === "First Bonus") return outcome.schools[outcome.stats.firstBonusIndex];
                                                                if (market === "Late Surge") return outcome.schools[outcome.stats.lateSurgeIndex];
                                                                if (market === "Lead Changes") return `${outcome.stats.leadChanges} Changes`;
                                                                if (market.includes("Winner")) {
                                                                    const roundNum = parseInt(market.split(" ")[1]);
                                                                    const roundIndex = roundNum - 1;
                                                                    const scores = outcome.rounds[roundIndex].scores;
                                                                    const max = Math.max(...scores);
                                                                    const winnerIdx = scores.indexOf(max);
                                                                    if (winnerIdx !== -1) return outcome.schools[winnerIdx];
                                                                    return "Draw";
                                                                }
                                                                return "Settled";
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900 border-t border-white/5">
                                <button
                                    onClick={() => setViewedHistoryTicket(null)}
                                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all active:scale-95"
                                >
                                    Back to History
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Match Details Modal */}
            {
                selectedMatchForDetails && (
                    <MatchDetailsModal
                        match={selectedMatchForDetails}
                        onClose={() => setSelectedMatchForDetails(null)}
                        onOddsClick={toggleSelection}
                        checkSelected={(sid) => selections.some(s => s.selectionId === sid)}
                        checkIsCorrelated={checkIsCorrelated}
                    />
                )
            }

            {/* Live Match Progress View - REMOVED (Moved to Top) */}
        </div >
    )
}

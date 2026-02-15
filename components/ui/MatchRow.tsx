"use client"

import { useState, useEffect, useMemo } from "react"
import { Zap, ChevronDown, Lock, ChevronRight, Calendar } from "lucide-react"
import { OddsButton } from "./OddsButton"
import { normalizeMarketName, cn } from "@/lib/utils"
import { Match } from "@/lib/types"
import { Selection } from "@/lib/store/useBetSlip"
import { getMatchLockStatus } from "@/lib/match-utils"



interface MatchRowProps {
    match: Match
    activeMarket:
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
    isSimulating?: boolean
    isFinished?: boolean
    currentScores?: [number, number, number]
    currentRoundIdx?: number
    onOddsClick: (selection: Selection) => void
    checkSelected: (selectionId: string) => boolean
    checkIsCorrelated?: (matchId: string, marketName: string) => boolean
    onMoreClick?: (match: Match) => void
}

export function MatchRow({
    match,
    activeMarket,
    onOddsClick,
    checkSelected,
    checkIsCorrelated,
    onMoreClick,
    isSimulating,
    isFinished,
    currentScores,
    currentRoundIdx
}: MatchRowProps) {
    const participants = match.participants || []
    const matchLabel = participants.map(p => p.name).join(' vs ')

    // NEW: Calculate lock status
    const lockStatus = getMatchLockStatus(match)
    const isLocked = lockStatus.isLocked

    // Internal resolution of live state for Global Engine matches
    const internalIsLive = match.status === 'live' || isSimulating
    const internalIsFinished = match.status === 'finished' || isFinished
    const internalScores = currentScores || (match.result as any)?.totalScores
    const internalRoundIdx = currentRoundIdx ?? match.currentRound

    // AI Win Probabilities Calculation
    const winProbabilities = useMemo(() => {
        const parts = match.participants || [];
        if (!parts.length) return [];

        let probs: number[] = [];

        if (internalIsLive && internalScores) {
            // Live weighted logic: (Current Score / (Current Round + 1)) * Remaining Rounds factor
            const currentTotal = internalScores.reduce((a: number, b: number) => a + b, 0) || 1;
            probs = internalScores.map((s: number) => (s / currentTotal) * 100);
        } else {
            // Pre-match logic: Use odds (1/odd) normalized to 100
            const inverseOdds = parts.map(p => 1 / (p.odd || match.odds?.[p.schoolId] || 2));
            const totalInverse = inverseOdds.reduce((a, b) => a + b, 0);
            probs = inverseOdds.map(io => (io / totalInverse) * 100);
        }

        return probs.map(p => Math.round(p));
    }, [match.participants, internalIsLive, internalScores, match.odds]);

    // State for selectors
    const [selectedTotalLine, setSelectedTotalLine] = useState<string>("")
    const [selectedRound, setSelectedRound] = useState<string>("Round 1")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    // Initialize default line for total points
    useEffect(() => {
        if (activeMarket === 'total_points' && match.extendedOdds?.totalPoints && !selectedTotalLine) {
            // Find the middle line or first available
            const lines = Object.keys(match.extendedOdds.totalPoints)
                .map(k => k.split(" ")[1])
                .filter((v, i, a) => a.indexOf(v) === i)
                .sort((a, b) => parseFloat(a) - parseFloat(b));

            if (lines.length > 0) {
                setSelectedTotalLine(lines[Math.floor(lines.length / 2)]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMarket, match.extendedOdds?.totalPoints]);


    const renderSchoolOdds = (marketKey: string, marketLabel: string) => (
        <>
            {participants.map((p, idx) => (
                <div key={p.schoolId} className="w-16 sm:w-20 md:w-24 flex items-center justify-center">
                    <OddsButton
                        label={(idx + 1).toString()}
                        odds={match.extendedOdds?.[marketKey]?.[p.name] ?? null}
                        matchId={match.id}
                        marketName={marketLabel}
                        matchLabel={matchLabel}
                        showLabel={true}
                        onClick={onOddsClick}
                        isSelected={checkSelected(`${match.id}-${marketLabel}-${idx + 1}`)}
                        isCorrelated={checkIsCorrelated?.(match.id, marketLabel)}
                        sportType={match.sportType}
                        className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                    />
                </div>
            ))}
        </>
    );

    return (
        <div
            onClick={() => onMoreClick?.(match)}
            className="flex items-center border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group cursor-pointer"
        >
            {/* Left side: Teams & Info */}
            <div className="flex-1 py-1.5 px-3 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    {internalIsLive ? (
                        <div className="flex items-center gap-1.5 bg-red-600/20 px-1.5 py-0.5 rounded text-[7px] font-black text-red-400 animate-pulse border border-red-500/20">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            LIVE • R{internalRoundIdx !== undefined ? internalRoundIdx + 1 : '?'}
                        </div>
                    ) : (
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                            {match.isVirtual
                                ? `VIRTUAL • ${match.stage}`
                                : match.tournamentName
                                    ? `${match.tournamentName} • ${match.stage}`
                                    : match.stage
                            }
                        </span>
                    )}
                    {match.isVirtual && !internalIsLive && (
                        <Zap className="h-2 w-2 text-purple-400" />
                    )}
                </div>
                <div className="flex flex-col gap-0.5">
                    {participants.map((p, idx) => (
                        <div key={p.schoolId} className="flex items-center justify-between group-hover:translate-x-0.5 transition-transform" style={{ transitionDelay: `${idx * 50}ms` }}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-[9px] sm:text-[10px] font-bold text-white truncate uppercase tracking-tighter">{p.name}</span>
                                {(!internalIsFinished && winProbabilities[idx] !== undefined) && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all duration-1000"
                                                style={{ width: `${winProbabilities[idx]}%` }}
                                            />
                                        </div>
                                        <span className="text-[7px] font-black text-purple-400 opacity-80">{winProbabilities[idx]}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Lock Indicator for Start Time */}
                {lockStatus.timeUntilLock !== undefined && lockStatus.timeUntilLock < 30 && !isLocked && (
                    <div className="mt-1 px-1 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[7px] font-bold text-orange-400 inline-flex items-center gap-1">
                        <Lock className="h-1.5 w-1.5" />
                        LOCKING IN {Math.floor(lockStatus.timeUntilLock)}m
                    </div>
                )}

                {/* Start Time / TBD Info */}
                {!internalIsLive && !internalIsFinished && (
                    <div className="mt-1 flex items-center gap-2">
                        <Calendar className="h-2 w-2 text-slate-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            {match.startTime || "TBD"}
                        </span>
                    </div>
                )}
            </div>

            {/* Right side: Odds Columns OR Live Scores OR Finished Results */}
            <div className="relative flex items-stretch divide-x divide-white/5 bg-slate-950/10 min-h-[48px]">
                {(internalIsLive || internalIsFinished) ? (
                    <div className={cn(
                        "flex items-center px-4 gap-6 animate-in fade-in duration-500",
                        internalIsLive ? "bg-red-600/5" : "bg-slate-900/50"
                    )}>
                        {participants.map((p, idx) => (
                            <div key={p.schoolId} className="flex flex-col items-center justify-center min-w-[32px]">
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">
                                    {(idx + 1)}
                                </span>
                                <span className={cn(
                                    "text-sm font-black font-mono tabular-nums leading-none",
                                    internalIsLive ? "text-red-500" : "text-slate-300"
                                )}>
                                    {internalScores ? internalScores[idx] : 0}
                                </span>
                            </div>
                        ))}
                        {internalIsFinished && (
                            <div className="ml-2 pl-4 border-l border-white/5 flex flex-col items-center justify-center">
                                <div className="text-[7px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    SETTLED
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Lock Overlay */}
                        {isLocked && (
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-0.5">
                                    <Lock className="h-3 w-3 text-slate-500" />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{lockStatus.reason}</span>
                                </div>
                            </div>
                        )}
                        {activeMarket === 'winner' && (
                            <>
                                {participants.map((p, idx) => (
                                    <div key={p.schoolId} className="w-12 sm:w-14 md:w-16 flex items-center justify-center">
                                        <OddsButton
                                            label={(idx + 1).toString()}
                                            odds={p.odd || match.odds?.[p.schoolId] || null}
                                            matchId={match.id}
                                            matchLabel={matchLabel}
                                            marketName="Match Winner"
                                            showLabel={true}
                                            onClick={onOddsClick}
                                            isSelected={checkSelected(`${match.id}-Match Winner-${idx + 1}`)}
                                            isCorrelated={checkIsCorrelated?.(match.id, "Match Winner")}
                                            sportType={match.sportType}
                                            className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                                        />
                                    </div>
                                ))}
                                {(match.sportType === "football" || match.sportType === "handball") && (
                                    <div key="draw" className="w-12 sm:w-14 md:w-16 flex items-center justify-center">
                                        <OddsButton
                                            label="X"
                                            odds={match.odds?.["X"] || 3.20}
                                            matchId={match.id}
                                            matchLabel={matchLabel}
                                            marketName="Match Winner"
                                            showLabel={true}
                                            onClick={onOddsClick}
                                            isSelected={checkSelected(`${match.id}-Match Winner-X`)}
                                            isCorrelated={checkIsCorrelated?.(match.id, "Match Winner")}
                                            sportType={match.sportType}
                                            className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {activeMarket === 'total_points' && (
                            <div className="flex items-center">
                                {/* Selector */}
                                <div className="relative w-16 sm:w-20 border-r border-white/5 h-full">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full h-full flex flex-col items-center justify-center px-1 text-[9px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <span className="text-[7px] uppercase opacity-50">LINE</span>
                                        <div className="flex items-center gap-0.5" >
                                            {selectedTotalLine || "---"}
                                            <ChevronDown className="h-2 w-2 opacity-50" />
                                        </div>
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full z-50 bg-slate-900 border border-white/10 shadow-2xl max-h-48 overflow-y-auto rounded-b-md" >
                                            {
                                                Object.keys(match.extendedOdds?.totalPoints || {})
                                                    .map(k => k.split(" ")[1])
                                                    .filter((v, i, a) => a.indexOf(v) === i)
                                                    .sort((a, b) => parseFloat(a) - parseFloat(b))
                                                    .map(line => (
                                                        <button
                                                            key={line}
                                                            onClick={() => {
                                                                setSelectedTotalLine(line);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className="w-full text-left px-2 py-2 text-[10px] text-slate-300 hover:bg-white/10 hover:text-white block border-b border-white/5 last:border-0"
                                                        >
                                                            {line}
                                                        </button>
                                                    ))
                                            }
                                        </div>
                                    )}
                                </div>

                                {/* Odds for Selected Line */}
                                {selectedTotalLine ? (
                                    <>
                                        <div className="w-12 sm:w-14 flex items-center justify-center">
                                            <OddsButton
                                                label={`O`}
                                                odds={match.extendedOdds?.totalPoints?.[`Over ${selectedTotalLine}`] ?? null}
                                                matchId={match.id}
                                                marketName="Total Points"
                                                matchLabel={matchLabel}
                                                onClick={(sel) => onOddsClick({ ...sel, label: `Over ${selectedTotalLine}` })}
                                                id={`${match.id}-Total Points-Over ${selectedTotalLine}`}
                                                isSelected={checkSelected(`${match.id}-Total Points-Over ${selectedTotalLine}`)}
                                                isCorrelated={checkIsCorrelated?.(match.id, "Total Points")}
                                                sportType={match.sportType}
                                                className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                                            />
                                        </div>
                                        <div className="w-12 sm:w-14 flex items-center justify-center border-r border-white/5">
                                            <OddsButton
                                                label={`U`}
                                                odds={match.extendedOdds?.totalPoints?.[`Under ${selectedTotalLine}`] ?? null}
                                                matchId={match.id}
                                                marketName="Total Points"
                                                matchLabel={matchLabel}
                                                onClick={(sel) => onOddsClick({ ...sel, label: `Under ${selectedTotalLine}` })}
                                                id={`${match.id}-Total Points-Under ${selectedTotalLine}`}
                                                isSelected={checkSelected(`${match.id}-Total Points-Under ${selectedTotalLine}`)}
                                                isCorrelated={checkIsCorrelated?.(match.id, "Total Points")}
                                                sportType={match.sportType}
                                                className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 sm:w-14 flex items-center justify-center">
                                            <OddsButton label="O" odds={null} matchId={match.id} marketName="Total Points" matchLabel={matchLabel} className="h-full w-full border-0" />
                                        </div>
                                        <div className="w-12 sm:w-14 flex items-center justify-center border-r border-white/5" >
                                            <OddsButton label="U" odds={null} matchId={match.id} marketName="Total Points" matchLabel={matchLabel} className="h-full w-full border-0" />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeMarket === 'round_winner' && (
                            <div className="flex items-center">
                                {/* Round Selector */}
                                <div className="relative w-16 sm:w-20 border-r border-white/5 h-full">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full h-full flex flex-col items-center justify-center px-1 text-[9px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <span className="text-[7px] uppercase opacity-50">ROUND</span>
                                        <div className="flex items-center gap-0.5">
                                            {selectedRound.replace("Round ", "R")}
                                            <ChevronDown className="h-2 w-2 opacity-50" />
                                        </div>
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full z-50 bg-slate-900 border border-white/10 shadow-2xl rounded-b-md">
                                            {["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"].map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => {
                                                        setSelectedRound(r);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-2 py-2 text-[10px] text-slate-300 hover:bg-white/10 hover:text-white block border-b border-white/5 last:border-0"
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Only render odds if a round is selected */}
                                {/* Map "Round 1" -> "round1Winner" key safely */}
                                {renderSchoolOdds(selectedRound.toLowerCase().replace(" ", "") + "Winner", selectedRound + " Winner")}
                            </div>
                        )}


                        {activeMarket === 'winning_margin' && (
                            <>
                                <div className="w-12 sm:w-14 flex items-center justify-center">
                                    <OddsButton
                                        label="1-10"
                                        odds={match.extendedOdds?.winningMargin?.["1-10"] ?? 2.15}
                                        matchId={match.id}
                                        marketName="Winning Margin"
                                        matchLabel={matchLabel}
                                        onClick={onOddsClick}
                                        isSelected={checkSelected(`${match.id}-Winning Margin-1-10`)}
                                        isCorrelated={checkIsCorrelated?.(match.id, "Winning Margin")}
                                        sportType={match.sportType}
                                        className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                                    />
                                </div>
                                <div className="w-12 sm:w-14 flex items-center justify-center">
                                    <OddsButton
                                        label="11-25"
                                        odds={match.extendedOdds?.winningMargin?.["11-25"] ?? 3.50}
                                        matchId={match.id}
                                        marketName="Winning Margin"
                                        matchLabel={matchLabel}
                                        onClick={onOddsClick}
                                        isSelected={checkSelected(`${match.id}-Winning Margin-11-25`)}
                                        isCorrelated={checkIsCorrelated?.(match.id, "Winning Margin")}
                                        sportType={match.sportType}
                                        className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                                    />
                                </div>
                                <div className="w-12 sm:w-14 flex items-center justify-center">
                                    <OddsButton
                                        label="26+"
                                        odds={match.extendedOdds?.winningMargin?.["26+"] ?? 5.80}
                                        matchId={match.id}
                                        marketName="Winning Margin"
                                        matchLabel={matchLabel}
                                        onClick={onOddsClick}
                                        isSelected={checkSelected(`${match.id}-Winning Margin-26+`)}
                                        isCorrelated={checkIsCorrelated?.(match.id, "Winning Margin")}
                                        sportType={match.sportType}
                                        className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                                    />
                                </div>
                            </>
                        )}

                        {/* Generic Prop Rendering for simple Yes/No or 3-way */}
                        {[
                            'highest_scoring_round', 'perfect_round', 'shutout_round', 'comeback_win', 'lead_changes',
                        ].includes(activeMarket) && (
                                activeMarket === 'highest_scoring_round' ? (
                                    <>
                                        <div className="w-12 sm:w-14 md:w-16 flex items-center justify-center">
                                            <OddsButton label="R1" odds={match.extendedOdds?.highestScoringRound?.["Round 1"] ?? null} matchId={match.id} marketName="Highest Scoring Round" matchLabel={matchLabel} showLabel onClick={onOddsClick} isSelected={checkSelected(`${match.id}-Highest Scoring Round-Round 1`)} isCorrelated={checkIsCorrelated?.(match.id, "Highest Scoring Round")} sportType={match.sportType} className="h-full w-full bg-transparent border-0" />
                                        </div>
                                        <div className="w-12 sm:w-14 md:w-16 flex items-center justify-center">
                                            <OddsButton label="R2&3" odds={match.extendedOdds?.highestScoringRound?.["Rounds 2 & 3"] ?? null} matchId={match.id} marketName="Highest Scoring Round" matchLabel={matchLabel} showLabel onClick={onOddsClick} isSelected={checkSelected(`${match.id}-Highest Scoring Round-Rounds 2 & 3`)} isCorrelated={checkIsCorrelated?.(match.id, "Highest Scoring Round")} sportType={match.sportType} className="h-full w-full bg-transparent border-0" />
                                        </div>
                                        <div className="w-12 sm:w-14 md:w-16 flex items-center justify-center">
                                            <OddsButton label="R4&5" odds={match.extendedOdds?.highestScoringRound?.["Rounds 4 & 5"] ?? null} matchId={match.id} marketName="Highest Scoring Round" matchLabel={matchLabel} showLabel onClick={onOddsClick} isSelected={checkSelected(`${match.id}-Highest Scoring Round-Rounds 4 & 5`)} isCorrelated={checkIsCorrelated?.(match.id, "Highest Scoring Round")} sportType={match.sportType} className="h-full w-full bg-transparent border-0" />
                                        </div>
                                    </>
                                ) : (
                                    // Default fallback for Yes/No props or generic single-row
                                    match.extendedOdds?.[activeMarket.replace(/_([a-z])/g, (g) => g[1].toUpperCase())] ? (
                                        Object.entries(match.extendedOdds?.[activeMarket.replace(/_([a-z])/g, (g) => g[1].toUpperCase())] || {}).map(([key, odd]) => (
                                            <div key={key} className="w-12 sm:w-14 md:w-16 flex items-center justify-center">
                                                <OddsButton
                                                    label={key}
                                                    odds={odd as number}
                                                    matchId={match.id}
                                                    marketName={normalizeMarketName(activeMarket)} // Safe Title Case
                                                    matchLabel={matchLabel}
                                                    showLabel={true}
                                                    onClick={onOddsClick}
                                                    isSelected={checkSelected(`${match.id}-${normalizeMarketName(activeMarket)}-${key}`)} // Consistent ID
                                                    isCorrelated={checkIsCorrelated?.(match.id, normalizeMarketName(activeMarket))}
                                                    sportType={match.sportType}
                                                    className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="w-12 sm:w-14 md:w-16 flex items-center justify-center">
                                                <OddsButton label="Yes" odds={null} matchId={match.id} marketName={normalizeMarketName(activeMarket)} matchLabel={matchLabel} className="h-full w-full border-0" />
                                            </div>
                                            <div className="w-12 sm:w-14 md:w-16 flex items-center justify-center">
                                                <OddsButton label="No" odds={null} matchId={match.id} marketName={normalizeMarketName(activeMarket)} matchLabel={matchLabel} className="h-full w-full border-0" />
                                            </div>
                                        </>
                                    )
                                )
                            )}

                        {/* School-based props */}
                        {['first_bonus', 'late_surge', 'comeback_team'].includes(activeMarket) &&
                            renderSchoolOdds(activeMarket.replace(/_([a-z])/g, (g) => g[1].toUpperCase()), activeMarket.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
                        }
                    </>
                )}

                {/* More Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoreClick?.(match);
                    }}
                    className="w-10 sm:w-12 flex flex-col items-center justify-center border-l border-white/5 hover:bg-white/5 transition-colors cursor-pointer self-stretch group/more"
                >
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover/more:text-purple-400 group-hover/more:translate-x-0.5 transition-all" />
                    <span className="text-[7px] text-slate-500 font-black group-hover/more:text-white transition-colors mt-0.5">MORE</span>
                </button>
            </div>
        </div>
    )
}

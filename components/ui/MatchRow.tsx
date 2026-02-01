"use client"

import { useState, useEffect } from "react"
import { Zap, ChevronDown, Lock } from "lucide-react"
import { OddsButton } from "./OddsButton"
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
    currentScores,
    currentRoundIdx
}: MatchRowProps) {
    const participants = match.participants || []
    const matchLabel = participants.map(p => p.name).join(' vs ')

    // NEW: Calculate lock status
    const lockStatus = getMatchLockStatus(match)
    const isLocked = lockStatus.isLocked

    // Helper to format market name to Title Case
    const formatMarketName = (market: string) => {
        return market
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

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
        <div className="flex items-center bg-slate-900/40 border-b border-white/5 hover:bg-slate-800/40 transition-colors group">
            {/* Left side: Teams & Info */}
            <div className="flex-1 py-3 px-4 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {isSimulating ? (
                        <div className="flex items-center gap-1.5 bg-red-600/20 px-1.5 py-0.5 rounded text-[8px] font-black text-red-400 animate-pulse border border-red-500/20">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            LIVE • ROUND {currentRoundIdx !== undefined ? currentRoundIdx + 1 : '?'}
                        </div>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                            {match.isVirtual
                                ? `VIRTUAL • ${match.stage}`
                                : match.tournamentName
                                    ? `${match.tournamentName} • ${match.stage}`
                                    : match.stage
                            }
                        </span>
                    )}
                    {match.isVirtual && !isSimulating && (
                        <Zap className="h-2.5 w-2.5 text-purple-400" />
                    )}
                </div>
                <div className="flex flex-col gap-0.5">
                    {participants.map((p, idx) => (
                        <div key={p.schoolId} className="flex items-center justify-between group-hover:translate-x-1 transition-transform" style={{ transitionDelay: `${idx * 75}ms` }}>
                            <span className="text-xs font-bold text-white truncate max-w-[150px]">{p.name}</span>
                            {isSimulating && currentScores && (
                                <span className="text-sm font-black font-mono text-red-500 ml-2">{currentScores[idx]}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Lock Indicator for Start Time */}
                {lockStatus.timeUntilLock !== undefined && lockStatus.timeUntilLock < 30 && !isLocked && (
                    <div className="mt-2 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[9px] font-bold text-orange-400 inline-flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" />
                        LOCKING IN {Math.floor(lockStatus.timeUntilLock)} MINS
                    </div>
                )}
            </div>

            {/* Right side: Odds Columns */}
            <div className="relative flex items-stretch divide-x divide-white/5 bg-slate-950/20">
                {/* Lock Overlay */}
                {isLocked && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                            <Lock className="h-4 w-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lockStatus.reason}</span>
                        </div>
                    </div>
                )}
                {activeMarket === 'winner' && (
                    <>
                        {participants.map((p, idx) => (
                            <div key={p.schoolId} className="w-16 sm:w-20 md:w-24 flex items-center justify-center">
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
                            <div className="w-16 sm:w-20 md:w-24 flex items-center justify-center">
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
                        <div className="relative w-24 border-r border-white/5 h-full">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full h-full flex items-center justify-between px-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                {selectedTotalLine || "Line"}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 w-full z-50 bg-slate-800 border border-white/10 shadow-xl max-h-48 overflow-y-auto rounded-b-md">
                                    {Object.keys(match.extendedOdds?.totalPoints || {})
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
                                                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white block"
                                            >
                                                {line}
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>

                        {/* Odds for Selected Line */}
                        {selectedTotalLine && (
                            <>
                                <div className="w-20 sm:w-24 flex items-center justify-center">
                                    <OddsButton
                                        label={`O ${selectedTotalLine}`}
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
                                <div className="w-20 sm:w-24 flex items-center justify-center border-r border-white/5">
                                    <OddsButton
                                        label={`U ${selectedTotalLine}`}
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
                        )}
                    </div>
                )}

                {activeMarket === 'round_winner' && (
                    <div className="flex items-center">
                        {/* Round Selector */}
                        <div className="relative w-28 border-r border-white/5 h-full">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full h-full flex items-center justify-between px-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                {selectedRound}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 w-full z-50 bg-slate-800 border border-white/10 shadow-xl rounded-b-md">
                                    {["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => {
                                                setSelectedRound(r);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white block"
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
                        <div className="w-20 md:w-24 flex items-center justify-center">
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
                        <div className="w-20 md:w-24 flex items-center justify-center">
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
                        <div className="w-20 md:w-24 flex items-center justify-center">
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
                                <div className="w-20 sm:w-24 md:w-28 flex items-center justify-center">
                                    <OddsButton label="R1" odds={match.extendedOdds?.highestScoringRound?.["Round 1"] ?? null} matchId={match.id} marketName="Highest Scoring Round" matchLabel={matchLabel} showLabel onClick={onOddsClick} isSelected={checkSelected(`${match.id}-Highest Scoring Round-Round 1`)} isCorrelated={checkIsCorrelated?.(match.id, "Highest Scoring Round")} sportType={match.sportType} className="h-full w-full bg-transparent border-0" />
                                </div>
                                <div className="w-20 sm:w-24 md:w-28 flex items-center justify-center">
                                    <OddsButton label="R2&3" odds={match.extendedOdds?.highestScoringRound?.["Rounds 2 & 3"] ?? null} matchId={match.id} marketName="Highest Scoring Round" matchLabel={matchLabel} showLabel onClick={onOddsClick} isSelected={checkSelected(`${match.id}-Highest Scoring Round-Rounds 2 & 3`)} isCorrelated={checkIsCorrelated?.(match.id, "Highest Scoring Round")} sportType={match.sportType} className="h-full w-full bg-transparent border-0" />
                                </div>
                                <div className="w-20 sm:w-24 md:w-28 flex items-center justify-center">
                                    <OddsButton label="R4&5" odds={match.extendedOdds?.highestScoringRound?.["Rounds 4 & 5"] ?? null} matchId={match.id} marketName="Highest Scoring Round" matchLabel={matchLabel} showLabel onClick={onOddsClick} isSelected={checkSelected(`${match.id}-Highest Scoring Round-Rounds 4 & 5`)} isCorrelated={checkIsCorrelated?.(match.id, "Highest Scoring Round")} sportType={match.sportType} className="h-full w-full bg-transparent border-0" />
                                </div>
                            </>
                        ) : (
                            // Default fallback for Yes/No props or generic single-row
                            Object.entries(match.extendedOdds?.[activeMarket.replace(/_([a-z])/g, (g) => g[1].toUpperCase())] || {}).map(([key, odd]) => (
                                <div key={key} className="w-20 md:w-24 flex items-center justify-center">
                                    <OddsButton
                                        label={key}
                                        odds={odd as number}
                                        matchId={match.id}
                                        marketName={formatMarketName(activeMarket)} // Safe Title Case
                                        matchLabel={matchLabel}
                                        showLabel={true}
                                        onClick={onOddsClick}
                                        isSelected={checkSelected(`${match.id}-${formatMarketName(activeMarket)}-${key}`)} // Consistent ID
                                        isCorrelated={checkIsCorrelated?.(match.id, formatMarketName(activeMarket))}
                                        sportType={match.sportType}
                                        className="h-full w-full rounded-none bg-transparent hover:bg-white/5 border-0"
                                    />
                                </div>
                            ))
                        )
                    )}

                {/* School-based props */}
                {['first_bonus', 'late_surge', 'comeback_team'].includes(activeMarket) &&
                    renderSchoolOdds(activeMarket.replace(/_([a-z])/g, (g) => g[1].toUpperCase()), activeMarket.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
                }

                {/* More Button */}
                <div onClick={() => onMoreClick?.(match)} className="w-8 md:w-10 flex items-center justify-center border-l border-white/5 hover:bg-white/5 transition-colors cursor-pointer self-stretch">
                    <span className="text-[9px] md:text-[10px] text-slate-500 font-bold -rotate-90">MORE</span>
                </div>
            </div>
        </div>
    )
}

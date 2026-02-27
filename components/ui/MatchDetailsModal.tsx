import React, { useState } from "react"
import { Match } from "@/lib/types"
import { X, Trophy, Zap, Target, BarChart3, HelpCircle, Lock, Sparkles } from "lucide-react"
import { OddsButton } from "./OddsButton"
import { cn, normalizeMarketName } from "@/lib/utils"
import { Selection } from "@/lib/store/context"
import { getMatchLockStatus } from "@/lib/match-utils"

// ... (PROPS AND DESCRIPTIONS REMAIN SAME)

export function MatchDetailsModal({ match, onClose, onOddsClick, checkSelected, checkIsCorrelated }: MatchDetailsModalProps) {
    const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
    const participants = match.participants || []
    const matchLabel = participants.map(p => p.name).join(' vs ')

    const { isLocked } = getMatchLockStatus(match)

    const toggleInfo = (market: string) => {
        if (expandedInfo === market) setExpandedInfo(null);
        else setExpandedInfo(market);
    }

    // AI Win Probabilities Calculation (Synced with MatchRow)
    const winProbabilities = React.useMemo(() => {
        const parts = match.participants || [];
        if (!parts.length) return [];
        let probs: number[] = [];
        const internalScores = (match.result as any)?.totalScores;
        const isLive = match.status === 'live';

        if (isLive && internalScores) {
            const currentTotal = internalScores.reduce((a: number, b: number) => a + b, 0) || 1;
            probs = internalScores.map((s: number) => (s / currentTotal) * 100);
        } else {
            const inverseOdds = parts.map(p => 1 / (p.odd || match.odds?.[p.schoolId] || 2));
            const totalInverse = inverseOdds.reduce((a, b) => a + b, 0);
            probs = inverseOdds.map(io => (io / totalInverse) * 100);
        }
        return probs.map(p => Math.round(p));
    }, [match.participants, match.status, match.result, match.odds]);

    const renderMarketSection = (title: string, icon: React.ReactNode, content: React.ReactNode, descriptionKey?: string, customKey?: string) => (
        <div key={customKey} className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 text-slate-400">
                        {icon}
                    </div>
                    <h3 className="text-[12px] font-black text-white uppercase tracking-[0.1em]">
                        {title}
                    </h3>
                </div>
                {descriptionKey && (
                    <button
                        onClick={() => toggleInfo(descriptionKey)}
                        className={cn(
                            "p-1.5 rounded-lg transition-all",
                            expandedInfo === descriptionKey ? "bg-purple-500 text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                        )}
                    >
                        <HelpCircle className="h-4 w-4" />
                    </button>
                )}
            </div>

            {expandedInfo === descriptionKey && (
                <div className="mb-4 px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl animate-in zoom-in-95 duration-200">
                    <p className="text-[11px] font-medium text-purple-200 leading-relaxed italic">
                        {MARKET_DESCRIPTIONS[descriptionKey || ""] || (match.metadata as Record<string, any>)?.marketHelp?.[descriptionKey || ""] || "Detailed explanation of this betting market."}
                    </p>
                </div>
            )}

            <div className="rounded-2xl overflow-hidden backdrop-blur-sm">
                {content}
            </div>
        </div>
    )

    const getRoundWinnerOdds = (roundNum: number) => {
        const roundKey = `round${roundNum}Winner`;
        return match.extendedOdds?.[roundKey];
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-[#0f1115] w-full max-w-5xl h-[92dvh] sm:max-h-[95vh] overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500">

                {/* Visual Header Enhancement */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-600/10 to-transparent pointer-events-none" />

                {/* Sticky Header */}
                <div className="relative z-10 px-6 sm:px-8 py-4 sm:py-6 border-b border-white/5 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-red-600 rounded text-[9px] font-black text-white uppercase tracking-widest">{match.stage}</span>
                            {match.status === 'live' && (
                                <span className="px-2 py-0.5 bg-red-600/20 border border-red-500/20 rounded text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                                    {match.sportType === 'quiz' ? `ROUND ${match.currentRound !== undefined ? match.currentRound + 1 : 1}` : 'LIVE'}
                                </span>
                            )}
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-50">• {match.status === 'live' ? 'LIVE UPDATES' : match.status === 'finished' ? 'FINISHED' : 'UPCOMING'}</span>
                            {isLocked && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">
                                    <Lock className="h-2 w-2" /> BETS LOCKED
                                </span>
                            )}
                        </div>

                        {/* Smart N-team Scoreboard Layout — handles both 2-team and 3-team virtual matches */}
                        {participants.length >= 3 ? (
                            // 3-team layout for virtual matches
                            <div className="flex items-start gap-3 w-full pt-2 flex-wrap">
                                {participants.map((p, idx) => {
                                    const colors = ['text-purple-400', 'text-indigo-400', 'text-emerald-400']
                                    const score = (match.result as any)?.totalScores?.[idx]
                                    const hasScore = match.status === 'live' || match.status === 'finished'
                                    const winnerIdx = (match.result as any)?.winnerIndex
                                    const isWinner = hasScore && winnerIdx === idx
                                    return (
                                        <div key={p.schoolId} className={cn(
                                            "flex flex-col items-center text-center flex-1 min-w-[90px] px-1 py-2 rounded-xl transition-all",
                                            isWinner ? "bg-white/5 border border-white/10" : ""
                                        )}>
                                            {hasScore && (
                                                <span className={cn(
                                                    "text-2xl md:text-4xl font-black tabular-nums",
                                                    isWinner ? "text-white" : "text-white/60"
                                                )}>
                                                    {score ?? 0}
                                                </span>
                                            )}
                                            <span className={cn(
                                                "text-[11px] md:text-sm font-black text-white leading-tight mt-1 break-words hyphens-auto",
                                                isWinner && "text-white"
                                            )}>
                                                {p.name}
                                            </span>
                                            <span className={cn("text-[9px] font-bold uppercase tracking-widest mt-1", colors[idx] ?? 'text-slate-400')}>
                                                {winProbabilities[idx] ?? '--'}% win
                                            </span>
                                            {isWinner && (
                                                <span className="mt-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-full">
                                                    Winner
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            // Standard 2-team layout
                            <div className="flex items-center justify-between w-[90%] xl:w-[80%] pt-2 px-2">
                                {/* Team 1 */}
                                {participants[0] && (
                                    <div className="flex flex-col items-start flex-1 min-w-[80px]">
                                        <span className="text-sm md:text-xl font-black text-white tracking-tight break-words hyphens-auto text-left leading-tight">
                                            {participants[0].name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                                                {winProbabilities[0]}% <span className="opacity-50 text-slate-500 hidden sm:inline">AI Win Prob</span>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Scores (Center) */}
                                <div className="flex flex-col items-center justify-center px-4 shrink-0">
                                    {(match.status === 'live' || match.status === 'finished') ? (
                                        <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-2xl border border-white/5 shadow-inner">
                                            <span className="text-3xl md:text-5xl font-black text-white tabular-nums drop-shadow-md">
                                                {(match.result as any)?.totalScores?.[0] ?? 0}
                                            </span>
                                            <span className="text-slate-600 text-sm font-black">-</span>
                                            <span className="text-3xl md:text-5xl font-black text-white tabular-nums drop-shadow-md">
                                                {(match.result as any)?.totalScores?.[1] ?? 0}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-600 text-sm font-black mx-4 italic">VS</span>
                                    )}
                                </div>

                                {/* Team 2 */}
                                {participants[1] ? (
                                    <div className="flex flex-col items-end flex-1 min-w-[80px]">
                                        <span className="text-sm md:text-xl font-black text-white tracking-tight break-words hyphens-auto text-right leading-tight">
                                            {participants[1].name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                                <span className="opacity-50 text-slate-500 hidden sm:inline">AI Win Prob</span> {winProbabilities[1]}%
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1" />
                                )}
                            </div>
                        )}
                    </div>
                    {/* ... (CLOSE BUTTON REMAINS SAME) */}
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white shadow-xl hover:rotate-90 absolute right-6 sm:right-8 top-1/2 -translate-y-1/2"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Sleek AI Probability Bar (Bottom of Header) */}
                    {participants.length >= 2 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 flex shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                            {participants.map((p, idx) => (
                                <div
                                    key={`ai-${p.schoolId}`}
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        idx === 0 ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" :
                                            idx === 1 ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" :
                                                "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                                    )}
                                    style={{ width: `${winProbabilities[idx]}%` }}
                                    title={`${p.name}: ${winProbabilities[idx]}% AI Win Probability`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Content Overlay grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 relative z-10 pb-20">

                    {/* Left Column: Main Markets */}
                    <div className="lg:col-span-7 space-y-2">

                        {/* 1X2 Market */}
                        {renderMarketSection(match.sportType === 'football' ? "Full Time Result" : "Match Winner", <Target className="h-4 w-4 text-purple-400" />, (
                            <div className="flex gap-2 h-14 overflow-x-auto custom-scrollbar pb-1">
                                {participants.map((p, idx) => (
                                    <div key={p.schoolId} className="flex-1 min-w-[100px] h-full relative group">
                                        <div className="absolute top-1 left-4 text-[9px] font-black text-slate-500 uppercase z-10">{p.name}</div>
                                        <OddsButton
                                            label={(idx + 1).toString()}
                                            odds={p.odd || match.odds[p.schoolId] || null}
                                            matchId={match.id}
                                            matchLabel={matchLabel}
                                            marketName="Match Winner"
                                            showLabel={false}
                                            onClick={onOddsClick}
                                            isSelected={checkSelected(`${match.id}-Match Winner-${idx + 1}`)}
                                            isCorrelated={checkIsCorrelated?.(match.id, "Match Winner")}
                                            isLocked={isLocked}
                                            tournamentName={match.tournamentName || undefined}
                                            stage={match.stage}
                                            className="h-full w-full rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 pt-3 transition-all"
                                        />
                                    </div>
                                ))}
                                {(match.sportType === "football" || match.sportType === "handball") && (
                                    <div className="flex-1 min-w-[80px] h-full relative group">
                                        <div className="absolute top-1 left-4 text-[9px] font-black text-slate-500 uppercase z-10">DRAW</div>
                                        <OddsButton
                                            label="X"
                                            odds={match.odds?.["X"] || null}
                                            matchId={match.id}
                                            matchLabel={matchLabel}
                                            marketName="Match Winner"
                                            showLabel={false}
                                            onClick={onOddsClick}
                                            isSelected={checkSelected(`${match.id}-Match Winner-X`)}
                                            isCorrelated={checkIsCorrelated?.(match.id, "Match Winner")}
                                            isLocked={isLocked}
                                            tournamentName={match.tournamentName || undefined}
                                            stage={match.stage}
                                            className="h-full w-full rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 pt-3 transition-all"
                                        />
                                    </div>
                                )}
                            </div>
                        ), "Match Winner")}

                        {/* Point Spread / Handicap */}
                        {match.extendedOdds?.handicap && renderMarketSection("Point Spread / Handicap", <Target className="h-3.5 w-3.5" />, (
                            <div className="flex gap-2 h-14 overflow-x-auto custom-scrollbar pb-1">
                                {participants.slice(0, 2).map((p, idx) => {
                                    const spread = match.extendedOdds?.handicap?.[p.name] || 0;
                                    const spreadLabel = spread >= 0 ? `+${spread}` : spread.toString();
                                    return (
                                        <div key={p.schoolId} className="flex-1 min-w-[120px] h-full relative group">
                                            <div className="absolute top-1 left-4 text-[9px] font-black text-slate-500 uppercase tracking-widest z-10">{p.name}</div>
                                            <OddsButton
                                                label={spreadLabel}
                                                odds={1.90} // Placeholder: In real scenario, this would come from the market logic
                                                matchId={match.id}
                                                matchLabel={matchLabel}
                                                marketName="Handicap"
                                                showLabel={true}
                                                onClick={onOddsClick}
                                                isSelected={checkSelected(`${match.id}-Handicap-${p.name}`)}
                                                isCorrelated={checkIsCorrelated?.(match.id, "Handicap")}
                                                isLocked={isLocked}
                                                tournamentName={match.tournamentName || undefined}
                                                stage={match.stage}
                                                className="h-full w-full rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 pt-3 text-lg transition-all"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        ), "Handicap")}

                        {/* Totals & Dynamic Lines */}
                        {renderMarketSection("Total Match Points", <BarChart3 className="h-3.5 w-3.5" />, (
                            <div className="flex flex-col gap-2">
                                {Object.entries(match.extendedOdds?.totalPoints || {})
                                    .sort((a, b) => parseFloat(a[0].split(" ")[1]) - parseFloat(b[0].split(" ")[1]))
                                    .reduce((acc: { line: string, over: [string, number | null], under: [string, number | null] }[], [key], _index, array) => {
                                        const line = key.split(" ")[1];
                                        if (!acc.find(g => g.line === line)) {
                                            const over = array.find(k => k[0] === `Over ${line}`);
                                            const under = array.find(k => k[0] === `Under ${line}`);
                                            if (over && under) acc.push({ line, over: over as [string, number | null], under: under as [string, number | null] });
                                        }
                                        return acc;
                                    }, [])
                                    .map((group) => (
                                        <div key={group.line} className="flex items-center h-14 bg-white/[0.01] rounded-xl border border-white/5 overflow-hidden group">
                                            <div className="w-24 px-6 text-[12px] font-black text-white/80 border-r border-white/5 flex items-center justify-center h-full bg-white/[0.03] group-hover:bg-white/[0.05] transition-colors">
                                                {group.line}
                                            </div>
                                            <div className="flex-1 flex gap-1 p-1 h-full">
                                                <div className="flex-1">
                                                    <OddsButton
                                                        label={`Over`}
                                                        odds={group.over[1]}
                                                        matchId={match.id}
                                                        marketName="Total Points"
                                                        matchLabel={matchLabel}
                                                        onClick={(sel: Selection) => onOddsClick({ ...sel, label: `Over ${group.line}` })}
                                                        id={`${match.id}-Total Points-Over ${group.line}`}
                                                        isSelected={checkSelected(`${match.id}-Total Points-Over ${group.line}`)}
                                                        isCorrelated={checkIsCorrelated?.(match.id, "Total Points")}
                                                        isLocked={isLocked}
                                                        tournamentName={match.tournamentName || undefined}
                                                        stage={match.stage}
                                                        className="h-full w-full rounded-lg bg-transparent hover:bg-white/[0.03] border-0"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <OddsButton
                                                        label={`Under`}
                                                        odds={group.under[1]}
                                                        matchId={match.id}
                                                        marketName="Total Points"
                                                        matchLabel={matchLabel}
                                                        onClick={(sel: Selection) => onOddsClick({ ...sel, label: `Under ${group.line}` })}
                                                        id={`${match.id}-Total Points-Under ${group.line}`}
                                                        isSelected={checkSelected(`${match.id}-Total Points-Under ${group.line}`)}
                                                        isCorrelated={checkIsCorrelated?.(match.id, "Total Points")}
                                                        isLocked={isLocked}
                                                        tournamentName={match.tournamentName || undefined}
                                                        stage={match.stage}
                                                        className="h-full w-full rounded-lg bg-transparent hover:bg-white/[0.03] border-0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        ), "Total Points")}

                        {/* Round Winners - Categorized View */}
                        {match.sportType === 'quiz' && (
                            <div className="grid grid-cols-1 gap-1">
                                {["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"].map((round, idx) => {
                                    const odds = getRoundWinnerOdds(idx + 1);
                                    if (!odds) return null;
                                    return renderMarketSection(`${round} Winner`, <Zap className="h-4 w-4 text-amber-400" />, (
                                        <div className="flex gap-2 h-14 overflow-x-auto custom-scrollbar pb-1">
                                            {participants.map((p, sIdx) => (
                                                <div key={p.schoolId} className="flex-1 min-w-[80px] h-full relative group">
                                                    <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest z-10">{p.name.split(' ').map(w => w[0]).join('')}</div>
                                                    <OddsButton
                                                        label={(sIdx + 1).toString()}
                                                        odds={odds[p.name] as number}
                                                        matchId={match.id}
                                                        marketName={`${round} Winner`}
                                                        matchLabel={matchLabel}
                                                        showLabel={true}
                                                        onClick={onOddsClick}
                                                        isSelected={checkSelected(`${match.id}-${normalizeMarketName(`${round} Winner`)}-${sIdx + 1}`)}
                                                        isCorrelated={checkIsCorrelated?.(match.id, `${round} Winner`)}
                                                        isLocked={isLocked}
                                                        tournamentName={match.tournamentName || undefined}
                                                        stage={match.stage}
                                                        className="h-full w-full rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 pt-3 flex flex-col justify-center items-center transition-all"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ), "Round Winner", round)
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Props & Exotic Markets */}
                    <div className="lg:col-span-5 space-y-2">

                        {/* Generic / AI-Generated Markets (Catch-All) */}
                        <div className="space-y-4">
                            {Object.entries(match.extendedOdds || {})
                                .filter(([key]) => {
                                    // List of core layout handled market keys
                                    const handled = [
                                        'winner', 'handicap', 'totalPoints'
                                    ];
                                    const isRoundWinner = key.toLowerCase().includes('round') && key.toLowerCase().includes('winner');
                                    return !handled.includes(key) && !isRoundWinner;
                                })
                                .map(([key, odds]) => {
                                    if (!odds || typeof odds !== 'object') return null;
                                    const marketTitle = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    const optionsList = Object.entries(odds as Record<string, number>);

                                    return renderMarketSection(marketTitle, <Sparkles className="h-3.5 w-3.5 text-yellow-500" />, (
                                        <div className={cn(
                                            "grid gap-2",
                                            optionsList.length % 3 === 0 ? "grid-cols-3" : optionsList.length % 2 === 0 ? "grid-cols-2" : "grid-cols-1"
                                        )}>
                                            {optionsList.map(([label, value]) => (
                                                <div key={label} className="h-14">
                                                    <OddsButton
                                                        label={label}
                                                        odds={value}
                                                        matchId={match.id}
                                                        marketName={marketTitle}
                                                        matchLabel={matchLabel}
                                                        showLabel
                                                        onClick={onOddsClick}
                                                        isSelected={checkSelected(`${match.id}-${normalizeMarketName(marketTitle)}-${label}`)}
                                                        isCorrelated={checkIsCorrelated?.(match.id, marketTitle)}
                                                        isLocked={isLocked}
                                                        tournamentName={match.tournamentName || undefined}
                                                        stage={match.stage}
                                                        className="h-full w-full rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ), marketTitle); // Pass marketTitle as descriptionKey to hook into AI helpInfo
                                })
                            }
                        </div>
                    </div>
                </div>

                {/* Info Footer */}
                <div className="px-8 py-4 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-accent fill-current" /> Instant Settlement</span>
                    </div>
                    <span>Virtual Sports © 2024</span>
                </div>
            </div>
        </div>
    )
}

interface MatchDetailsModalProps {
    match: Match;
    onClose: () => void;
    onOddsClick: (selection: Selection) => void;
    checkSelected: (selectionId: string) => boolean;
    checkIsCorrelated?: (matchId: string, marketName: string) => boolean;
}

const MARKET_DESCRIPTIONS: Record<string, string> = {
    "Match Winner": "Pick the overall winner of the contest.",
    "Full Time Result": "Predict the outcome of the match at full time (Home win, Draw, or Away win).",
    "Handicap": "A point spread applied to the final score to level the playing field between competitors.",
    "Total Points": "Bet on whether the combined total points/goals will be Over or Under a specific value.",
    "Winning Margin": "The point difference between the winner and the 1st runner-up.",
    "Comeback Team": "Pick a specific competitor to win after being behind during the match.",
    "Lead Changes": "Will the lead change hands more than expected throughout the match?",
    "First Bonus": "Predict which competitor will earn the first advantage or bonus points.",
    "Podium Finish": "Predict if the selected competitor will finish in the top 3 (Gold, Silver, or Bronze).",
    "Perfect Round": "A period where a competitor performs without any registered errors.",
    "Shutout Round": "A period where at least one competitor fails to score any points."
};

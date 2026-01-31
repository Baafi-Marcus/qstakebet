import React, { useState } from "react"
import { Match } from "@/lib/types"
import { X, Trophy, Zap, Target, BarChart3, HelpCircle } from "lucide-react"
import { OddsButton } from "./OddsButton"
import { cn } from "@/lib/utils"
import { Selection } from "@/lib/store/useBetSlip"

interface MatchDetailsModalProps {
    match: Match;
    onClose: () => void;
    onOddsClick: (selection: Selection) => void;
    checkSelected: (selectionId: string) => boolean;
    checkIsCorrelated?: (matchId: string, marketName: string) => boolean;
}

const MARKET_DESCRIPTIONS: Record<string, string> = {
    "Match Winner": "Pick the overall winner of the contest (Schools 1, 2, or 3).",
    "Total Points": "Bet on whether the combined total points of all schools will be Over or Under a specific value.",
    "Winning Margin": "The point difference between the winner and the 1st runner-up.",
    "Comeback Team": "Pick a specific school to win the match after being behind after Round 2.",
    "Lead Changes": "Will the lead change hands more than 2.5 times throughout the match?",
    "First Bonus": "Predict which school will earn the first bonus points in the match.",
    "Late Surge": "Which school will score the most points in the final two rounds (R4 + R5)?",
    "Strong Start": "Which school will score the most points in the first two rounds (R1 + R2)?",
    "Highest Points": "Which school will have the highest individual round score in the match?",
    "Perfect Round": "A round where a school answers all questions correctly without any errors.",
    "Shutout Round": "A round where at least one school fails to score any points."
};

export function MatchDetailsModal({ match, onClose, onOddsClick, checkSelected, checkIsCorrelated }: MatchDetailsModalProps) {
    const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
    const participants = match.participants || []
    const matchLabel = participants.map(p => p.name).join(' vs ')

    const toggleInfo = (market: string) => {
        if (expandedInfo === market) setExpandedInfo(null);
        else setExpandedInfo(market);
    }

    const renderMarketSection = (title: string, icon: React.ReactNode, content: React.ReactNode, descriptionKey?: string, customKey?: string) => (
        <div key={customKey} className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-800 rounded-lg text-slate-400">
                        {icon}
                    </div>
                    <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.15em]">
                        {title}
                    </h3>
                </div>
                {descriptionKey && (
                    <button
                        onClick={() => toggleInfo(descriptionKey)}
                        className={cn(
                            "p-1.5 rounded-lg transition-all",
                            expandedInfo === descriptionKey ? "bg-purple-500 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {expandedInfo === descriptionKey && (
                <div className="mb-3 px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl animate-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-medium text-purple-200 leading-relaxed italic">
                        {MARKET_DESCRIPTIONS[descriptionKey || ""]}
                    </p>
                </div>
            )}

            <div className="bg-slate-950/40 rounded-2xl border border-white/5 overflow-hidden shadow-sm backdrop-blur-sm">
                {content}
            </div>
        </div>
    )

    const getRoundWinnerOdds = (roundNum: number) => {
        const roundKey = `round${roundNum}Winner`;
        return match.extendedOdds?.[roundKey];
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative bg-[#0f1115] w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col">

                {/* Visual Header Enhancement */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-600/10 to-transparent pointer-events-none" />

                {/* Sticky Header */}
                <div className="relative z-10 px-8 py-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-red-600 rounded text-[9px] font-black text-white uppercase tracking-widest">{match.stage}</span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-50">• LIVE UPDATES</span>
                        </div>
                        <h2 className="text-sm md:text-xl font-black text-white tracking-tight flex flex-wrap items-center gap-x-3 gap-y-1">
                            {participants.map((p, idx) => (
                                <React.Fragment key={p.schoolId}>
                                    <span className="flex-shrink-0">{p.name}</span>
                                    {idx < participants.length - 1 && (
                                        <span className="text-slate-600 text-xs font-medium shrink-0">vs</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white shadow-xl hover:rotate-90"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content Overlay grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

                    {/* Left Column: Main Markets */}
                    <div className="lg:col-span-7 space-y-2">

                        {/* 1X2 Market */}
                        {renderMarketSection("Match Winner", <Target className="h-3.5 w-3.5" />, (
                            <div className="flex divide-x divide-white/5 h-20 overflow-x-auto custom-scrollbar">
                                {participants.map((p, idx) => (
                                    <div key={p.schoolId} className="flex-1 min-w-[80px] h-full relative group">
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase truncate w-full text-center px-1">
                                            {p.name.split(' ').map(w => w[0]).join('')}
                                        </div>
                                        <OddsButton
                                            label={(idx + 1).toString()}
                                            odds={p.odd || match.odds[p.schoolId] || null}
                                            matchId={match.id}
                                            matchLabel={matchLabel}
                                            marketName="Match Winner"
                                            showLabel={true}
                                            onClick={onOddsClick}
                                            isSelected={checkSelected(`${match.id}-Match Winner-${idx + 1}`)}
                                            isCorrelated={checkIsCorrelated?.(match.id, "Match Winner")}
                                            className="h-full w-full rounded-none bg-transparent hover:bg-white/[0.03] border-0 pt-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        ), "Match Winner")}

                        {/* Totals & Dynamic Lines */}
                        {renderMarketSection("Total Match Points", <BarChart3 className="h-3.5 w-3.5" />, (
                            <div className="flex flex-col">
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
                                        <div key={group.line} className="flex items-center h-14 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                                            <div className="w-24 px-6 text-[11px] font-black text-slate-500 border-r border-white/5 flex items-center h-full bg-white/[0.02]">
                                                {group.line}
                                            </div>
                                            <div className="flex-1 flex divide-x divide-white/5 h-full">
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
                                                        className="h-full w-full rounded-none bg-transparent hover:bg-white/[0.03] border-0"
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
                                                        className="h-full w-full rounded-none bg-transparent hover:bg-white/[0.03] border-0"
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
                                    return renderMarketSection(`${round} Winner`, <Zap className="h-3.5 w-3.5" />, (
                                        <div className="flex divide-x divide-white/5 h-16 overflow-x-auto custom-scrollbar">
                                            {participants.map((p, sIdx) => (
                                                <div key={p.schoolId} className="flex-1 min-w-[60px] h-full">
                                                    <OddsButton
                                                        label={(sIdx + 1).toString()}
                                                        odds={odds[p.name] as number}
                                                        matchId={match.id}
                                                        marketName={`${round} Winner`}
                                                        matchLabel={matchLabel}
                                                        showLabel={true}
                                                        onClick={onOddsClick}
                                                        isSelected={checkSelected(`${match.id}-${round} Winner-${sIdx + 1}`)}
                                                        isCorrelated={checkIsCorrelated?.(match.id, `${round} Winner`)}
                                                        className="h-full w-full rounded-none bg-transparent hover:bg-white/[0.03] border-0 flex flex-col justify-center items-center"
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

                        {/* Winning Margin */}
                        {renderMarketSection("Winning Margin", <BarChart3 className="h-3.5 w-3.5" />, (
                            <div className="flex divide-x divide-white/5 h-16">
                                {[
                                    { label: "1-10", odds: match.extendedOdds?.winningMargin?.["1-10"] },
                                    { label: "11-25", odds: match.extendedOdds?.winningMargin?.["11-25"] },
                                    { label: "26+", odds: match.extendedOdds?.winningMargin?.["26+"] }
                                ].map((opt) => (
                                    <div key={opt.label} className="flex-1 h-full">
                                        <OddsButton
                                            label={opt.label}
                                            odds={opt.odds ?? 0}
                                            matchId={match.id}
                                            marketName="Winning Margin"
                                            matchLabel={matchLabel}
                                            showLabel={true}
                                            onClick={onOddsClick}
                                            isSelected={checkSelected(`${match.id}-Winning Margin-${opt.label}`)}
                                            isCorrelated={checkIsCorrelated?.(match.id, "Winning Margin")}
                                            className="h-full w-full rounded-none bg-transparent hover:bg-white/[0.03] border-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        ), "Winning Margin")}

                        {/* Comeback Markets - Expanded */}
                        <div className="grid grid-cols-1 gap-4">
                            {renderMarketSection("Comeback Win", <Zap className="h-3.5 w-3.5" />, (
                                <div className="flex divide-x divide-white/5 h-16">
                                    {["Yes", "No"].map(val => (
                                        <div key={val} className="flex-1 h-full">
                                            <OddsButton
                                                label={val}
                                                odds={match.extendedOdds?.comebackWin?.[val] ?? 0}
                                                matchId={match.id}
                                                marketName="Comeback Win"
                                                matchLabel={matchLabel}
                                                showLabel={true}
                                                onClick={onOddsClick}
                                                isSelected={checkSelected(`${match.id}-Comeback Win-${val}`)}
                                                isCorrelated={checkIsCorrelated?.(match.id, "Comeback Win")}
                                                className="h-full w-full rounded-none bg-transparent hover:bg-white/[0.03] border-0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ), "Comeback Win")}

                            {match.sportType === 'quiz' && renderMarketSection("Comeback Team", <Trophy className="h-3.5 w-3.5" />, (
                                <div className="flex divide-x divide-white/5 h-16 overflow-x-auto custom-scrollbar">
                                    {participants.map((p, sIdx) => (
                                        <div key={p.schoolId} className="flex-1 min-w-[60px] h-full">
                                            <OddsButton
                                                label={(sIdx + 1).toString()}
                                                odds={match.extendedOdds?.comebackTeam?.[p.name] ?? 0}
                                                matchId={match.id}
                                                marketName="Comeback Team"
                                                matchLabel={matchLabel}
                                                showLabel={true}
                                                onClick={onOddsClick}
                                                isSelected={checkSelected(`${match.id}-Comeback Team-${sIdx + 1}`)}
                                                isCorrelated={checkIsCorrelated?.(match.id, "Comeback Team")}
                                                className="h-full w-full rounded-none bg-transparent hover:bg-white/[0.03] border-0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ), "Comeback Team")}
                        </div>


                        {/* High Randomness Props */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { key: 'perfectRound', name: 'Perfect Round', options: ['Yes', 'No'] },
                                { key: 'shutoutRound', name: 'Shutout Round', options: ['Yes', 'No'] },
                                { key: 'leadChanges', name: 'Lead Changes', options: ['Under 2.5', 'Over 2.5'] }
                            ].map(prop => (
                                <div key={prop.key} className="w-full">
                                    {renderMarketSection(prop.name, <HelpCircle className="h-3.5 w-3.5" />, (
                                        <div className="flex divide-x divide-white/5 h-16">
                                            {prop.options.map(opt => (
                                                <div key={opt} className="flex-1 h-full">
                                                    <OddsButton
                                                        label={opt}
                                                        odds={match.extendedOdds?.[prop.key]?.[opt] ?? 0}
                                                        matchId={match.id}
                                                        marketName={prop.name}
                                                        matchLabel={matchLabel}
                                                        showLabel={true}
                                                        onClick={onOddsClick}
                                                        isSelected={checkSelected(`${match.id}-${prop.name}-${opt}`)}
                                                        isCorrelated={checkIsCorrelated?.(match.id, prop.name)}
                                                        className="h-full w-full rounded-none bg-transparent hover:bg-white/[0.03] border-0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ), prop.name)}
                                </div>
                            ))}
                        </div>

                        {/* School Performance Specials */}
                        <div className="space-y-4">
                            {match.sportType === 'quiz' && ['firstBonus', 'lateSurge'].map(propKey => {
                                const propName = propKey === 'firstBonus' ? 'First Bonus' : 'Late Surge';
                                return renderMarketSection(propName, <Zap className="h-3.5 w-3.5" />, (
                                    <div className="flex divide-x divide-white/5 h-16 overflow-x-auto custom-scrollbar">
                                        {participants.map((p, sIdx) => (
                                            <div key={p.schoolId} className="flex-1 min-w-[60px] h-full">
                                                <OddsButton
                                                    label={(sIdx + 1).toString()}
                                                    odds={match.extendedOdds?.[propKey]?.[p.name] ?? 0}
                                                    matchId={match.id}
                                                    marketName={propName}
                                                    matchLabel={matchLabel}
                                                    showLabel
                                                    onClick={onOddsClick}
                                                    isSelected={checkSelected(`${match.id}-${propName}-${sIdx + 1}`)}
                                                    isCorrelated={checkIsCorrelated?.(match.id, propName)}
                                                    className="h-full w-full bg-transparent border-0 rounded-none hover:bg-white/[0.03]"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ), propName, propKey)
                            })}
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

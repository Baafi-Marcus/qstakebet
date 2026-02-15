import React from "react"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { MatchRow } from "@/components/ui/MatchRow"
import { Match } from "@/lib/types"
import { VirtualSchool, VirtualMatchOutcome, simulateMatch, VirtualSelection } from "@/lib/virtuals"

interface VirtualsMatchListProps {
    isSimulationActive: boolean;
    selectedCategory: 'all' | 'regional' | 'national';
    selectedRegion: string | null;
    setSelectedRegion: (region: string) => void;
    availableRegions: string[];
    activeMarket: 'winner' | 'total_points' | 'winning_margin' | 'highest_scoring_round' | 'round_winner' | 'perfect_round' | 'shutout_round' | 'first_bonus' | 'comeback_win' | 'comeback_team' | 'lead_changes' | 'late_surge';
    setActiveMarket: (market: 'winner' | 'total_points' | 'winning_margin' | 'highest_scoring_round' | 'round_winner' | 'perfect_round' | 'shutout_round' | 'first_bonus' | 'comeback_win' | 'comeback_team' | 'lead_changes' | 'late_surge') => void;
    filteredMatches: Match[];
    isSimulating: boolean;
    selections: VirtualSelection[];
    toggleSelection: (selection: VirtualSelection) => void;
    lastOutcome: { allRoundResults: VirtualMatchOutcome[], roundId: number } | null;
    currentRound: number;
    simulationProgress: number;
    schools: VirtualSchool[];
    aiStrengths: Record<string, number>;
    userSeed: number;
    setSelectedMatchForDetails: (match: Match) => void;
}

export function VirtualsMatchList({
    isSimulationActive,
    selectedCategory,
    selectedRegion,
    setSelectedRegion,
    availableRegions,
    activeMarket,
    setActiveMarket,
    filteredMatches,
    isSimulating,
    selections,
    toggleSelection,
    lastOutcome,
    currentRound,
    simulationProgress,
    schools,
    aiStrengths,
    userSeed,
    setSelectedMatchForDetails
}: VirtualsMatchListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-44 md:pb-32">
            {/* Region Scroller (Only if Regional selected) */}
            {!isSimulationActive && selectedCategory === 'regional' && (
                <div className="flex bg-slate-950/40 p-2 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar mb-4 gap-2">
                    {availableRegions.map(region => (
                        <button
                            key={region}
                            onClick={() => setSelectedRegion(region)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                                selectedRegion === region
                                    ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {region}
                        </button>
                    ))}
                </div>
            )}

            {/* Market Selection & Groups */}
            {!isSimulationActive && (
                <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-4 space-y-4 border-b border-white/5">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
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
                                onClick={() => setActiveMarket(m.id as any)}
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
            )}

            {/* Match List */}
            <div className="flex flex-col mb-12 bg-slate-950/20 rounded-b-2xl border-x border-b border-white/5">
                {filteredMatches.map((match) => (
                    <div key={match.id} className="relative group">
                        <MatchRow
                            match={match}
                            activeMarket={activeMarket as any}
                            onOddsClick={toggleSelection as any}
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
                                    return matchOutcome?.totalScores as [number, number, number];
                                }

                                // If simulating, current progress scores
                                const parts = match.id.split("-");
                                const category = parts[3] as 'regional' | 'national' | 'all'; // Adjusted for 'all'
                                const catParam = category === 'all' ? 'national' : category; // Fallback or handle appropriately if sim logic requires specific
                                const regionSlug = parts[4] || 'all';
                                const regionName = schools.find(s => s.region.toLowerCase().replace(/\s+/g, '-') === regionSlug)?.region;

                                // We need to be careful with 'all' category here. 
                                // In the list, the match ID typically has the category embedded: "vr-123-0-national-all"
                                // So parts[3] should be 'national' or 'regional'.

                                const outcome = simulateMatch(parseInt(parts[1]), parseInt(parts[2]), schools, parts[3] as 'regional' | 'national', regionName, aiStrengths, userSeed);
                                const cRoundIdx = Math.min(4, Math.floor((simulationProgress / 60) * 5));
                                const roundsToShow = outcome.rounds.slice(0, cRoundIdx + 1);
                                return [0, 1, 2].map(sIdx => roundsToShow.reduce((acc, r) => acc + r.scores[sIdx], 0)) as [number, number, number];
                            })()}
                        />
                    </div>
                ))}
                {filteredMatches.length === 0 && (
                    <div className="p-20 text-center opacity-20">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mx-auto mb-4">
                            <Zap className="h-8 w-8" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-xs">No matches found</p>
                    </div>
                )}
            </div>
        </div>
    )
}

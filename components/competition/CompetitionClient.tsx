"use client"

import { useState, useMemo, useEffect } from "react"
import { Match } from "@/lib/types"
import { MatchRow } from "@/components/ui/MatchRow"
import { MatchDetailsModal } from "@/components/ui/MatchDetailsModal"
import { useBetSlip } from "@/lib/store/useBetSlip"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"

interface CompetitionClientProps {
    initialMatches: Match[]
    tournamentName?: string
}

export function CompetitionClient({ initialMatches, tournamentName }: CompetitionClientProps) {
    const [activeMarket, setActiveMarket] = useState<string>('winner')
    const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null)
    const { addSelection, selections } = useBetSlip()

    const checkSelected = (selectionId: string) => {
        return selections.some(s => s.selectionId === selectionId)
    }

    const availableMarkets = useMemo(() => {
        const markets = new Set<string>();

        initialMatches.forEach(m => {
            if (m.odds && Object.keys(m.odds).length > 0) {
                markets.add('winner');
            }
            if (m.extendedOdds) {
                Object.keys(m.extendedOdds).forEach(k => {
                    const kLower = k.toLowerCase().trim();
                    if (kLower === 'match winner' || kLower === 'winner' || kLower === '1x2') {
                        markets.add('winner');
                    } else if (kLower === 'total points' || kLower === 'totalpoints' || k === 'totalPoints') {
                        markets.add('total_points');
                    } else {
                        markets.add(k);
                    }
                });
            }
        });

        const sortedKeys = Array.from(markets).sort((a, b) => {
            if (a === 'winner') return -1;
            if (b === 'winner') return 1;
            if (a === 'total_points') return -1;
            if (b === 'total_points') return 1;
            return a.localeCompare(b);
        });

        return sortedKeys.map(m => {
            let label = m;
            if (m === 'winner') label = 'Match Winner';
            else if (m === 'total_points') label = 'Total Points';
            else if (m.toLowerCase().includes('overunder')) {
                const numStr = m.split('_').slice(1).join('.');
                label = `Over/Under ${numStr}`;
            } else {
                label = m.replace(/([A-Z])/g, ' $1').replace(/[_]/g, ' ').trim();
                label = label.replace(/\b\w/g, l => l.toUpperCase());
            }
            return { id: m, label };
        });
    }, [initialMatches]);

    // Fallback active market if current one is not in available markets
    if (availableMarkets.length > 0) {
        const currentActive = availableMarkets.find(m => m.id === activeMarket);
        if (!currentActive) {
            const winnerMarket = availableMarkets.find(m => m.id === 'winner');
            setActiveMarket(winnerMarket ? 'winner' : availableMarkets[0].id);
        }
    }

    return (
        <div className="space-y-4">
            {/* Market Selection Tabs */}
            {availableMarkets.length > 1 && (
                <div className="flex bg-slate-950/40 border border-white/5 overflow-x-auto no-scrollbar py-2 px-3 rounded-2xl">
                    <div className="flex items-center gap-2 min-w-max">
                        {availableMarkets.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    haptics.light();
                                    setActiveMarket(m.id);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                                    activeMarket === m.id
                                        ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/20"
                                        : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Matches List */}
            <div className="bg-slate-900/20 border border-white/5 rounded-[2rem] overflow-hidden divide-y divide-white/5">
                {initialMatches.map((match) => (
                    <MatchRow
                        key={match.id}
                        match={match}
                        activeMarket={activeMarket}
                        onOddsClick={addSelection}
                        checkSelected={checkSelected}
                        onMoreClick={(m) => setSelectedMatchForDetails(m)}
                    />
                ))}
            </div>

            {selectedMatchForDetails && (
                <MatchDetailsModal
                    match={selectedMatchForDetails}
                    onClose={() => setSelectedMatchForDetails(null)}
                    onOddsClick={addSelection}
                    checkSelected={checkSelected}
                />
            )}
        </div>
    )
}

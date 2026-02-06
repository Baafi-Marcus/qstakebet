"use client"

import { useState, useMemo } from "react"
import { Trophy, Search, Filter, Calendar } from "lucide-react"
import { Match } from "@/lib/types"
import { MatchRow } from "@/components/ui/MatchRow"
import { useBetSlip } from "@/lib/store/useBetSlip"

interface HomeClientProps {
    initialMatches: Match[]
}

// Helper to get date group label
function getDateGroupLabel(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const matchDate = new Date(date);
    matchDate.setHours(0, 0, 0, 0);

    if (matchDate.getTime() === today.getTime()) {
        return "Today";
    } else if (matchDate.getTime() === tomorrow.getTime()) {
        return "Tomorrow";
    } else if (matchDate < today) {
        return "Live & Recent";
    } else {
        return matchDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
}

export function HomeClient({ initialMatches }: HomeClientProps) {
    const [activeMarket, setActiveMarket] = useState<'winner' | 'total_points'>('winner')
    const [searchQuery, setSearchQuery] = useState("")
    const { addSelection, selections } = useBetSlip()

    const filteredMatches = initialMatches.filter(m =>
        m.stage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Group matches by date
    const groupedMatches = useMemo(() => {
        const groups: { [key: string]: Match[] } = {};

        filteredMatches.forEach(match => {
            let groupKey = "Live & Recent";

            if (match.scheduledAt) {
                const schedDate = new Date(match.scheduledAt);
                groupKey = getDateGroupLabel(schedDate);
            } else if (match.isLive) {
                groupKey = "Live & Recent";
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(match);
        });

        // Sort groups by date priority
        const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
            const priority: { [key: string]: number } = {
                "Live & Recent": 0,
                "Today": 1,
                "Tomorrow": 2
            };

            const aPriority = priority[a] ?? 3;
            const bPriority = priority[b] ?? 3;

            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            // For other dates, sort chronologically
            return a.localeCompare(b);
        });

        return sortedGroupKeys.map(key => ({
            label: key,
            matches: groups[key]
        }));
    }, [filteredMatches]);

    // Check if a selection is in the bet slip
    const checkSelected = (selectionId: string) => {
        return selections.some(s => s.selectionId === selectionId)
    }

    return (
        <div className="max-w-[1400px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 sm:space-y-10">


            {/* Market Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveMarket('winner')}
                        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeMarket === 'winner' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Winner
                    </button>
                    <button
                        onClick={() => setActiveMarket('total_points')}
                        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeMarket === 'total_points' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Total Points
                    </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                </div>
            </div>

            {/* Matches List - Grouped by Date */}
            <div className="space-y-6 sm:space-y-8">
                {groupedMatches.length > 0 ? (
                    groupedMatches.map((group) => (
                        <div key={group.label} className="space-y-3 sm:space-y-4">
                            {/* Date Header */}
                            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                                <h2 className="text-sm sm:text-xl font-black text-white uppercase tracking-tight">
                                    {group.label}
                                </h2>
                                <div className="flex-1 h-px bg-white/5" />
                                <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {group.matches.length} {group.matches.length === 1 ? 'Match' : 'Matches'}
                                </span>
                            </div>

                            {/* Matches in this group */}
                            <div className="bg-slate-900/20 border border-white/5 rounded-2xl sm:rounded-[2.5rem] overflow-hidden divide-y divide-white/5">
                                {group.matches.map((match) => (
                                    <MatchRow
                                        key={match.id}
                                        match={match}
                                        activeMarket={activeMarket}
                                        onOddsClick={addSelection}
                                        checkSelected={checkSelected}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-20 text-center space-y-4 bg-slate-900/20 rounded-3xl border border-dashed border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Trophy className="h-8 w-8 text-slate-700" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-bold">No matches found</p>
                            <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Adjust your filters or search</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}

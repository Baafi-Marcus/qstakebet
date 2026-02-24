import React from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { VirtualMatchOutcome, simulateMatch, VirtualSchool } from "@/lib/virtuals"
import { Match } from "@/lib/types"

interface VirtualsLivePlayerProps {
    match: Match;
    schools: VirtualSchool[];
    aiStrengths: Record<string, number>;
    userSeed: number;
    simulationProgress: number;
    currentCommentary: string;
    countdown: string | null;
    onClose: () => void;
    onSkip: () => void;
    isSimulating: boolean;
}

export function VirtualsLivePlayer({
    match,
    schools,
    aiStrengths,
    userSeed,
    simulationProgress,
    currentCommentary,
    countdown,
    onClose,
    onSkip,
    isSimulating
}: VirtualsLivePlayerProps) {
    const stage = match.id.split("-")[3] as 'regional' | 'national';
    const regionSlug = match.id.split("-")[4] || 'all';
    const regionName = schools.find(s => s.region.toLowerCase().replace(/\s+/g, '-') === regionSlug)?.region;

    const outcome = simulateMatch(
        parseInt(match.id.split("-")[1]),
        parseInt(match.id.split("-")[2]),
        schools,
        stage,
        regionName,
        aiStrengths,
        userSeed
    );

    const currentRoundIdx = Math.min(4, Math.floor((simulationProgress / 60) * 5));

    // Improved Scoring: Don't show scores during countdown (simulationProgress === 0)
    const roundsToShow = simulationProgress > 0 ? outcome.rounds.slice(0, currentRoundIdx + 1) : [];
    const cumulativeScores = [0, 1, 2].map(sIdx =>
        roundsToShow.reduce((acc, r) => acc + r.scores[sIdx], 0)
    ) as [number, number, number];

    const currentRoundScores = simulationProgress > 0 ? outcome.rounds[currentRoundIdx]?.scores : [0, 0, 0];
    const isFullTime = simulationProgress >= 60;

    const [isSticky, setIsSticky] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsSticky(!entry.isIntersecting);
            },
            { threshold: 0, rootMargin: "-100px 0px 0px 0px" }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="shrink-0 bg-slate-950 border-b border-white/10 relative z-30">
            {/* Sticky Scoreboard Overlay */}
            {isSimulating && (
                <div className={cn(
                    "fixed top-[64px] left-0 right-0 z-[45] bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-2 transition-all duration-500 transform",
                    isSticky ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
                )}>
                    <div className="max-w-xl mx-auto flex items-center justify-between">
                        {outcome.schools.map((school: string, sIdx: number) => {
                            const isLeading = cumulativeScores[sIdx] === Math.max(...cumulativeScores) && cumulativeScores[sIdx] > 0;
                            return (
                                <div key={sIdx} className="flex items-center gap-3 flex-1 justify-center first:justify-start last:justify-end">
                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            "text-xl font-black italic tabular-nums leading-none transition-all",
                                            isLeading ? "text-emerald-400 scale-110" : "text-white"
                                        )}>
                                            {cumulativeScores[sIdx]}
                                        </div>
                                        <span className={cn(
                                            "text-[6px] font-black uppercase tracking-widest mt-0.5 transition-colors",
                                            isLeading ? "text-emerald-400" : "text-white/40"
                                        )}>{school.split(' ').map(w => w[0]).join('')}</span>
                                    </div>
                                    {sIdx < outcome.schools.length - 1 && <div className="text-white/10 font-black italic text-[8px]">VS</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Countdown Overlay */}
            {countdown && (
                <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="px-6 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-8 shadow-2xl shadow-purple-600/20">
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
                    </div>

                    {/* Live Commentary Ticker */}
                    <div className="w-full max-w-lg mb-4 h-6 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-transparent to-emerald-950/80 z-10" />
                        <div className="flex items-center justify-center h-full">
                            <span key={currentCommentary} className="text-[10px] font-bold text-emerald-400/90 italic tracking-wide animate-in slide-in-from-bottom-2 duration-300">
                                {currentCommentary}
                            </span>
                        </div>
                    </div>

                    {/* Only show Close button if simulation is NOT active OR is finished */}
                    {(!isSimulating || isFullTime) && (
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-2 bg-black/20 hover:bg-black/40 text-white/50 hover:text-white rounded-full transition-colors z-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="w-full max-w-4xl px-4 mb-4">
                    <div className="grid grid-cols-3 gap-4 md:gap-8 items-center justify-items-center">
                        {outcome.schools.map((school: string, sIdx: number) => {
                            const isLeading = cumulativeScores[sIdx] === Math.max(...cumulativeScores) && cumulativeScores[sIdx] > 0;
                            const roundPoints = currentRoundScores[sIdx];

                            return (
                                <div key={sIdx} className="flex flex-col items-center gap-2 group w-full text-center">
                                    <div className="flex flex-col items-center min-h-[2.5rem] justify-center">
                                        <span className={cn(
                                            "text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-center leading-tight transition-colors duration-300",
                                            isLeading ? "text-emerald-400" : "text-white/80"
                                        )}>
                                            {school}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 justify-center relative">
                                        <div
                                            key={cumulativeScores[sIdx]}
                                            className={cn(
                                                "text-6xl md:text-8xl font-black italic tabular-nums leading-none transition-all duration-300",
                                                isLeading ? "text-white drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" : "text-white/40 drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]",
                                                "animate-in zoom-in-75 duration-300"
                                            )}
                                        >
                                            {cumulativeScores[sIdx]}
                                        </div>
                                        {/* Hybrid Scoring: Show current round points as small indicator */}
                                        {simulationProgress > 0 && !isFullTime && roundPoints > 0 && (
                                            <span className="text-sm md:text-xl font-black text-emerald-400 animate-bounce absolute translate-x-12 md:translate-x-16 -translate-y-4">
                                                +{roundPoints}
                                            </span>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "h-1 rounded-full my-1 transition-all duration-500",
                                        isLeading ? "bg-emerald-400 w-16 shadow-[0_0_10px_rgba(52,211,153,0.6)]" : "bg-white/10 w-8 group-hover:w-16"
                                    )} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="w-full max-w-xs grid grid-cols-5 gap-1.5 mx-auto mb-4">
                    {outcome.rounds.slice(0, 5).map((r, rIdx) => (
                        <div key={rIdx} className={cn(
                            "flex flex-col items-center p-1.5 rounded-lg border transition-all duration-300",
                            rIdx === currentRoundIdx && simulationProgress > 0 ? "bg-emerald-500/20 border-emerald-400/40 scale-110 shadow-lg" :
                                "bg-black/20 border-white/5 opacity-20"
                        )}>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className={cn("h-full transition-all duration-300", rIdx === currentRoundIdx && simulationProgress > 0 ? "bg-emerald-400 w-full" : "w-0")} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

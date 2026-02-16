
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Timer } from "lucide-react";

interface MatchTimerProps {
    startTime?: string;
    status: string;
    sportType: string;
    metadata?: any;
    className?: string;
    isLive?: boolean;
}

export function MatchTimer({ startTime, status, sportType, metadata, className, isLive }: MatchTimerProps) {
    const [timeDisplay, setTimeDisplay] = useState<string>("");

    useEffect(() => {
        // 1. If not live, show status or start time
        if (status === "upcoming") {
            if (!startTime) {
                setTimeDisplay("TBD");
                return;
            }
            // If startTime is a date string, format it
            const date = new Date(startTime);
            if (!isNaN(date.getTime())) {
                setTimeDisplay(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            } else {
                setTimeDisplay(startTime);
            }
            return;
        }

        if (status === "finished") {
            setTimeDisplay("FT");
            return;
        }

        if (status === "paused" || status === "HT") {
            setTimeDisplay("HT");
            return;
        }

        // 2. Live Logic
        if (status === "live" || isLive) {
            // QUIZ: Just show "LIVE"
            if (sportType === "quiz") {
                setTimeDisplay("LIVE");
                return;
            }

            // SPORTS: Calculate Timer
            const calculateTime = () => {
                // Priority 1: Admin set manual time (e.g. "55'") -> We just show that static or increment?
                // Better: Admin sets "currentMinute" and "lastUpdated".
                // We calculate: currentMinute + (now - lastUpdated)

                if (metadata?.currentMinute !== undefined && metadata?.lastUpdated) {
                    const lastUpdateDate = new Date(metadata.lastUpdated);
                    const now = new Date();
                    const diffInMinutes = Math.floor((now.getTime() - lastUpdateDate.getTime()) / 60000);
                    const totalMinutes = metadata.currentMinute + diffInMinutes;

                    // Cap based on sport? e.g. football max 45+ or 90+
                    setTimeDisplay(`${totalMinutes}'`);
                    return;
                }

                // Priority 2: Calculate from proper scheduledAt/startTime if valid
                if (startTime) {
                    const startDate = new Date(startTime);
                    if (!isNaN(startDate.getTime())) {
                        const now = new Date();
                        const diffInMinutes = Math.floor((now.getTime() - startDate.getTime()) / 60000);

                        // Basic HT adjustment for football (approx 15min break after 45)
                        // This is very rough essentially, but better than nothing if no admin input
                        const displayMin = diffInMinutes;
                        if (sportType === 'football' && diffInMinutes > 45) {
                            // If it's literally continuous time, 50 mins since start = 50'. 
                            // Realistically there's halftime.
                            // Without manual admin 'HT' status, we can't know for sure.
                            // We'll just show raw time difference.
                        }

                        setTimeDisplay(`${Math.max(0, displayMin)}'`);
                    } else {
                        // Fallback text start time (e.g. "14:00") - can't calc diff
                        setTimeDisplay("LIVE");
                    }
                } else {
                    setTimeDisplay("LIVE");
                }
            };

            calculateTime();
            // Update every minute (or second if we want seconds)
            const interval = setInterval(calculateTime, 10000);
            return () => clearInterval(interval);
        }

        setTimeDisplay(status);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startTime, status, sportType, metadata, isLive]);

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            {(status === 'live' || isLive) && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            )}
            <span className={cn(
                "font-bold uppercase tracking-widest",
                (status === 'live' || isLive) ? "text-red-500" : "text-slate-500",
                // Quiz special style
                sportType === 'quiz' && (status === 'live' || isLive) && "animate-pulse"
            )}>
                {timeDisplay}
            </span>
        </div>
    );
}

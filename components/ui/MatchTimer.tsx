
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
    // Use a state to force re-render for live matches
    const [, setTick] = useState(0);

    // Derive display text during render to avoid cascading renders
    let timeDisplay = status;

    if (status === "upcoming") {
        if (!startTime) {
            timeDisplay = "TBD";
        } else {
            const date = new Date(startTime);
            if (!isNaN(date.getTime())) {
                const now = new Date();
                if (date < now) {
                    timeDisplay = "LATE START";
                } else {
                    timeDisplay = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
            } else {
                timeDisplay = startTime;
            }
        }
    } else if (status === "finished") {
        timeDisplay = "FT";
    } else if (status === "paused" || status === "HT") {
        timeDisplay = "HT";
    } else if (status === "live" || isLive) {
        if (sportType === "quiz") {
            timeDisplay = "LIVE";
        } else if (metadata?.currentMinute !== undefined && metadata?.lastUpdated) {
            const lastUpdateDate = new Date(metadata.lastUpdated);
            const now = new Date();
            const diffInMinutes = Math.floor((now.getTime() - lastUpdateDate.getTime()) / 60000);
            timeDisplay = `${metadata.currentMinute + diffInMinutes}'`;
        } else if (startTime) {
            const startDate = new Date(startTime);
            if (!isNaN(startDate.getTime())) {
                const now = new Date();
                const diffInMinutes = Math.floor((now.getTime() - startDate.getTime()) / 60000);

                // Basic HT adjustment for football (approx 15min break after 45)
                // This is very rough essentially, but better than nothing if no admin input
                // Without manual admin 'HT' status, we can't know for sure.
                // We'll just show raw time difference.

                timeDisplay = `${Math.max(0, diffInMinutes)}'`;
            } else {
                timeDisplay = "LIVE";
            }
        } else {
            timeDisplay = "LIVE";
        }
    }

    useEffect(() => {
        if (status === "live" || isLive) {
            const interval = setInterval(() => {
                setTick(t => t + 1);
            }, 10000); // Check every 10s
            return () => clearInterval(interval);
        }
    }, [status, isLive]);

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

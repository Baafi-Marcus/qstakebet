"use client"

import { cn } from "@/lib/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-slate-800/50 relative overflow-hidden", className)}
            {...props}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
    )
}

export function SkeletonMatch() {
    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-14 rounded-xl" />
                    <Skeleton className="h-10 w-14 rounded-xl" />
                    <Skeleton className="h-10 w-14 rounded-xl" />
                </div>
            </div>
        </div>
    )
}

export function SkeletonMarket() {
    return (
        <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        </div>
    )
}

export function SkeletonWallet() {
    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 space-y-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-40" />
            <div className="flex gap-4">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
        </div>
    )
}

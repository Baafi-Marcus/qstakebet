"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshProps {
    children: React.ReactNode
    onRefresh?: () => Promise<void>
    disabled?: boolean
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
    const [startY, setStartY] = useState(0)
    const [pullDistance, setPullDistance] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [canPull, setCanPull] = useState(true)

    const threshold = 80 // Distance to pull before refresh
    const maxPull = 120 // Maximum visual pull distance

    useEffect(() => {
        const handleScroll = () => {
            setCanPull(window.scrollY === 0)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled || !canPull || isRefreshing) return
        setStartY(e.touches[0].pageY)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (disabled || !canPull || isRefreshing) return
        const currentY = e.touches[0].pageY
        const distance = currentY - startY
        if (distance > 0) {
            // Apply resistance
            const pull = Math.min(distance * 0.4, maxPull)
            setPullDistance(pull)
            if (pull > 5) {
                // Prevent default scrolling when pulling
                if (e.cancelable) e.preventDefault()
            }
        }
    }

    const handleTouchEnd = useCallback(async () => {
        if (pullDistance > threshold) {
            setIsRefreshing(true)
            setPullDistance(threshold)

            try {
                if (onRefresh) {
                    await onRefresh()
                } else {
                    // Default behavior: soft refresh or wait a bit
                    await new Promise(resolve => setTimeout(resolve, 1500))
                    window.location.reload()
                }
            } catch (error) {
                console.error("Refresh failed:", error)
            } finally {
                setIsRefreshing(false)
                setPullDistance(0)
            }
        } else {
            setPullDistance(0)
        }
    }, [pullDistance, onRefresh])

    return (
        <div
            className="relative min-h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull Indicator */}
            <div
                className={cn(
                    "absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden transition-all duration-200 pointer-events-none z-50",
                    isRefreshing ? "h-16" : ""
                )}
                style={{ height: isRefreshing ? 64 : pullDistance }}
            >
                <div className={cn(
                    "bg-slate-900 border border-white/10 rounded-full p-2 shadow-2xl flex items-center justify-center transition-transform",
                    pullDistance > threshold ? "scale-110 bg-purple-600/20 border-purple-500/50" : "scale-100"
                )}>
                    <Loader2
                        className={cn(
                            "h-5 w-5 text-purple-500",
                            isRefreshing ? "animate-spin" : ""
                        )}
                        style={{
                            transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
                            opacity: Math.min(pullDistance / threshold, 1)
                        }}
                    />
                </div>
            </div>

            {/* Content with spring effect */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: isRefreshing ? `translateY(0px)` : `translateY(${pullDistance * 0.5}px)`
                }}
            >
                {children}
            </div>
        </div>
    )
}

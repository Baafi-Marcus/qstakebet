"use client"

import React, { useState, useEffect } from "react"
import { X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function PromoModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPromoActive, setIsPromoActive] = useState(false)

    useEffect(() => {
        // Only run on client
        const checkPromo = () => {
            const now = new Date()
            const promoStart = new Date("2026-03-06T00:00:00Z")
            const promoEnd = new Date("2026-03-13T23:59:59Z")

            if (now >= promoStart && now <= promoEnd) {
                setIsPromoActive(true)
                // Check if user has already seen and closed it this session
                const hasSeen = sessionStorage.getItem("ghana_promo_seen_v2")
                if (!hasSeen) {
                    // Small delay so it doesn't instantly jump scare
                    const timer = setTimeout(() => setIsOpen(true), 1500)
                    return () => clearTimeout(timer)
                }
            }
        }

        checkPromo()
    }, [])

    const handleClose = () => {
        setIsOpen(false)
        sessionStorage.setItem("ghana_promo_seen_v2", "true")
    }

    if (!isPromoActive || !isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />
            <div className="relative w-full max-w-[500px] animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Banner Content */}
                <div className="relative aspect-[4/5] md:aspect-square w-full rounded-2xl md:rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.3)] border border-yellow-500/30 group">
                    <Image
                        src="/ghana-promo.png"
                        alt="Ghana Independence Day 100% Deposit Bonus"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />

                    {/* Gradient Overlay for Text Readability at Bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                    {/* Action Button */}
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col items-center justify-end">
                        <Link
                            href="/account/deposit"
                            onClick={handleClose}
                            className="w-full py-4 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black font-black uppercase text-sm tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(234,179,8,0.5)] flex items-center justify-center"
                        >
                            Claim 100% Bonus Now
                        </Link>
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-4 text-center">
                            Promo ends Mar 13, 2026. T&C Apply.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

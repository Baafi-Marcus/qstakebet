"use client"

import React, { useState, useEffect } from "react"
import { XMarkIcon as X, DocumentDuplicateIcon as Copy, CheckIcon as Check, UsersIcon as Users, GiftIcon as Gift, ArrowUpOnSquareIcon as Share2, ViewfinderCircleIcon as Target } from "@heroicons/react/24/solid";
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ReferralSharePopupProps {
    referralCode: string
    isOpen: boolean
    onClose: () => void
}

export function ReferralSharePopup({ referralCode, isOpen, onClose }: ReferralSharePopupProps) {
    const [copied, setCopied] = useState(false)
    const referralLink = `${window.location.origin}/r/${referralCode}`

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-popover w-full max-w-lg rounded-[2.5rem] border border-border shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all z-20"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="relative p-8 pt-12 overflow-hidden">
                    {/* Background Decorative Elements */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 blur-[80px] rounded-full" />

                    <div className="relative z-10 space-y-8 text-center">
                        <div className="space-y-3">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-xl shadow-primary/20 mb-2">
                                <Share2 className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Account created, now share and earn</h2>
                            <p className="text-muted-foreground text-sm font-medium px-4">
                                Your account is ready! Share your unique link below to start earning rewards immediately.
                            </p>
                        </div>

                        {/* Rewards Card */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-muted border border-border/50 space-y-2 text-left">
                                <div className="p-2 w-fit rounded-lg bg-green-500/10 text-green-400">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Registration</div>
                                <div className="text-sm font-black text-foreground">GHS 1.00 <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-normal">Real Cash</span></div>
                                <div className="text-[9px] text-muted-foreground font-medium">For every registration</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted border border-border/50 space-y-2 text-left">
                                <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400">
                                    <Target className="h-4 w-4" />
                                </div>
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">10 Clicks</div>
                                <div className="text-sm font-black text-foreground">GHS 2.00 <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-normal">Free Bet</span></div>
                                <div className="text-[9px] text-muted-foreground font-medium">When 10 unique people click</div>
                            </div>
                        </div>

                        {/* Link Box */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block">Your Referral Link</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-muted border border-border rounded-2xl px-5 py-4 text-muted-foreground font-mono text-xs truncate flex items-center">
                                    {referralLink}
                                </div>
                                <Button
                                    onClick={handleCopy}
                                    className={cn(
                                        "h-[52px] px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                                        copied ? "bg-green-600 hover:bg-green-500" : "bg-primary hover:bg-primary"
                                    )}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
                                </Button>
                            </div>
                        </div>

                        <div className="pt-4 pb-2">
                            <button
                                onClick={onClose}
                                className="text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors"
                            >
                                I&apos;ll share later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

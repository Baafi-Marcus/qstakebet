"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { XMarkIcon as X, ArrowDownTrayIcon as Download, ShareIcon as Share, PlusIcon as Plus, Bars3Icon as Menu } from "@heroicons/react/24/solid"

type Platform = "ios" | "android" | "desktop"

const DISMISS_KEY = "qsb-install-dismissed"

function detectPlatform(): Platform {
    if (typeof navigator === "undefined") return "desktop"
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    const isAndroid = /Android/.test(ua)
    return isIOS ? "ios" : isAndroid ? "android" : "desktop"
}

export function InstallPrompt() {
    const pathname = usePathname()
    const [visible, setVisible] = useState(false)
    const [platform, setPlatform] = useState<Platform>("desktop")
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        if (pathname.startsWith("/admin")) return

        let dismissed = false
        try {
            dismissed = localStorage.getItem(DISMISS_KEY) === "1"
        } catch { }

        const standalone =
            window.matchMedia?.("(display-mode: standalone)").matches ||
            window.matchMedia?.("(display-mode: fullscreen)").matches ||
            (navigator as any).standalone === true

        if (dismissed || standalone) return

        const onBeforeInstall = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }
        window.addEventListener("beforeinstallprompt", onBeforeInstall)

        const timer = setTimeout(() => {
            setPlatform(detectPlatform())
            setVisible(true)
        }, 3500)

        return () => {
            clearTimeout(timer)
            window.removeEventListener("beforeinstallprompt", onBeforeInstall)
        }
    }, [pathname])

    useEffect(() => {
        if (!visible) return
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = ""
        }
    }, [visible])

    if (!visible || pathname.startsWith("/admin")) return null

    const dismiss = () => {
        setVisible(false)
        try {
            localStorage.setItem(DISMISS_KEY, "1")
        } catch { }
    }

    const installNative = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        await deferredPrompt.userChoice.catch(() => { })
        setDeferredPrompt(null)
        dismiss()
    }

    const steps: { title: string; body: string; icon: React.ReactNode }[] =
        platform === "ios"
            ? [
                { title: "Tap the Share button", body: "At the bottom of Safari", icon: <Share className="h-4 w-4" /> },
                { title: 'Choose "Add to Home Screen"', body: "Scroll down the share menu to find it", icon: <Plus className="h-4 w-4" /> },
                { title: "Tap Add", body: "QSTAKEbet lands right on your home screen like an app", icon: <Download className="h-4 w-4" /> },
            ]
            : platform === "android"
                ? [
                    { title: "Open the browser menu", body: "The ⋮ three-dot menu at the top-right of Chrome", icon: <Menu className="h-4 w-4" /> },
                    { title: 'Tap "Add to Home screen"', body: 'Or "Install app" depending on your browser', icon: <Plus className="h-4 w-4" /> },
                    { title: "Confirm Install", body: "QSTAKEbet appears in your apps, one tap away", icon: <Download className="h-4 w-4" /> },
                ]
                : [
                    { title: "Look at the address bar", body: "Click the install icon on the right side of it", icon: <Download className="h-4 w-4" /> },
                    { title: "Click Install", body: "QSTAKEbet opens in its own window like a desktop app", icon: <Plus className="h-4 w-4" /> },
                ]

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-6">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={dismiss}
            />
            <div className="relative w-full sm:max-w-md bg-slate-950 border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 pb-8 shadow-2xl shadow-black/60">
                <button
                    onClick={dismiss}
                    aria-label="Dismiss"
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon.png" alt="QSTAKEbet" className="w-12 h-12 rounded-2xl border border-white/10" />
                    <div>
                        <h2 className="font-extrabold text-white text-lg leading-tight">Add QSTAKEbet to your Home Screen</h2>
                        <p className="text-xs text-slate-400 mt-0.5">One tap away, no app store needed</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {steps.map((step, i) => (
                        <div key={step.title} className="flex items-start gap-3 bg-slate-900 border border-white/5 rounded-2xl px-4 py-3">
                            <div className="shrink-0 h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-xs">
                                {i + 1}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                                    {step.title}
                                    <span className="text-primary">{step.icon}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">{step.body}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {deferredPrompt && (
                    <button
                        onClick={installNative}
                        className="w-full py-3.5 mb-3 bg-primary hover:bg-primary/90 text-white text-sm font-black uppercase tracking-wider rounded-2xl transition-standard hover:-translate-y-0.5 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Download className="h-5 w-5" />
                        Install Now
                    </button>
                )}

                <button
                    onClick={dismiss}
                    className="w-full py-3 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
                >
                    Maybe later
                </button>
            </div>
        </div>
    )
}

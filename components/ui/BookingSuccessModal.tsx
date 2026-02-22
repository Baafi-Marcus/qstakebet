
"use client"
import React from "react"
import Image from "next/image"
import { X, Copy, Share2, Download, Send, Activity, Info, Loader2, MessageCircle, Twitter, Share, Search } from "lucide-react"
import { toPng } from 'html-to-image'
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface BookingSuccessModalProps {
    code: string
    selections: any[]
    totalOdds: number
    onClose: () => void
}

export function BookingSuccessModal({ code, selections, totalOdds, onClose }: BookingSuccessModalProps) {
    const [isDownloading, setIsDownloading] = React.useState(false)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [currentTime] = React.useState(new Date())

    // Generate preview image on mount
    React.useEffect(() => {
        if (!code || !contentRef.current) return;
        const generatePreview = async () => {
            if (contentRef.current) {
                try {
                    // Small delay to ensure rendering is complete
                    await new Promise(r => setTimeout(r, 100));
                    const dataUrl = await toPng(contentRef.current, {
                        quality: 0.5,
                        pixelRatio: 1,
                        backgroundColor: '#0f172a',
                    })
                    setPreviewUrl(dataUrl)
                } catch (err) {
                    console.error("Preview generation failed")
                }
            }
        }
        generatePreview()
    }, [code])

    if (!code) return null

    const handleDownloadImage = async () => {
        if (!contentRef.current) return
        setIsDownloading(true)
        try {
            // Wait a small bit for fonts/styles to sync
            const dataUrl = await toPng(contentRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#0f172a', // slate-900 background to ensure dark theme looks right in saved image
            })
            const link = document.createElement('a')
            link.download = `qstake-booking-${code}.png`
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error("Failed to capture image:", error)
            alert("Could not save image. Try taking a screenshot instead.")
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div
                ref={contentRef}
                className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-black italic tracking-tighter text-2xl">QSTAKE</span>
                        <span className="bg-white/20 text-[10px] text-white px-1.5 rounded font-bold uppercase">Booking</span>
                    </div>
                    <button onClick={onClose} className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex gap-6 mb-8 items-start">
                    {/* Ticket Preview Thumbnail */}
                    <div className="relative group flex-shrink-0">
                        <div className="w-32 h-44 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg relative cursor-zoom-in">
                            {previewUrl ? (
                                <Image
                                    src={previewUrl}
                                    alt="Ticket Preview"
                                    fill
                                    unoptimized
                                    className="object-cover opacity-60 group-hover:opacity-100 transition-all"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 text-slate-600 animate-spin" />
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-100 group-hover:opacity-0 transition-opacity">
                                <Search className="h-8 w-8 text-white/50" />
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                            {format(currentTime, "dd/MM/yyyy HH:mm")}
                        </p>
                    </div>

                    {/* Booking Info */}
                    <div className="flex-1 text-left pt-2">
                        <h2 className="text-slate-400 text-xs font-black uppercase tracking-[0.1em] mb-1">Booking Code</h2>
                        <div className="flex items-center gap-3 mb-4 group cursor-pointer"
                            onClick={() => {
                                navigator.clipboard.writeText(code)
                                alert("Code copied!")
                            }}>
                            <span className="text-4xl font-black text-white tracking-widest font-mono group-hover:text-primary transition-colors">{code}</span>
                            <Copy className="h-5 w-5 text-slate-500 group-hover:text-primary" />
                        </div>

                        <button className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors">
                            <span className="text-lg font-black uppercase tracking-tight">Load Code</span>
                            <div className="p-1 bg-green-500/10 rounded">
                                <Share className="h-4 w-4" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Social Sharing Grid */}
                <div className="grid grid-cols-5 gap-3 mb-10">
                    {/* Download Image */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={handleDownloadImage}
                            disabled={isDownloading}
                            className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 disabled:opacity-50"
                        >
                            {isDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">Save<br />Image</span>
                    </div>

                    {/* Copy Link */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`https://qstakebet.com/book/${code}`)
                                alert("Link copied!")
                            }}
                            className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">Copy<br />Link</span>
                    </div>

                    {/* X (Twitter) */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out my bet on QSTAKE! Booking Code: ${code}&url=https://qstakebet.com/book/${code}`)}
                            className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                        >
                            <Twitter className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">X</span>
                    </div>

                    {/* Telegram */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => window.open(`https://t.me/share/url?url=https://qstakebet.com/book/${code}&text=Check out my bet on QSTAKE! Booking Code: ${code}`)}
                            className="w-12 h-12 bg-blue-500 hover:bg-blue-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">Telegram</span>
                    </div>

                    {/* WhatsApp */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => window.open(`https://wa.me/?text=Check out my bet on QSTAKE! Booking Code: ${code} - https://qstakebet.com/book/${code}`)}
                            className="w-12 h-12 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                        >
                            <MessageCircle className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">WhatsApp</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-4 rounded-xl font-black uppercase tracking-widest bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-white/5"
                >
                    Return to Betslip
                </button>
            </div>

            {/* Hidden Capture Area (Inspired by Professional Betting Slips) */}
            <div className="fixed top-[-9999px] left-[-9999px]">
                <div
                    ref={contentRef}
                    className="w-[450px] bg-[#0f1115] text-white flex flex-col font-sans relative overflow-hidden"
                >
                    {/* Brand Header */}
                    <div className="bg-[#e11d48] px-6 py-4 flex items-center justify-between border-b border-black/10">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-black italic tracking-tighter text-2xl">QSTAKE</span>
                            <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Official Booking</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase opacity-60">Generated on</div>
                            <div className="text-[11px] font-mono font-bold leading-none">{format(currentTime, "dd/MM/yyyy HH:mm")}</div>
                        </div>
                    </div>

                    {/* Booking Code Section (High Impact) */}
                    <div className="bg-[#1a1c23] px-8 py-10 text-center relative">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Booking Code</div>
                        <div className="text-7xl font-black text-[#10b981] tracking-[0.15em] font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{code}</div>

                        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                            <div className="text-left">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Odds</div>
                                <div className="text-2xl font-black text-white">{totalOdds.toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</div>
                                <div className="inline-flex px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-wider">Pending Confirmation</div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="px-8 py-6 bg-[#0f1115]">
                        <div className="bg-[#1a1c23]/50 rounded-2xl border border-white/5 p-5 space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <span>Total Stake</span>
                                <span className="text-white font-black">GHS 100.00</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <span>Potential Payout</span>
                                <span className="text-white font-black">GHS {(100 * totalOdds).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-lg">
                                <span>Max Bonus Appliable</span>
                                <span className="font-black">GHS 250.00</span>
                            </div>
                        </div>
                    </div>

                    {/* Selections Section */}
                    <div className="px-8 pb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 h-[1px] bg-white/5"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-black/20 px-3 py-1 rounded-full">Your Selections ({selections.length})</span>
                            <div className="flex-1 h-[1px] bg-white/5"></div>
                        </div>

                        <div className="space-y-4">
                            {selections.map((s, i) => (
                                <div key={i} className="group flex flex-col gap-1 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-0.5">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Football / GHANA PREMIER LEAGUE</div>
                                            <div className="text-sm font-bold text-white tracking-tight">{s.matchLabel}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-emerald-500 font-mono italic">{s.odds.toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Market</span>
                                            <span className="text-[11px] font-black text-slate-300">Match Winner (1X2)</span>
                                        </div>
                                        <div className="flex flex-col border-l border-white/5 pl-4">
                                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Selection</span>
                                            <span className="text-[11px] font-black text-white">{s.label}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Footer */}
                    <div className="bg-[#1a1c23] px-8 py-6 text-center border-t border-white/5">
                        <div className="mb-4 flex flex-col items-center">
                            <div className="w-16 h-1 bg-emerald-500/20 rounded-full mb-3 shrink-0"></div>
                            <p className="text-[10px] text-slate-400 font-medium max-w-[300px] leading-relaxed">
                                This booking code is valid for 24 hours. Odds are dynamic and may change before actual placement.
                                <br /> Visit <span className="text-white font-bold tracking-tight italic uppercase">qstakebet.com</span> to load and play.
                            </p>
                        </div>
                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                            © 2026 QSTAKE GAMING TECHNOLOGY LIMITED. ALL RIGHTS RESERVED.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

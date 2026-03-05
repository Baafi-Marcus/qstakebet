
"use client"
import React from "react"
import Image from "next/image"
import { X, Copy, Share2, Download, Send, Activity, Info, Loader2, MessageCircle, Twitter, Share, Search, Trophy, Dribbble, Maximize2 } from "lucide-react"
import { toJpeg } from 'html-to-image'
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface BookingSuccessModalProps {
    code: string
    selections: any[]
    totalOdds: number
    onClose: () => void
    onLoadCode?: (code: string) => void
}

export function BookingSuccessModal({ code, selections, totalOdds, onClose, onLoadCode }: BookingSuccessModalProps) {
    const [isDownloading, setIsDownloading] = React.useState(false)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const modalRef = React.useRef<HTMLDivElement>(null)
    const captureRef = React.useRef<HTMLDivElement>(null)
    const [currentTime] = React.useState(new Date())

    // Generate preview image on mount
    React.useEffect(() => {
        if (!code) return;
        const generatePreview = async () => {
            // Wait for both refs to be available and rendering to settle
            await new Promise(r => setTimeout(r, 500));
            if (captureRef.current) {
                try {
                    const dataUrl = await toJpeg(captureRef.current, {
                        quality: 0.9,
                        pixelRatio: 1.5,
                        backgroundColor: '#0f1115',
                    })
                    setPreviewUrl(dataUrl)
                } catch (err) {
                    console.error("Preview generation failed", err)
                }
            }
        }
        generatePreview()
    }, [code])

    if (!code) return null

    const handleDownloadImage = async () => {
        if (!captureRef.current) return
        setIsDownloading(true)
        try {
            // Increased delay and ensuring fonts/images are ready
            await new Promise(r => setTimeout(r, 600));

            // Higher resolution for better quality
            const pixelRatio = 3;
            const dataUrl = await toJpeg(captureRef.current, {
                quality: 1.0,
                pixelRatio,
                backgroundColor: '#0f1115',
            })

            // Check if it's mobile and supports native sharing (better for "Save to Gallery")
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile && navigator.share && navigator.canShare) {
                try {
                    // Convert dataUrl to a blob/file for sharing
                    const response = await fetch(dataUrl);
                    const blob = await response.blob();
                    const file = new File([blob], `qstake-ticket-${code}.jpg`, { type: 'image/jpeg' });

                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'QSTAKE Ticket',
                            text: `Check out my QSTAKE bet! Code: ${code}`
                        });
                        setIsDownloading(false);
                        return;
                    }
                } catch (shareErr) {
                    console.log("Native share failed or cancelled", shareErr);
                    // Fallback to traditional download if share fails
                }
            }

            // Desktop Fallback / Traditional Download
            const link = document.createElement('a')
            link.download = `qstake-booking-${code}.jpg`
            link.href = dataUrl
            link.click()

            if (isMobile) {
                alert("If the download didn't start, please long-press the preview image to save it to your phone.");
            }
        } catch (error) {
            console.error("Failed to capture image:", error)
            alert("Could not save image. Try taking a screenshot instead.")
        } finally {
            setIsDownloading(false)
        }
    }

    const openPreviewInNewTab = () => {
        if (!previewUrl) return;
        const newTab = window.open();
        if (newTab) {
            newTab.document.write(`<img src="${previewUrl}" style="max-width:100%; height:auto;" />`);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div
                ref={modalRef}
                className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
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
                        <div
                            className="w-32 h-44 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg relative cursor-zoom-in"
                            onClick={openPreviewInNewTab}
                        >
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
                                <Maximize2 className="h-8 w-8 text-white/50" />
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

                        <button
                            onClick={() => onLoadCode?.(code)}
                            className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
                        >
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
                                navigator.clipboard.writeText(`https://qstakebet.vercel.app/book/${code}`)
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
                            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out my bet on QSTAKE! Booking Code: ${code}&url=https://qstakebet.vercel.app/book/${code}`)}
                            className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                        >
                            <Twitter className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">X</span>
                    </div>

                    {/* Telegram */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => window.open(`https://t.me/share/url?url=https://qstakebet.vercel.app/book/${code}&text=Check out my bet on QSTAKE! Booking Code: ${code}`)}
                            className="w-12 h-12 bg-blue-500 hover:bg-blue-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">Telegram</span>
                    </div>

                    {/* WhatsApp */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => window.open(`https://wa.me/?text=Check out my bet on QSTAKE! Booking Code: ${code} - https://qstakebet.vercel.app/book/${code}`)}
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
            <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
                <div
                    ref={captureRef}
                    className="w-[350px] bg-[#0f1115] text-white flex flex-col font-sans relative overflow-hidden"
                >
                    {/* Brand Header */}
                    <div className="bg-[#e11d48] px-5 py-3 flex items-center justify-between border-b border-black/10">
                        <div className="flex items-center gap-1.5">
                            <span className="text-white font-black italic tracking-tighter text-xl">QSTAKEbet</span>
                            <div className="bg-white/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">OFFICIAL</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] font-black uppercase opacity-60 leading-none mb-0.5">Booking Date</div>
                            <div className="text-[10px] font-mono font-bold leading-none">{format(currentTime, "dd/MM/yy HH:mm")}</div>
                        </div>
                    </div>

                    {/* Booking Code Section (High Impact) */}
                    <div className="bg-[#1a1c23] px-6 py-8 text-center relative border-b border-white/5">
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Booking Code</div>
                        <div className="text-6xl font-black text-[#10b981] tracking-[0.1em] font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{code}</div>

                        <div className="mt-6 flex items-center justify-center gap-8">
                            <div className="text-center">
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Odds</div>
                                <div className="text-lg font-black text-white px-3 py-0.5 bg-white/5 rounded-full border border-white/10">{totalOdds.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Games</div>
                                <div className="text-lg font-black text-white">{selections.length}</div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="px-6 py-4 bg-[#0f1115]">
                        <div className="bg-[#1a1c23]/50 rounded-xl border border-white/5 p-4 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Suggested Stake</span>
                                <span className="text-white font-black">GHS 10.00</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Potential Payout</span>
                                <span className="text-white font-black">GHS {(10 * totalOdds).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Selections Section */}
                    <div className="px-6 pb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 h-[1px] bg-white/5"></div>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Selections List</span>
                            <div className="flex-1 h-[1px] bg-white/5"></div>
                        </div>

                        <div className="space-y-4">
                            {selections.map((s, i) => (
                                <div key={i} className="flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-2">
                                            {/* Sport Icon (Dynamic) */}
                                            <div className="mt-0.5 p-1 bg-white/5 rounded">
                                                <Trophy className="h-3 w-3 text-purple-400" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                                    {s.tournamentName || s.stage || "Tournament"}
                                                </div>
                                                <div className="text-xs font-bold text-white tracking-tight uppercase">{s.matchLabel}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-emerald-500 font-mono italic">{s.odds.toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Market</span>
                                            <span className="text-[10px] font-black text-slate-300">{s.marketName || "Match Winner"}</span>
                                        </div>
                                        <div className="flex flex-col border-l border-white/5 pl-4">
                                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Selection</span>
                                            <span className="text-[10px] font-black text-white uppercase">{s.label}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Footer */}
                    <div className="bg-[#1a1c23] px-6 py-4 text-center border-t border-white/5">
                        <div className="mb-3 flex flex-col items-center">
                            <div className="w-12 h-1 bg-emerald-500/20 rounded-full mb-2 shrink-0"></div>
                            <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                                Odds are dynamic and may change.
                                <br /> Play at <span className="text-white font-bold tracking-tight italic uppercase">qstakebet.vercel.app</span>
                            </p>
                        </div>
                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">
                            © 2026 QSTAKEbet · Official Ticket
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

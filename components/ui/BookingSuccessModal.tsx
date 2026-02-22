
"use client"
import React from "react"
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
                                <img src={previewUrl} alt="Ticket Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
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

            {/* Hidden Capture Area (Optimized for Image Saving) */}
            <div className="fixed top-[-9999px] left-[-9999px]">
                <div
                    ref={contentRef}
                    className="w-[400px] bg-slate-900 overflow-hidden"
                >
                    {/* Header for saved image */}
                    <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-black italic tracking-tighter text-2xl">QSTAKE</span>
                            <span className="bg-white/20 text-[10px] text-white px-1.5 rounded font-bold uppercase">Booking</span>
                        </div>
                        <span className="text-white/50 text-[10px] font-bold">{format(currentTime, "dd/MM/yyyy HH:mm")}</span>
                    </div>

                    <div className="p-8 flex flex-col items-center">
                        <h2 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Booking Code</h2>
                        <span className="text-6xl font-black text-white tracking-widest font-mono mb-4">{code}</span>

                        <div className="grid grid-cols-2 gap-4 w-full mb-6">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1 text-center">Stake</span>
                                <span className="text-xl font-black text-white block text-center">GHS 100.00</span>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center">
                                <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Odds</span>
                                <span className="text-xl font-black text-white">{totalOdds.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="w-full space-y-2 mb-6">
                            {selections.slice(0, 3).map((s, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                                    <span className="text-slate-400 truncate max-w-[150px]">{s.matchLabel}</span>
                                    <span className="text-white font-bold">{s.odds.toFixed(2)}</span>
                                </div>
                            ))}
                            {selections.length > 3 && (
                                <div className="text-center text-slate-500 text-[9px] font-bold italic">
                                    + {selections.length - 3} more selections
                                </div>
                            )}
                        </div>

                        <p className="text-[9px] text-slate-600 text-center font-medium leading-relaxed">
                            Generated on qstakebet.com. Odds subject to change. Share and play together!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

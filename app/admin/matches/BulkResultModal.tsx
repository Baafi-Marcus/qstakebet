"use client"

import { useState } from "react"
import { X, Upload, Sparkles, Loader2, CheckCircle, XCircle } from "lucide-react"
import { parseResults, bulkUpdateResults } from "@/lib/admin-actions"

interface BulkResultModalProps {
    onClose: () => void
    onSuccess: () => void
}

export function BulkResultModal({ onClose, onSuccess }: BulkResultModalProps) {
    const [inputText, setInputText] = useState("")
    const [parsing, setParsing] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [parsedResults, setParsedResults] = useState<Array<{
        team1: string
        team2: string
        score1?: number
        score2?: number
        winner: string
        rawText: string
        footballDetails?: Record<string, { ht: number, ft: number }>
        metadata?: Record<string, any>
    }> | null>(null)
    const [updateResults, setUpdateResults] = useState<Array<{
        rawText: string
        status: "success" | "error"
        message: string
    }> | null>(null)
    const [error, setError] = useState("")

    const handleParse = async () => {
        if (!inputText.trim()) {
            setError("Please enter match results")
            return
        }

        setParsing(true)
        setError("")

        try {
            const result = await parseResults(inputText)

            if (result.success && result.results.length > 0) {
                setParsedResults(result.results)
            } else {
                setError("No results could be parsed. Try a different format.")
            }
        } catch {
            setError("Failed to parse results. Please check the format.")
        } finally {
            setParsing(false)
        }
    }

    const handleSubmit = async () => {
        if (!parsedResults || parsedResults.length === 0) return

        setSubmitting(true)
        setError("")

        try {
            const result = await bulkUpdateResults(parsedResults)

            if (result.success) {
                setUpdateResults(result.results)
                // If all successful, close after a delay
                if (result.results.every(r => r.status === "success")) {
                    setTimeout(() => {
                        onSuccess()
                        onClose()
                    }, 2000)
                }
            } else {
                setError(result.error || "Failed to update results")
            }
        } catch {
            setError("An error occurred while updating")
        } finally {
            setSubmitting(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            setInputText(text)
        }
        reader.readAsText(file)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/10 flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                        Bulk Result Entry (AI-Powered)
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {!parsedResults && !updateResults && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Paste Match Results
                                </label>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Example formats:&#10;PRESEC 3 - 1 Achimota&#10;Mfantsipim won against Wesley Girls 2-0&#10;St. Augustine's vs Adisadel: 1-1 (St. Augustine's won on penalties)"
                                    className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono text-sm resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all cursor-pointer">
                                    <Upload className="h-4 w-4" />
                                    Upload File (.txt)
                                    <input
                                        type="file"
                                        accept=".txt,.csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                                <button
                                    onClick={handleParse}
                                    disabled={parsing || !inputText.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {parsing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Parsing with AI...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            Parse with AI
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {parsedResults && !updateResults && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">
                                    Parsed Results ({parsedResults.length})
                                </h3>
                                <button
                                    onClick={() => {
                                        setParsedResults(null)
                                        setInputText("")
                                    }}
                                    className="text-sm text-slate-400 hover:text-white"
                                >
                                    Start Over
                                </button>
                            </div>

                            <div className="space-y-2">
                                {parsedResults.map((result, i) => (
                                    <div key={i} className="p-4 bg-black/20 border border-white/10 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-semibold">
                                                {result.team1} vs {result.team2}
                                            </span>
                                            {result.score1 !== undefined && (
                                                <span className="text-slate-400 font-mono">
                                                    {result.score1} - {result.score2}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-green-400">
                                            Winner: {result.winner}
                                        </div>
                                        {result.footballDetails && (
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {Object.entries(result.footballDetails).map(([school, stats]) => (
                                                    <div key={school} className="text-[10px] bg-white/5 p-1.5 rounded border border-white/5">
                                                        <div className="text-slate-500 uppercase font-bold truncate">{school}</div>
                                                        <div className="text-white">HT: {stats.ht} | FT: {stats.ft}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {result.metadata?.outcomes && Object.keys(result.metadata.outcomes).length > 0 && (
                                            <div className="mt-2 text-[10px] text-purple-400 font-medium">
                                                AI Resolved Markets: {Object.keys(result.metadata.outcomes).join(", ")}
                                            </div>
                                        )}
                                        <div className="text-xs text-slate-500 mt-2 italic border-t border-white/5 pt-1">
                                            &quot;{result.rawText}&quot;
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating & Settling Bets...
                                    </>
                                ) : (
                                    `Submit ${parsedResults.length} Results`
                                )}
                            </button>
                        </div>
                    )}

                    {updateResults && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">
                                Update Results
                            </h3>

                            <div className="space-y-2">
                                {updateResults.map((result, i) => (
                                    <div key={i} className={`p-4 border rounded-lg ${result.status === "success"
                                        ? "bg-green-500/10 border-green-500/20"
                                        : "bg-red-500/10 border-red-500/20"
                                        }`}>
                                        <div className="flex items-start gap-3">
                                            {result.status === "success" ? (
                                                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <div className={`font-medium ${result.status === "success" ? "text-green-400" : "text-red-400"
                                                    }`}>
                                                    {result.message}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {result.rawText}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    onSuccess()
                                    onClose()
                                }}
                                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

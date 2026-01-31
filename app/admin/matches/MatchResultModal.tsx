"use client"

import { useState } from "react"
import { X, Trophy, Loader2 } from "lucide-react"
import { updateMatchResult } from "@/lib/admin-actions"

interface MatchResultModalProps {
    match: {
        id: string
        participants: Array<{
            schoolId: string
            name: string
        }>
    }
    onClose: () => void
    onSuccess: () => void
}

export function MatchResultModal({ match, onClose, onSuccess }: MatchResultModalProps) {
    const [scores, setScores] = useState<{ [key: string]: number }>({})
    const [winner, setWinner] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!winner) {
            setError("Please select a winner")
            return
        }

        setLoading(true)

        try {
            const result = await updateMatchResult(match.id, {
                scores,
                winner,
                status: "finished"
            })

            if (result.success) {
                onSuccess()
                onClose()
            } else {
                setError(result.error || "Failed to save result")
            }
        } catch {
            setError("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                        Enter Match Result
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Scores */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-300">
                            Scores (Optional)
                        </label>
                        {match.participants.map((participant) => (
                            <div key={participant.schoolId} className="flex items-center gap-3">
                                <span className="flex-1 text-white">{participant.name}</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={scores[participant.schoolId] || ""}
                                    onChange={(e) => setScores({
                                        ...scores,
                                        [participant.schoolId]: parseInt(e.target.value) || 0
                                    })}
                                    className="w-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Winner Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Winner *
                        </label>
                        <div className="space-y-2">
                            {match.participants.map((participant) => (
                                <label
                                    key={participant.schoolId}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${winner === participant.schoolId
                                        ? "bg-purple-500/20 border-purple-500"
                                        : "bg-black/20 border-white/10 hover:border-white/20"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="winner"
                                        value={participant.schoolId}
                                        checked={winner === participant.schoolId}
                                        onChange={(e) => setWinner(e.target.value)}
                                        className="text-purple-500"
                                    />
                                    <span className="text-white font-medium">{participant.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save & Settle Bets"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

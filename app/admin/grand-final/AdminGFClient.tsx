"use client"

import { useState } from "react"
import { lockGrandFinalPredictions, calculateGrandFinalScores } from "@/lib/admin-actions"
import { Lock, Calculator, Loader2 } from "lucide-react"

export default function AdminGFClient() {
    const [isLocking, setIsLocking] = useState(false)
    const [isScoring, setIsScoring] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleLock = async () => {
        if (!confirm("Are you sure you want to lock all Grand Final predictions globally? Users will not be able to change predictions after this.")) return

        setIsLocking(true)
        setMessage(null)
        const res = await lockGrandFinalPredictions()
        setIsLocking(false)

        if (res.success) {
            setMessage({ type: "success", text: res.message || "Predictions locked." })
        } else {
            setMessage({ type: "error", text: res.error || "Failed to lock predictions." })
        }
    }

    const handleCalculate = async () => {
        if (!confirm("Are you sure you want to trigger Grand Final scoring? This will process all users and calculate points based on the settled Grand Final match result (winner, runner-up, scores).")) return

        setIsScoring(true)
        setMessage(null)
        const res = await calculateGrandFinalScores()
        setIsScoring(false)

        if (res.success) {
            setMessage({ type: "success", text: res.message || "Scores calculated successfully." })
        } else {
            setMessage({ type: "error", text: res.error || "Failed to calculate scores." })
        }
    }

    return (
        <div className="space-y-8 text-white">
            {message && (
                <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-card border border-border p-6 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Lock className="w-5 h-5 text-rose-500" /> Lock Predictions
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1 mb-4">
                            Manually lock all Grand Final predictions. This is an override if the global deadline fails or if you want to lock early.
                        </p>
                    </div>
                    <button
                        onClick={handleLock}
                        disabled={isLocking}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {isLocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {isLocking ? "Locking..." : "Lock All Predictions"}
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-emerald-500" /> Calculate Scores
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1 mb-4">
                            Trigger the scoring engine for the Grand Final. This will read the settled Final match result from the database (scores, champion, and runner-up), evaluate user predictions, apply the selected 2x boost, and award points.
                        </p>
                    </div>
                    <button
                        onClick={handleCalculate}
                        disabled={isScoring}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {isScoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                        {isScoring ? "Calculating..." : "Trigger Scoring"}
                    </button>
                </div>
            </div>
        </div>
    )
}

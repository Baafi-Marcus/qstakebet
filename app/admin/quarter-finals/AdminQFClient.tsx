"use client"

import { useState } from "react"
import { lockQuarterFinalPredictions, calculateQuarterFinalScores, setQuarterFinalMatchesTime } from "@/lib/admin-actions"
import { Lock, Calculator, Clock, Loader2 } from "lucide-react"

export default function AdminQFClient() {
    const [isLocking, setIsLocking] = useState(false)
    const [isScoring, setIsScoring] = useState(false)
    const [isSettingTime, setIsSettingTime] = useState(false)
    const [newTime, setNewTime] = useState("")
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleLock = async () => {
        if (!confirm("Are you sure you want to lock all Quarter-Final predictions globally? Users will not be able to change their predictions after this.")) return

        setIsLocking(true)
        setMessage(null)
        const res = await lockQuarterFinalPredictions()
        setIsLocking(false)

        if (res.success) {
            setMessage({ type: "success", text: res.message || "Predictions locked." })
        } else {
            setMessage({ type: "error", text: res.error || "Failed to lock predictions." })
        }
    }

    const handleCalculate = async () => {
        if (!confirm("Are you sure you want to trigger Quarter-Final scoring? This will process all users and calculate points based on finished matches.")) return

        setIsScoring(true)
        setMessage(null)
        const res = await calculateQuarterFinalScores()
        setIsScoring(false)

        if (res.success) {
            setMessage({ type: "success", text: res.message || "Scores calculated successfully." })
        } else {
            setMessage({ type: "error", text: res.error || "Failed to calculate scores." })
        }
    }

    const handleSetTime = async () => {
        if (!newTime) return
        if (!confirm("Reschedule ALL Quarter-Final contests to the selected date/time? Start time, prediction deadline and contest status will update for all 9 contests.")) return

        setIsSettingTime(true)
        setMessage(null)
        const res = await setQuarterFinalMatchesTime({ startTime: newTime })
        setIsSettingTime(false)

        if (res.success) {
            setMessage({ type: "success", text: res.message || "Contest times updated." })
        } else {
            setMessage({ type: "error", text: res.error || "Failed to update contest times." })
        }
    }

    return (
        <div className="space-y-8">
            {message && (
                <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-card border border-border p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">Reschedule All QF Contests</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Pick one kickoff time and apply it to all 9 Quarter-Final contests in a single click. This updates
                            the start time, the prediction deadline and every contest&apos;s status.
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                            <input
                                type="datetime-local"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary/50"
                            />
                            <button
                                onClick={handleSetTime}
                                disabled={isSettingTime || !newTime}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSettingTime ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                                {isSettingTime ? "Applying..." : "Apply to All 9 Contests"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Lock className="w-5 h-5 text-rose-500" /> Lock Predictions
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1 mb-4">
                            Manually lock all Quarter-Final predictions. This is an override if the global deadline fails or if you want to lock early.
                        </p>
                    </div>
                    <button
                        onClick={handleLock}
                        disabled={isLocking}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
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
                            Trigger the scoring engine for the Quarter-Finals. This will fetch all finished Quarter-Final matches and award points to users (including Wildcard and Master Pick bonuses).
                        </p>
                    </div>
                    <button
                        onClick={handleCalculate}
                        disabled={isScoring}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {isScoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                        {isScoring ? "Calculating..." : "Trigger Scoring"}
                    </button>
                </div>
            </div>
        </div>
    )
}

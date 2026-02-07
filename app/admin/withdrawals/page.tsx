"use client"

import { AlertCircle, Zap } from "lucide-react"
import Link from "next/link"

export default function AdminWithdrawalsPage() {
    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Withdrawal Management</h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Automated via Paystack</p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-500/20 rounded-2xl">
                        <Zap className="h-8 w-8 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">Automated Withdrawals Active</h2>
                        <p className="text-sm text-purple-300 font-bold">Powered by Paystack Transfer API</p>
                    </div>
                </div>

                <div className="space-y-4 text-sm text-slate-300">
                    <p className="font-bold">
                        Withdrawals are now processed automatically through Paystack. When users request a withdrawal:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>System validates balance (min 1 GHS, max 1,000 GHS)</li>
                        <li>Funds are locked in user&apos;s wallet</li>
                        <li>Paystack creates a transfer recipient</li>
                        <li>Transfer is initiated to user&apos;s MoMo account</li>
                        <li>Webhook confirms completion or failure</li>
                        <li>Status updated automatically</li>
                    </ol>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                        <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">Important Notes</h3>
                        <ul className="text-xs text-amber-400 space-y-1 font-medium">
                            <li>• Ensure Paystack webhook is configured: <code className="bg-black/40 px-2 py-0.5 rounded">/api/webhooks/paystack</code></li>
                            <li>• Monitor Paystack dashboard for transfer status</li>
                            <li>• Failed transfers are automatically refunded</li>
                            <li>• All transactions are logged in the database</li>
                        </ul>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}

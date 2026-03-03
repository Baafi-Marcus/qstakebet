'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Gift, Send } from "lucide-react"
import { createBonus } from "@/lib/bonus-actions"
import { useRouter } from "next/navigation"

export function IssueBonusModal() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        await createBonus({
            userId: formData.get('userId') as string,
            type: formData.get('type') as string,
            amount: parseFloat(formData.get('amount') as string),
            daysValid: 7 // Default 7 days
        })

        setLoading(false)
        setOpen(false)
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all gap-2">
                    <Plus className="w-4 h-4" />
                    Issue Manual Bonus
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f1115] border-white/10 text-white max-w-md rounded-[2.5rem] p-8">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Gift className="h-6 w-6 text-indigo-500" />
                        Bonus Issuance
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Recipient ID</Label>
                        <Input
                            name="userId"
                            required
                            placeholder="usr-xxxxx"
                            className="bg-slate-950 border-white/5 rounded-2xl h-14 font-bold text-white placeholder:text-slate-700 focus:ring-indigo-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Bonus Classification</Label>
                        <Select name="type" required defaultValue="manual">
                            <SelectTrigger className="bg-slate-950 border-white/5 rounded-2xl h-14 font-bold text-white focus:ring-indigo-500/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                                <SelectItem value="manual" className="focus:bg-indigo-500">Manual Adjustment</SelectItem>
                                <SelectItem value="welcome" className="focus:bg-indigo-500">Welcome Reward</SelectItem>
                                <SelectItem value="free_bet" className="focus:bg-indigo-500">Free Bet Credit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Credit Amount (GHS)</Label>
                        <Input
                            name="amount"
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            className="bg-slate-950 border-white/5 rounded-2xl h-14 font-bold text-white placeholder:text-slate-700 focus:ring-indigo-500/20"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest py-6 rounded-2xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all h-16 group"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                Confirm Issuance
                            </>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

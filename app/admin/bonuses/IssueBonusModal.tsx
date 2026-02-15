'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
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
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Issue Bonus
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Issue Manual Bonus</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>User ID (e.g. usr-xxxxx)</Label>
                        <Input name="userId" required placeholder="usr-..." />
                    </div>

                    <div className="space-y-2">
                        <Label>Bonus Type</Label>
                        <Select name="type" required defaultValue="manual">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual">Manual Adjustment</SelectItem>
                                <SelectItem value="welcome">Welcome Bonus</SelectItem>
                                <SelectItem value="free_bet">Free Bet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount (GHS)</Label>
                        <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Issue Bonus
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

import { getAllBonuses, createBonus } from "@/lib/bonus-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Gift, Plus } from "lucide-react"
import { IssueBonusModal } from "./IssueBonusModal"

export const dynamic = 'force-dynamic'

export default async function AdminBonusesPage() {
    const bonuses = await getAllBonuses()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bonus Management</h1>
                    <p className="text-slate-500">Track and issue user bonuses</p>
                </div>
                <IssueBonusModal />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Bonuses</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bonuses.map((bonus) => (
                                <TableRow key={bonus.id}>
                                    <TableCell className="font-medium text-slate-500 text-xs">
                                        {new Date(bonus.createdAt!).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-slate-800">{bonus.user}</div>
                                        <div className="text-xs text-slate-500">{bonus.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="uppercase text-[10px]">
                                            {bonus.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-green-600">
                                        GHS {bonus.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={
                                            bonus.status === 'active' ? 'bg-green-500' :
                                                bonus.status === 'used' ? 'bg-blue-500' : 'bg-slate-300'
                                        }>
                                            {bonus.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

import { auth } from "@/lib/auth"
import { getUserBonuses, getReferralStats } from "@/lib/bonus-actions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Gift, Users, Copy, Sparkles, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyLinkButton } from "@/components/ui/CopyLinkButton"

export default async function RewardsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const { active, history } = await getUserBonuses(session.user.id)
    const referralStats = await getReferralStats(session.user.id)

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                    <Gift className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-white">My Rewards</h1>
                    <p className="text-slate-500 font-medium">Manage your bonuses and referral earnings</p>
                </div>
            </div>

            {/* Referral Section */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="md:col-span-2 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white border-0 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <CardContent className="p-8 relative z-10">
                        <div className="flex items-start justify-between mb-8">
                            <div className="space-y-1">
                                <h3 className="font-black text-2xl flex items-center gap-3 uppercase tracking-tight">
                                    <Users className="w-6 h-6" />
                                    Refer & Earn
                                </h3>
                                <p className="text-indigo-100 text-sm font-medium opacity-90">
                                    Get <strong className="text-white font-black">GHS 10.00</strong> for every friend who joins and deposits!
                                </p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                                <Sparkles className="w-6 h-6 text-yellow-300" />
                            </div>
                        </div>

                        <div className="bg-black/30 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center justify-between gap-4">
                            <div className="font-mono text-xl tracking-tight font-black truncate max-w-[65%] text-slate-100">
                                {referralStats?.code ? `qstakebet.com/r/${referralStats.code}` : "Generating..."}
                            </div>
                            <CopyLinkButton referralCode={referralStats?.code || ""} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm flex flex-col justify-center">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">Total Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">
                            GHS {referralStats?.totalEarnings.toFixed(2)}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-tighter">
                            {referralStats?.completedReferrals} successful referrals
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Bonuses Tabs */}
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="active">Active Bonuses ({active.length})</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {active.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed text-slate-400">
                            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No active bonuses found</p>
                        </div>
                    ) : (
                        active.map(bonus => (
                            <BonusCard key={bonus.id} bonus={bonus} isActive />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {history.map(bonus => (
                        <BonusCard key={bonus.id} bonus={bonus} />
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function BonusCard({ bonus, isActive }: { bonus: any, isActive?: boolean }) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        {isActive ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 uppercase">{bonus.type.replace('_', ' ')} Bonus</h4>
                        <div className="text-2xl font-black text-slate-900">
                            GHS {bonus.amount.toFixed(2)}
                        </div>
                        {bonus.expiresAt && isActive && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                Expires: {new Date(bonus.expiresAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>

                {isActive && (
                    <Button>Use Now</Button>
                )}
            </CardContent>
        </Card>
    )
}

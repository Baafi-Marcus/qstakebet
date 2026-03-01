import QDartsClient from './QDartsClient'
import { auth } from "@/lib/auth"
import { getUserWalletBalance } from "@/lib/wallet-actions"

export const dynamic = "force-dynamic"

export const metadata = {
    title: 'Q-DARTS | Instant Virtuals'
}

export default async function QDartsPage() {
    const session = await auth()
    let profile = { balance: 0, bonusBalance: 0 }

    if (session?.user) {
        const wallet = await getUserWalletBalance()
        profile = {
            balance: wallet.balance,
            bonusBalance: wallet.bonusBalance || 0,
        }
    }

    return <QDartsClient userProfile={profile} isAuthenticated={!!session?.user} />
}

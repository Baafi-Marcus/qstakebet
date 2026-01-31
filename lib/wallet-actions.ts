"use server"

import { db } from "@/lib/db"
import { wallets } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function getUserWalletBalance() {
    const session = await auth()
    if (!session?.user?.id) return { balance: 0, bonusBalance: 0 }

    const userWallet = await db.select()
        .from(wallets)
        .where(eq(wallets.userId, session.user.id))
        .limit(1)

    if (userWallet.length > 0) {
        return {
            balance: userWallet[0].balance,
            bonusBalance: userWallet[0].bonusBalance
        }
    }

    return { balance: 0, bonusBalance: 0 }
}

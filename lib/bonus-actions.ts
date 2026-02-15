'use server'

import { db } from "@/lib/db"
import { bonuses, referrals, users, wallets } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

// ==========================================
// USER ACTIONS
// ==========================================

export async function getUserBonuses(userId: string) {
    if (!userId) return { active: [], history: [] }

    const allBonuses = await db.select()
        .from(bonuses)
        .where(eq(bonuses.userId, userId))
        .orderBy(desc(bonuses.createdAt))

    const active = allBonuses.filter(b => b.status === 'active' && (!b.expiresAt || new Date(b.expiresAt) > new Date()))
    const history = allBonuses.filter(b => b.status !== 'active' || (b.expiresAt && new Date(b.expiresAt) <= new Date()))

    return { active, history }
}

export async function getReferralStats(userId: string) {
    if (!userId) return null

    // Get User's Referral Code
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { referralCode: true }
    })

    if (!user) return null

    // If user doesn't have a code, generate one (Lazy Generation)
    let code = user.referralCode
    if (!code) {
        code = await generateReferralCode(userId)
    }

    // Get Referrals
    const myReferrals = await db.select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId))

    const totalEarnings = myReferrals.reduce((sum, ref) => sum + (ref.referrerBonus || 0), 0)
    const completedReferrals = myReferrals.filter(ref => ref.status === 'completed').length

    return {
        code,
        totalEarnings,
        totalReferrals: myReferrals.length,
        completedReferrals,
        referralList: myReferrals
    }
}

// ==========================================
// ADMIN ACTIONS
// ==========================================

export async function createBonus(data: {
    userId: string
    type: string // "welcome", "deposit", "manual", "free_bet"
    amount: number
    minOdds?: number
    minSelections?: number
    daysValid?: number
}) {
    try {
        const expiresAt = data.daysValid
            ? new Date(Date.now() + data.daysValid * 24 * 60 * 60 * 1000)
            : null

        // 1. Create Bonus Record
        await db.insert(bonuses).values({
            id: `bns-${nanoid(10)}`,
            userId: data.userId,
            type: data.type,
            amount: data.amount,
            status: 'active',
            minOdds: data.minOdds,
            minSelections: data.minSelections,
            expiresAt: expiresAt
        })

        // 2. Update Wallet (Credit the Bonus Balance)
        // We need to check if wallet exists, or create it? 
        // Assuming wallet exists for a valid user.

        const wallet = await db.query.wallets.findFirst({
            where: eq(wallets.userId, data.userId)
        })

        if (wallet) {
            await db.update(wallets)
                .set({
                    bonusBalance: (wallet.bonusBalance || 0) + data.amount
                })
                .where(eq(wallets.id, wallet.id))
        }

        revalidatePath('/admin/bonuses')
        revalidatePath('/rewards')

        return { success: true }
    } catch (error) {
        console.error("Failed to create bonus:", error)
        return { success: false, error: "Failed to issue bonus" }
    }
}

export async function getAllBonuses() {
    // Fetch latest 50 bonuses for admin view
    return await db.select({
        id: bonuses.id,
        user: users.name,
        email: users.email,
        type: bonuses.type,
        amount: bonuses.amount,
        status: bonuses.status,
        createdAt: bonuses.createdAt
    })
        .from(bonuses)
        .leftJoin(users, eq(bonuses.userId, users.id))
        .orderBy(desc(bonuses.createdAt))
        .limit(50)
}

// ==========================================
// INTERNAL HELPERS
// ==========================================

export async function generateReferralCode(userId: string) {
    // Generate a simple 6-char code (e.g., MARC25)
    // For now, just random nanoid
    const code = nanoid(6).toUpperCase()

    await db.update(users)
        .set({ referralCode: code })
        .where(eq(users.id, userId))

    return code
}

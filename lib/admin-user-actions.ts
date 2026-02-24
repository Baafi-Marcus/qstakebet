"use server"

import { db } from "@/lib/db"
import { users, wallets, bets, transactions, referralClicks } from "@/lib/db/schema"
import { eq, desc, ilike, or, sql, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getUsers(query?: string) {
    try {
        const baseQuery = db.select({
            id: users.id,
            name: users.name,
            phone: users.phone,
            role: users.role,
            status: users.status,
            createdAt: users.createdAt,
            balance: wallets.balance,
            linkClicks: users.linkClicks,
            referralCount: sql<number>`(SELECT COUNT(*) FROM ${users} r WHERE r.referred_by = ${users.referralCode})`.mapWith(Number)
        })
            .from(users)
            .leftJoin(wallets, eq(users.id, wallets.userId))
            .orderBy(desc(users.createdAt))

        if (query) {
            const results = await baseQuery.where(
                or(
                    ilike(users.phone, `%${query}%`),
                    ilike(users.name, `%${query}%`)
                )
            )
            return { success: true, users: results }
        }

        const results = await baseQuery
        return { success: true, users: results }
    } catch (error) {
        console.error("Failed to fetch users:", error)
        return { success: false, error: "Failed to load users" }
    }
}

export async function getUserDetails(userId: string) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            with: {
                wallet: true,
            }
        })

        if (!user) return { success: false, error: "User not found" }

        const userBets = await db.select().from(bets)
            .where(eq(bets.userId, userId))
            .orderBy(desc(bets.createdAt))
            .limit(20)

        const userTransactions = await db.select().from(transactions)
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.createdAt))
            .limit(20)

        return {
            success: true,
            user,
            bets: userBets,
            transactions: userTransactions
        }
    } catch (error) {
        console.error("Failed to fetch user details:", error)
        return { success: false, error: "Failed to load user details" }
    }
}

export async function updateUserStatus(userId: string, status: "active" | "suspended") {
    try {
        await db.update(users)
            .set({ status })
            .where(eq(users.id, userId))

        revalidatePath("/admin/users")
        revalidatePath(`/admin/users/${userId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update user status:", error)
        return { success: false, error: "Failed to update status" }
    }
}

export async function broadcastSMS(message: string) {
    try {
        // Fetch all active users with phone numbers
        const activeUsers = await db.select({
            phone: users.phone
        })
            .from(users)
            .where(eq(users.status, "active"))

        if (activeUsers.length === 0) {
            return { success: false, error: "No active users found" }
        }

        const recipients = activeUsers.map(u => u.phone)

        // Using Vynfy client to send broadcast
        const { vynfy } = await import("@/lib/vynfy-client")
        const result = await vynfy.sendSMS(recipients, message)

        return {
            success: result.success,
            count: recipients.length,
            error: result.error
        }
    } catch (error) {
        console.error("Failed to send broadcast SMS:", error)
        return { success: false, error: "Internal server error during broadcast" }
    }
}

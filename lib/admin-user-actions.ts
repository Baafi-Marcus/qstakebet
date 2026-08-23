"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
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
            linkClicks: users.linkClicks,
            referralCount: sql<number>`(SELECT COUNT(*) FROM ${users} r WHERE r.referred_by = ${users.referralCode})`.mapWith(Number)
        })
            .from(users)
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
        })

        if (!user) return { success: false, error: "User not found" }

        return {
            success: true,
            user,
            transactions: []
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
    return { success: true, count: 0 }
}


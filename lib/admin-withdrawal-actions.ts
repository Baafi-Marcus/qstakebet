"use server"

import { db } from "@/lib/db"
import { users, wallets, withdrawalRequests, transactions } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * Verifies if the current user is an admin
 */
async function isAdmin() {
    const session = await auth();
    if (!session?.user?.id) return false;

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { role: true }
    });

    return user?.role === "admin";
}

/**
 * Fetches all withdrawal requests with user names
 */
export async function getAllWithdrawalRequests() {
    if (!(await isAdmin())) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const requests = await db.query.withdrawalRequests.findMany({
            orderBy: [desc(withdrawalRequests.createdAt)],
            with: {
                // Assuming relations are set up, but let's do a join or manually fetch if not
            }
        });

        // Since relations might not be fully configured for 'with' on withdrawalRequests in schema.ts
        // Let's manually fetch user names for now to be safe
        const requestsWithUsers = await Promise.all(requests.map(async (req) => {
            const user = await db.query.users.findFirst({
                where: eq(users.id, req.userId),
                columns: { name: true, phone: true }
            });
            return {
                ...req,
                user: user || { name: "Unknown", phone: "N/A" }
            };
        }));

        return { success: true, requests: requestsWithUsers };
    } catch (error) {
        console.error("Admin: Failed to fetch withdrawals", error);
        return { success: false, error: "Internal Error" };
    }
}

/**
 * Manually marks a withdrawal as paid
 */
export async function approveManualWithdrawal(withdrawalId: string) {
    if (!(await isAdmin())) {
        return { success: false, error: "Unauthorized" };
    }

    const session = await auth();

    try {
        const withdrawal = await db.query.withdrawalRequests.findFirst({
            where: eq(withdrawalRequests.id, withdrawalId)
        });

        if (!withdrawal || (withdrawal.status !== "pending" && withdrawal.status !== "approved")) {
            return { success: false, error: "Invalid withdrawal request" };
        }

        const wallet = await db.query.wallets.findFirst({
            where: eq(wallets.userId, withdrawal.userId)
        });

        if (!wallet) {
            return { success: false, error: "User wallet not found" };
        }

        // 1. Update wallet: Deduct from locked balance
        await db.update(wallets)
            .set({
                lockedBalance: Math.max(0, wallet.lockedBalance - withdrawal.amount),
                lastWithdrawalAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(wallets.id, wallet.id));

        // 2. Update withdrawal request
        await db.update(withdrawalRequests)
            .set({
                status: "paid",
                adminId: session?.user?.id,
                updatedAt: new Date()
            })
            .where(eq(withdrawalRequests.id, withdrawalId));

        // 3. Update transaction status
        await db.update(transactions)
            .set({
                paymentStatus: "completed",
                updatedAt: new Date()
            })
            .where(and(
                eq(transactions.userId, withdrawal.userId),
                eq(transactions.reference, withdrawalId)
            ));

        revalidatePath("/admin/withdrawals");
        return { success: true, message: "Withdrawal marked as paid" };
    } catch (error) {
        console.error("Admin: Failed to approve withdrawal", error);
        return { success: false, error: "Internal Error" };
    }
}

/**
 * Rejects a withdrawal and refunds the user
 */
export async function rejectManualWithdrawal(withdrawalId: string, reason: string) {
    if (!(await isAdmin())) {
        return { success: false, error: "Unauthorized" };
    }

    const session = await auth();

    try {
        const withdrawal = await db.query.withdrawalRequests.findFirst({
            where: eq(withdrawalRequests.id, withdrawalId)
        });

        if (!withdrawal || withdrawal.status === "paid" || withdrawal.status === "rejected") {
            return { success: false, error: "Cannot reject this withdrawal" };
        }

        const wallet = await db.query.wallets.findFirst({
            where: eq(wallets.userId, withdrawal.userId)
        });

        if (!wallet) {
            return { success: false, error: "User wallet not found" };
        }

        // 1. Update wallet: Refund locked balance to active balance
        await db.update(wallets)
            .set({
                balance: wallet.balance + withdrawal.amount,
                lockedBalance: Math.max(0, wallet.lockedBalance - withdrawal.amount),
                updatedAt: new Date()
            })
            .where(eq(wallets.id, wallet.id));

        // 2. Update withdrawal request
        await db.update(withdrawalRequests)
            .set({
                status: "rejected",
                adminId: session?.user?.id,
                adminNotes: reason,
                updatedAt: new Date()
            })
            .where(eq(withdrawalRequests.id, withdrawalId));

        // 3. Update transaction status
        await db.update(transactions)
            .set({
                paymentStatus: "failed",
                description: `Rejected: ${reason}`,
                updatedAt: new Date()
            })
            .where(and(
                eq(transactions.userId, withdrawal.userId),
                eq(transactions.reference, withdrawalId)
            ));

        revalidatePath("/admin/withdrawals");
        return { success: true, message: "Withdrawal rejected and refunded" };
    } catch (error) {
        console.error("Admin: Failed to reject withdrawal", error);
        return { success: false, error: "Internal Error" };
    }
}

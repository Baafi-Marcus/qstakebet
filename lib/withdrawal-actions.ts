"use server"

import { db } from "@/lib/db"
import { users, wallets, withdrawalRequests, transactions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { paystackClient } from "@/lib/paystack-client"
import { detectPaymentMethod, formatPhoneNumber } from "@/lib/phone-utils"

const MIN_WITHDRAWAL = 1; // 1 GHS
const MAX_WITHDRAWAL = 1000; // 1000 GHS

/**
 * Initiates a withdrawal request with Paystack automated transfer
 */
export async function requestWithdrawal(amount: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const userId = session.user.id;

        // Validate amount
        if (amount < MIN_WITHDRAWAL) {
            return { success: false, error: `Minimum withdrawal is ${MIN_WITHDRAWAL} GHS` };
        }

        if (amount > MAX_WITHDRAWAL) {
            return { success: false, error: `Maximum withdrawal is ${MAX_WITHDRAWAL} GHS` };
        }

        // Get user and wallet
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        if (!user.phoneVerified) {
            return { success: false, error: "Please verify your phone number first" };
        }

        const wallet = await db.query.wallets.findFirst({
            where: eq(wallets.userId, userId)
        });

        if (!wallet) {
            return { success: false, error: "Wallet not found" };
        }

        // Check if user has sufficient balance
        if (wallet.balance < amount) {
            return { success: false, error: "Insufficient balance" };
        }

        // Check for pending withdrawals
        const pendingWithdrawals = await db.query.withdrawalRequests.findMany({
            where: and(
                eq(withdrawalRequests.userId, userId),
                eq(withdrawalRequests.status, "pending")
            )
        });

        if (pendingWithdrawals.length > 0) {
            return { success: false, error: "You have a pending withdrawal. Please wait for it to complete." };
        }

        // Detect payment method from phone
        const paymentMethod = detectPaymentMethod(user.phone);
        if (!paymentMethod) {
            return { success: false, error: "Could not detect mobile money provider from your phone number" };
        }

        const formattedPhone = formatPhoneNumber(user.phone);

        // Lock funds immediately
        await db.update(wallets)
            .set({
                balance: wallet.balance - amount,
                lockedBalance: wallet.lockedBalance + amount,
                updatedAt: new Date()
            })
            .where(eq(wallets.id, wallet.id));

        // Create withdrawal request
        const withdrawalId = `wrq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(withdrawalRequests).values({
            id: withdrawalId,
            userId: userId,
            amount: amount,
            status: "pending",
            paymentMethod: paymentMethod,
            accountNumber: formattedPhone,
            accountName: user.name || "User"
        });

        // Create transaction record
        const txnId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(transactions).values({
            id: txnId,
            userId: userId,
            walletId: wallet.id,
            type: "withdrawal",
            amount: -amount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance - amount,
            reference: withdrawalId,
            description: `Withdrawal to ${paymentMethod}`,
            paymentProvider: "paystack",
            paymentStatus: "pending"
        });

        // Process with Paystack in background
        processPaystackWithdrawal(withdrawalId, user.name || "User", formattedPhone, paymentMethod, amount).catch(err => {
            console.error("Paystack withdrawal processing error:", err);
        });

        return {
            success: true,
            message: "Withdrawal request submitted. Processing...",
            withdrawalId
        };

    } catch (error) {
        console.error("Withdrawal request error:", error);
        return { success: false, error: "Failed to process withdrawal" };
    }
}

/**
 * Processes withdrawal with Paystack (runs in background)
 */
async function processPaystackWithdrawal(
    withdrawalId: string,
    userName: string,
    phone: string,
    provider: string,
    amount: number
) {
    try {
        // Step 1: Create transfer recipient
        const recipientResult = await paystackClient.createRecipient(userName, phone, provider);

        if (!recipientResult.success || !recipientResult.recipientCode) {
            await handleWithdrawalFailure(withdrawalId, recipientResult.error || "Failed to create recipient");
            return;
        }

        // Step 2: Initiate transfer
        const transferResult = await paystackClient.initiateTransfer(
            recipientResult.recipientCode,
            amount,
            withdrawalId,
            "Withdrawal from QSTAKEbet"
        );

        if (!transferResult.status) {
            // Check if failure is due to Starter account limitation
            const isStarterError =
                transferResult.message?.toLowerCase().includes("starter") ||
                transferResult.message?.toLowerCase().includes("business payout") ||
                transferResult.message?.toLowerCase().includes("transfer")

            if (isStarterError) {
                // Keep as pending but add note for manual processing
                await db.update(withdrawalRequests)
                    .set({
                        adminNotes: `Manual processing required: ${transferResult.message}`,
                        updatedAt: new Date()
                    })
                    .where(eq(withdrawalRequests.id, withdrawalId));
                return;
            }

            await handleWithdrawalFailure(withdrawalId, transferResult.message);
            return;
        }

        // Step 3: Update status to processing
        await db.update(withdrawalRequests)
            .set({
                status: "approved", // Approved by Paystack
                updatedAt: new Date()
            })
            .where(eq(withdrawalRequests.id, withdrawalId));

        // Note: Webhook will handle final completion

    } catch (error) {
        console.error("Paystack processing error:", error);
        await handleWithdrawalFailure(withdrawalId, "Processing error");
    }
}

/**
 * Handles withdrawal failure by refunding user
 */
async function handleWithdrawalFailure(withdrawalId: string, reason: string) {
    try {
        const withdrawal = await db.query.withdrawalRequests.findFirst({
            where: eq(withdrawalRequests.id, withdrawalId)
        });

        if (!withdrawal) return;

        // Refund locked balance
        const wallet = await db.query.wallets.findFirst({
            where: eq(wallets.userId, withdrawal.userId)
        });

        if (wallet) {
            await db.update(wallets)
                .set({
                    balance: wallet.balance + withdrawal.amount,
                    lockedBalance: wallet.lockedBalance - withdrawal.amount,
                    updatedAt: new Date()
                })
                .where(eq(wallets.id, wallet.id));
        }

        // Update withdrawal status
        await db.update(withdrawalRequests)
            .set({
                status: "rejected",
                adminNotes: reason,
                updatedAt: new Date()
            })
            .where(eq(withdrawalRequests.id, withdrawalId));

    } catch (error) {
        console.error("Refund error:", error);
    }
}

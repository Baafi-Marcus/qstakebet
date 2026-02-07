import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { withdrawalRequests, wallets, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

/**
 * Verifies Paystack webhook signature
 */
function verifyPaystackSignature(payload: string, signature: string): boolean {
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(payload)
        .digest("hex");
    return hash === signature;
}

/**
 * Handles Paystack webhook events
 */
export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get("x-paystack-signature");

        if (!signature) {
            return NextResponse.json({ error: "No signature" }, { status: 400 });
        }

        // Verify signature
        if (!verifyPaystackSignature(payload, signature)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = JSON.parse(payload);

        // Handle transfer events
        if (event.event === "transfer.success") {
            await handleTransferSuccess(event.data);
        } else if (event.event === "transfer.failed") {
            await handleTransferFailed(event.data);
        } else if (event.event === "transfer.reversed") {
            await handleTransferReversed(event.data);
        }

        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}

/**
 * Handles successful transfer
 */
async function handleTransferSuccess(data: any) {
    const reference = data.reference;

    try {
        // Find withdrawal request
        const withdrawal = await db.query.withdrawalRequests.findFirst({
            where: eq(withdrawalRequests.id, reference)
        });

        if (!withdrawal) {
            console.error("Withdrawal not found:", reference);
            return;
        }

        // Update withdrawal status to paid
        await db.update(withdrawalRequests)
            .set({
                status: "paid",
                processedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(withdrawalRequests.id, reference));

        // Release locked balance
        const wallet = await db.query.wallets.findFirst({
            where: eq(wallets.userId, withdrawal.userId)
        });

        if (wallet) {
            await db.update(wallets)
                .set({
                    lockedBalance: wallet.lockedBalance - withdrawal.amount,
                    updatedAt: new Date()
                })
                .where(eq(wallets.id, wallet.id));
        }

        // Update transaction status
        await db.update(transactions)
            .set({
                paymentStatus: "completed",
                updatedAt: new Date()
            })
            .where(eq(transactions.reference, reference));

        console.log("Transfer success processed:", reference);
    } catch (error) {
        console.error("Error processing transfer success:", error);
    }
}

/**
 * Handles failed transfer
 */
async function handleTransferFailed(data: any) {
    const reference = data.reference;

    try {
        const withdrawal = await db.query.withdrawalRequests.findFirst({
            where: eq(withdrawalRequests.id, reference)
        });

        if (!withdrawal) {
            console.error("Withdrawal not found:", reference);
            return;
        }

        // Update withdrawal status to rejected
        await db.update(withdrawalRequests)
            .set({
                status: "rejected",
                adminNotes: data.message || "Transfer failed",
                updatedAt: new Date()
            })
            .where(eq(withdrawalRequests.id, reference));

        // Refund user
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

        // Update transaction status
        await db.update(transactions)
            .set({
                paymentStatus: "failed",
                updatedAt: new Date()
            })
            .where(eq(transactions.reference, reference));

        console.log("Transfer failure processed:", reference);
    } catch (error) {
        console.error("Error processing transfer failure:", error);
    }
}

/**
 * Handles reversed transfer
 */
async function handleTransferReversed(data: any) {
    // Treat reversed transfers same as failed
    await handleTransferFailed(data);
}

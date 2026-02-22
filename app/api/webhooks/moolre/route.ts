import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { transactions, wallets, referrals } from "@/lib/db/schema"
import { eq, sql, and } from "drizzle-orm"

export async function POST(req: Request) {
    try {
        const payload = await req.json()
        // const signature = req.headers.get("x-moolre-signature")

        // TODO: Implement signature verification once we have the MOOLRE_WEBHOOK_SECRET
        console.log("Moolre Webhook received:", payload)

        const { status, reference } = payload

        if (status === "success" || status === "completed") {
            // 1. Find the pending transaction
            const txn = await db.select().from(transactions).where(eq(transactions.paymentReference, reference)).limit(1)

            if (txn.length > 0 && txn[0].paymentStatus !== "success") {
                const userId = txn[0].userId
                const walletId = txn[0].walletId

                // 2. Update transaction status
                await db.update(transactions)
                    .set({
                        paymentStatus: "success",
                        paymentMetadata: payload,
                        updatedAt: new Date()
                    })
                    .where(eq(transactions.id, txn[0].id))

                // 3. Increment wallet balance
                await db.update(wallets)
                    .set({
                        balance: sql`${wallets.balance} + ${txn[0].amount}`,
                        lastDepositAt: new Date(),
                        updatedAt: new Date()
                    })
                    .where(eq(wallets.id, walletId))

                // --- REFERRAL REWARD TRIGGER ---
                // If deposit is 10 GHS or more, check for pending referral
                if (txn[0].amount >= 10) {
                    const pendingReferral = await db.query.referrals.findFirst({
                        where: and(
                            eq(referrals.referredUserId, userId),
                            eq(referrals.status, "pending")
                        )
                    });

                    if (pendingReferral) {
                        const referrerId = pendingReferral.referrerId;
                        const rewardAmount = 10.00;

                        // 1. Get Referrer Wallet
                        const referrerWallet = await db.query.wallets.findFirst({
                            where: eq(wallets.userId, referrerId)
                        });

                        if (referrerWallet) {
                            const balanceBefore = referrerWallet.balance;
                            const balanceAfter = balanceBefore + rewardAmount;

                            // 2. Update Referrer Wallet
                            await db.update(wallets)
                                .set({
                                    balance: balanceAfter,
                                    updatedAt: new Date()
                                })
                                .where(eq(wallets.id, referrerWallet.id));

                            // 3. Complete Referral Status
                            await db.update(referrals)
                                .set({
                                    status: "completed",
                                    completedAt: new Date()
                                })
                                .where(eq(referrals.id, pendingReferral.id));

                            // 4. Log Transaction for Referrer
                            await db.insert(transactions).values({
                                id: `txn-${Math.random().toString(36).substring(2, 11)}`,
                                userId: referrerId,
                                walletId: referrerWallet.id,
                                type: "referral_bonus",
                                amount: rewardAmount,
                                balanceBefore,
                                balanceAfter,
                                description: `Referral reward for deposit by referred user`,
                                paymentStatus: "success"
                            });

                            console.log(`Issued 10 GHS referral bonus to ${referrerId} for user ${userId}'s deposit.`);
                        }
                    }
                }
                // --- END REFERRAL REWARD TRIGGER ---

                console.log(`Successfully credited GHS ${txn[0].amount} to user ${userId}`)
            }
        } else if (status === "failed") {
            await db.update(transactions)
                .set({
                    paymentStatus: "failed",
                    paymentMetadata: payload,
                    updatedAt: new Date()
                })
                .where(eq(transactions.paymentReference, reference))
        }

        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error) {
        console.error("Webhook processing error:", error)
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
    }
}

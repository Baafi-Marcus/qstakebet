import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { transactions, wallets } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function POST(req: Request) {
    try {
        const payload = await req.json()
        const signature = req.headers.get("x-moolre-signature")

        // TODO: Implement signature verification once we have the MOOLRE_WEBHOOK_SECRET
        console.log("Moolre Webhook received:", payload)

        const { status, reference, transaction_id, amount } = payload

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

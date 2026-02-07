
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // Use .env.local

import { db } from "./lib/db/index";
import { bets, wallets, transactions, users } from "./lib/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";

const BET_ID = "bet-5v475f49e";
const PAYOUT = 3.281;

async function fixBet() {
    const dbUrl = process.env.DATABASE_URL;
    console.log(`[DEBUG] DATABASE_URL loaded: ${!!dbUrl} (Prefix: ${dbUrl?.substring(0, 15)}...)`);
    console.log(`[DEBUG] Checking for BET_ID="${BET_ID}"`);

    try {
        const simpleBet = await db.select({
            id: bets.id,
            status: bets.status,
            createdAt: bets.createdAt
        }).from(bets).where(eq(bets.id, BET_ID));

        if (simpleBet.length === 0) {
            console.error(`[ERROR] Bet ${BET_ID} NOT FOUND in current DB context (.env.local).`);
            const recent = await db.select({ id: bets.id, createdAt: bets.createdAt }).from(bets).orderBy(desc(bets.createdAt)).limit(5);
            console.table(recent);
            return;
        }

        console.log(`[FOUND] Bet:`, simpleBet[0]);

        await db.transaction(async (tx) => {
            const betData = await tx.select().from(bets).where(eq(bets.id, BET_ID)).limit(1);
            if (!betData.length) throw new Error("Bet not found in transaction scope");
            const txBet = betData[0];

            if (txBet.settledAt) {
                console.log("[INFO] Bet already settled.");
                return;
            }

            const walletData = await tx.select().from(wallets).where(eq(wallets.userId, txBet.userId)).limit(1);
            if (!walletData.length) throw new Error("Wallet not found");
            const wallet = walletData[0];

            console.log(`[INFO] Current Balance: ${wallet.balance}`);

            await tx.update(wallets).set({
                balance: sql`${wallets.balance} + ${PAYOUT}`,
                updatedAt: new Date()
            }).where(eq(wallets.userId, txBet.userId));

            const txnId = `txn-fix-${Math.random().toString(36).substr(2, 9)}`;
            await tx.insert(transactions).values({
                id: txnId,
                userId: txBet.userId,
                walletId: wallet.id,
                amount: PAYOUT,
                type: "bet_payout",
                balanceBefore: wallet.balance,
                balanceAfter: Number(wallet.balance) + PAYOUT,
                reference: txBet.id,
                description: `Manual Fix: Virtual Winnings ${txBet.id}`
            });

            await tx.update(bets).set({
                settledAt: new Date(),
                updatedAt: new Date(),
                status: 'won'
            }).where(eq(bets.id, BET_ID));

            console.log(`[SUCCESS] Bet ${BET_ID} settled. WALLET CREDITED. TXN: ${txnId}`);
        });

    } catch (error) {
        console.error("[CRITICAL ERROR]", error);
    }
    process.exit(0);
}

fixBet();

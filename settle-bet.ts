import "dotenv/config";
import { db } from "./lib/db/index";
import { bets, wallets, transactions } from "./lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

const BET_ID = "bet-5v475f49e";
const PAYOUT = 3.281;

async function settleBet() {
    console.log(`Attempting to settle bet ${BET_ID}...`);

    try {
        // First, list recent bets to verify connection
        const recentBets = await db.select({
            id: bets.id,
            status: bets.status,
            stake: bets.stake,
            potentialPayout: bets.potentialPayout,
            settledAt: bets.settledAt
        })
            .from(bets)
            .orderBy(desc(bets.createdAt))
            .limit(5);

        console.log("Recent bets:");
        console.table(recentBets);

        // Find the specific bet
        const targetBet = recentBets.find(b => b.id === BET_ID);

        if (!targetBet) {
            console.error(`ERROR: Bet ${BET_ID} not found in recent bets`);
            return;
        }

        console.log(`Found bet:`, targetBet);

        if (targetBet.settledAt) {
            console.log(`Bet already settled at: ${targetBet.settledAt}`);
            return;
        }

        // Perform settlement in transaction
        await db.transaction(async (tx) => {
            const betData = await tx.select().from(bets).where(eq(bets.id, BET_ID)).limit(1);
            if (!betData.length) throw new Error("Bet not found");

            const bet = betData[0];

            const walletData = await tx.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1);
            if (!walletData.length) throw new Error("Wallet not found");

            const wallet = walletData[0];
            console.log(`Current balance: ${wallet.balance}`);

            // Update wallet
            await tx.update(wallets).set({
                balance: sql`${wallets.balance} + ${PAYOUT}`,
                updatedAt: new Date()
            }).where(eq(wallets.userId, bet.userId));

            // Create transaction record
            const txnId = `txn-settle-${Math.random().toString(36).substr(2, 9)}`;
            await tx.insert(transactions).values({
                id: txnId,
                userId: bet.userId,
                walletId: wallet.id,
                amount: PAYOUT,
                type: "bet_payout",
                balanceBefore: wallet.balance,
                balanceAfter: Number(wallet.balance) + PAYOUT,
                reference: bet.id,
                description: `Virtual Bet Settlement: ${bet.id}`
            });

            // Mark bet as settled
            await tx.update(bets).set({
                settledAt: new Date(),
                updatedAt: new Date()
            }).where(eq(bets.id, BET_ID));

            console.log(`✅ SUCCESS: Bet settled, wallet credited with ${PAYOUT} GHS`);
            console.log(`New balance: ${Number(wallet.balance) + PAYOUT}`);
        });

    } catch (error) {
        console.error("Settlement error:", error);
    }

    process.exit(0);
}

settleBet();

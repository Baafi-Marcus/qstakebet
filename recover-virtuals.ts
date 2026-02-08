
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { generateVirtualMatches } from "./lib/virtuals";
import { isSelectionWinner } from "./lib/settlement";

async function recoverVirtuals() {
    console.log("Starting Virtual Bet Recovery...");

    // Ensure DB URL is set before importing DB client
    if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = "postgresql://neondb_owner:npg_DgW9PN5darkG@ep-snowy-scene-ahkphlbd-pooler.c-3.us-east-1.aws.neon.tech/New%20World?sslmode=require";
    }

    const { db } = await import("./lib/db/index");
    const { bets, wallets, transactions, schools: schoolsTable } = await import("./lib/db/schema");
    const { eq, sql } = await import("drizzle-orm");

    try {
        const lostBets = await db.select().from(bets).where(eq(bets.status, 'lost'));

        const virtualLostBets = lostBets.filter(bet => {
            const sels = (bet.selections as any[]) || [];
            return sels.some(s => s.matchId?.startsWith('vmt-'));
        });

        console.log(`Found ${virtualLostBets.length} potential virtual 'lost' bets to re-check.`);

        const allSchools = await db.select().from(schoolsTable);

        for (const bet of virtualLostBets) {
            console.log(`\nChecking Bet: ${bet.id} (User: ${bet.userId})`);

            const selections = bet.selections as any[];
            if (!selections.length) continue;

            // 2. Determine simulation parameters
            const firstId = selections[0].matchId;
            const parts = firstId.split('-');
            const roundId = parseInt(parts[1]);
            const category = parts[3] as 'national' | 'regional';
            let regSlug = parts[4];
            let regName = allSchools.find(s => s.region.toLowerCase().replace(/\s+/g, '-') === regSlug)?.region;

            // LEGACY HANDLE: 4-part IDs (vmt-round-idx-cat)
            if (category === 'regional' && !regSlug) {
                console.log(`[INFO] Legacy 4-part ID detected for bet ${bet.id}. Deduce region from label: ${selections[0].matchLabel}`);
                // Try to find any school from matchLabel in allSchools to get region
                const label = selections[0].matchLabel || "";
                const foundSchool = allSchools.find(s => label.includes(s.name));
                if (foundSchool) {
                    regName = foundSchool.region;
                    regSlug = regName.toLowerCase().replace(/\s+/g, '-');
                    console.log(`[INFO] Deduced region: ${regName} (${regSlug})`);
                }
            }

            // Calculate multiple userSeed variations to try for legacy
            const userSeedActual = (bet.userId || "0").split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const userSeedsToTry = [userSeedActual, 0]; // Try both personal and default 0

            let bestOutcomes: any[] = [];
            let foundWin = false;

            for (const trySeed of userSeedsToTry) {
                // Try two versions of seed logic: with and without region length (if legacy IDs behaved differently)
                const variations = [
                    { reg: regName, s: trySeed }, // Standard current
                    { reg: undefined, s: trySeed }, // Regional but no region passed (fallbacks to national in current simulateMatch)
                    // If we suspect seed formula changed (e.g. no region length), we'd need to mock it.
                    // But usually regionSlug.length is the only variable part.
                ];

                for (const v of variations) {
                    const { outcomes } = generateVirtualMatches(15, allSchools as any, roundId, category, v.reg, {}, v.s);

                    const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1);
                    const inferredMulti = Math.abs(bet.potentialPayout - (bet.stake * totalOdds)) < 0.1;

                    let allWon = true;
                    let totalReturns = 0;

                    if (!inferredMulti && selections.length > 1) {
                        const stakePerSelection = bet.stake / selections.length;
                        let wonReturns = 0;
                        selections.forEach(s => {
                            const outcome = outcomes.find(o => o.id === s.matchId);
                            if (outcome && isSelectionWinner(s.selectionId, s.marketName, s.label, { sportType: 'quiz' } as any, outcome as any)) {
                                wonReturns += (s.odds * stakePerSelection);
                            }
                        });
                        totalReturns = wonReturns;
                        allWon = totalReturns > 0;
                    } else {
                        for (const s of selections) {
                            const outcome = outcomes.find(o => o.id === s.matchId);
                            if (!outcome || !isSelectionWinner(s.selectionId, s.marketName, s.label, { sportType: 'quiz' } as any, outcome as any)) {
                                allWon = false;
                                break;
                            }
                        }
                        if (allWon) totalReturns = bet.potentialPayout;
                    }

                    if (allWon && totalReturns > 0) {
                        foundWin = true;
                        console.log(`>>> [WINNER DETECTED] Bet ${bet.id} won with userSeed=${v.s}, reg=${v.reg}. Returns: ${totalReturns}`);

                        await db.transaction(async (tx) => {
                            await tx.update(bets).set({
                                status: 'won',
                                updatedAt: new Date(),
                                settledAt: new Date()
                            }).where(eq(bets.id, bet.id));

                            const walletData = await tx.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1);
                            if (walletData.length) {
                                const wallet = walletData[0];
                                let payoutAmount = totalReturns;
                                if (bet.isBonusBet) {
                                    payoutAmount = Math.max(0, payoutAmount - bet.stake);
                                }

                                if (payoutAmount > 0) {
                                    await tx.update(wallets).set({
                                        balance: bet.isBonusBet ? wallet.balance : sql`${wallets.balance} + ${payoutAmount}`,
                                        lockedBalance: bet.isBonusBet ? sql`${wallets.lockedBalance} + ${payoutAmount}` : wallet.lockedBalance,
                                        updatedAt: new Date()
                                    }).where(eq(wallets.userId, bet.userId));

                                    await tx.insert(transactions).values({
                                        id: `txn-rec-${Math.random().toString(36).substr(2, 9)}`,
                                        userId: bet.userId,
                                        walletId: wallet.id,
                                        amount: payoutAmount,
                                        type: "bet_payout",
                                        balanceBefore: bet.isBonusBet ? wallet.lockedBalance : wallet.balance,
                                        balanceAfter: bet.isBonusBet ? Number(wallet.lockedBalance) + payoutAmount : Number(wallet.balance) + payoutAmount,
                                        reference: bet.id,
                                        description: `Recovery: Virtual Winnings ${bet.id}`
                                    } as any);
                                    console.log(`[DONE] Credited user ${bet.userId} with GHS ${payoutAmount}`);
                                }
                            }
                        });
                        break; // Exit variations loop
                    }
                }
                if (foundWin) break; // Exit userSeedsToTry loop
            }

            if (!foundWin) {
                console.log(`[STILL LOST] Bet ${bet.id} is confirmed Lost after trying multiple seed variations.`);
            }
        }

        console.log("\nRecovery process completed.");
    } catch (error) {
        console.error("Recovery failed:", error);
    }
    process.exit(0);
}

recoverVirtuals();

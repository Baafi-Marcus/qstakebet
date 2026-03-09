import { db } from "@/lib/db"
import { bets, matches, wallets, transactions } from "@/lib/db/schema"
import { eq, sql, or } from "drizzle-orm"
import { Bet, Match } from "@/lib/types"

export async function settleMatch(matchId: string) {
    try {
        console.log(`Starting settlement for match: ${matchId}`)

        // 1. Fetch match details
        const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!matchData || matchData.length === 0) {
            console.error("Match not found")
            return { success: false, error: "Match not found" }
        }

        const match = matchData[0] as unknown as Match
        const result = match.result as {
            winner?: string,
            scores?: Record<string, number>,
            metadata?: Record<string, unknown>
        } | null

        // Auto-resolve winner if missing but scores exist (Robust fallback)
        const sport = (match.sportType || 'football').toLowerCase()
        let currentWinner = result?.winner;
        const scores = result?.scores || {};
        if (!currentWinner && sport !== 'quiz') {
            const pIds = Object.keys(scores);
            if (pIds.length >= 2) {
                const s1 = scores[pIds[0]];
                const s2 = scores[pIds[1]];

                // Only auto-resolve if both scores are numbers
                if (typeof s1 === 'number' && typeof s2 === 'number') {
                    if (s1 > s2) currentWinner = pIds[0];
                    else if (s2 > s1) currentWinner = pIds[1];
                    else currentWinner = 'X';
                }
            }
        }

        if (!currentWinner && match.status !== 'cancelled') {
            console.error("Match has no winner declared and could not be auto-resolved")
            return { success: false, error: "Match has no winner" }
        }

        const isVoid = match.status === 'cancelled' || currentWinner === 'void' || currentWinner === 'cancelled'

        // 2. Fetch all bets that might need settlement (including already settled multi-bets for selection cleanup)
        const allCandidateBets = await db.select().from(bets)
            .where(or(
                eq(bets.status, "pending"),
                eq(bets.status, "won"),
                eq(bets.status, "lost")
            ))

        const pendingBets = allCandidateBets.filter(bet => {
            const selections = bet.selections as unknown as Array<{ matchId: string, status?: string }> | null
            // We only care if it has a selection for this match that is NOT yet decided
            return selections?.some(s => s.matchId === matchId && (!s.status || s.status === 'pending'))
        })

        console.log(`Found ${pendingBets.length} pending bets to settle`)

        let settledCount = 0

        for (const bet of pendingBets) {
            const selections = bet.selections as unknown as Array<{
                matchId: string,
                selectionId: string,
                odds: number,
                marketName?: string,
                label?: string,
                status?: string // Track individual leg status (won, lost, void, pending)
            }>

            const betStatus = bet.status;
            const skipFinancials = betStatus !== 'pending';

            // Handle Void Match
            if (isVoid) {
                // Find legs for this match and mark them void
                const updatedSelections = selections.map(s => {
                    const isPending = !s.status || s.status === 'pending'
                    if (s.matchId === matchId && isPending) {
                        return { ...s, status: 'void', odds: 1.00 } // Set odds to 1.00 for void
                    }
                    return s
                })

                // Recalculate Total Odds
                const newTotalOdds = updatedSelections.reduce((acc, curr) => acc * curr.odds, 1)

                // Recalculate Bonus
                let newBonusGiftAmount = 0
                if (updatedSelections.length >= 3 && !bet.isBonusBet) {
                    const { MULTI_BONUS } = await import("@/lib/constants")
                    const count = updatedSelections.filter(s => s.status !== 'void').length
                    let bonusPct = 0

                    if (count >= 3) {
                        Object.entries(MULTI_BONUS.SCALING)
                            .sort((a, b) => Number(b[0]) - Number(a[0]))
                            .some(([threshold, percent]) => {
                                if (count >= Number(threshold)) {
                                    bonusPct = Number(percent)
                                    return true
                                }
                                return false
                            })
                    }

                    const baseWin = bet.stake * newTotalOdds
                    const rawBonus = baseWin * (bonusPct / 100)
                    newBonusGiftAmount = Math.min(rawBonus, MULTI_BONUS.MAX_BONUS_AMOUNT_CAP)
                }

                const newPayout = (bet.stake * newTotalOdds) + newBonusGiftAmount

                // Update Bet with new odds/payout/bonus
                await db.update(bets).set({
                    selections: updatedSelections,
                    totalOdds: newTotalOdds,
                    potentialPayout: newPayout,
                    bonusGiftAmount: newBonusGiftAmount,
                    updatedAt: new Date()
                }).where(eq(bets.id, bet.id))

                // If all legs are now finished (won/lost/void), settle the bet
                const allFinished = updatedSelections.every(s => s.status && s.status !== 'pending')
                if (allFinished) {
                    const isAllWinOrVoid = updatedSelections.every(s => s.status === 'won' || s.status === 'void')
                    const finalStatus = isAllWinOrVoid ? 'won' : 'lost'

                    if (finalStatus === 'won') {
                        const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
                        if (userWallet.length > 0) {
                            const balanceBefore = parseFloat(userWallet[0].balance.toString())
                            const payout = newPayout
                            const balanceAfter = balanceBefore + Math.max(0, payout)

                            await db.update(wallets).set({ balance: balanceAfter }).where(eq(wallets.userId, bet.userId))

                            await db.insert(transactions).values({
                                id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                                userId: bet.userId,
                                walletId: userWallet[0].id,
                                amount: Math.max(0, payout),
                                type: "bet_payout",
                                balanceBefore,
                                balanceAfter,
                                reference: bet.id,
                                description: `Refund/Win (All Legs Decided): ${bet.id}`
                            })
                        }
                    }

                    await db.update(bets).set({
                        status: isAllWinOrVoid ? (updatedSelections.every(s => s.status === 'void') ? 'void' : 'won') : 'lost',
                        settledAt: new Date()
                    }).where(eq(bets.id, bet.id))
                    settledCount++
                }
                continue;
            }

            // Normal Settlement Logic (Live or Finished)
            let betUpdated = false
            const updatedSelections = selections.map(s => {
                const isPending = !s.status || s.status === 'pending'
                if (s.matchId === matchId && isPending) {
                    const resolution = isSelectionWinner(s.selectionId, s.marketName || "Match Winner", s.label || "", match, result || {})
                    // console.log(`[DEBUG] Selection ${s.selectionId} resolution:`, JSON.stringify(resolution));

                    if (resolution.resolved) {
                        betUpdated = true
                        let newStatus = resolution.isWin ? 'won' : 'lost'
                        if (resolution.isVoid) newStatus = 'void'
                        // console.log(`[DEBUG] Updating selection ${s.selectionId} status to: ${newStatus}`);
                        return { ...s, status: newStatus }
                    }
                }
                return s
            })

            if (!betUpdated) continue

            // Check if entire bet is decided
            const allDecided = updatedSelections.every(s => s.status && s.status !== 'pending')
            const stillDecidedWin = updatedSelections.every(s => s.status === 'won' || s.status === 'void')
            const hasLostLeg = updatedSelections.some(s => s.status === 'lost')

            if (bet.mode === 'system' && bet.combinations) {
                // System Bet Settlement
                const isFinished = allDecided;

                // For a system bet, we can only be sure it's fully lost if NO combination can win
                // Or we can just wait until ALL legs are decided to settle it
                if (!isFinished) {
                    await db.update(bets).set({
                        selections: updatedSelections,
                        updatedAt: new Date()
                    }).where(eq(bets.id, bet.id))
                    continue;
                }

                // Calculate Payout for System Bet
                let newPayout = 0;
                let wonCombinations = 0;
                let totalCombinations = 0;

                const combos = bet.combinations as Array<Array<{ selectionId: string, odds: number }>>;
                totalCombinations = combos.length;

                for (const combo of combos) {
                    // Check if this combination won
                    let comboWin = true;
                    let comboOdds = 1;

                    for (const comboLeg of combo) {
                        const matchingLeg = updatedSelections.find((s: any) => s.selectionId === comboLeg.selectionId);
                        if (!matchingLeg || matchingLeg.status === 'lost') {
                            comboWin = false;
                            break;
                        }
                        if (matchingLeg.status === 'void') {
                            // void legs are odds = 1
                            comboOdds *= 1;
                        } else {
                            comboOdds *= matchingLeg.odds;
                        }
                    }

                    if (comboWin) {
                        wonCombinations++;
                        newPayout += (bet.stake * comboOdds); // stake here is per-bet stake
                    }
                }

                const sysFinalStatus = newPayout > 0 ? "won" : "lost";

                if (!skipFinancials && sysFinalStatus === 'won') {
                    // Adjust payout against max payout constraint if needed
                    const { FINANCE_LIMITS } = await import("@/lib/constants")
                    newPayout = Math.min(newPayout, FINANCE_LIMITS.BET.MAX_PAYOUT)

                    await db.update(bets).set({
                        status: 'won',
                        selections: updatedSelections,
                        potentialPayout: newPayout,
                        settledAt: new Date(),
                        updatedAt: new Date()
                    }).where(eq(bets.id, bet.id))

                    const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
                    if (userWallet.length > 0) {
                        const wallet = userWallet[0]
                        await db.update(wallets).set({
                            balance: sql`${wallets.balance} + ${newPayout}`,
                            updatedAt: new Date()
                        }).where(eq(wallets.userId, bet.userId))

                        await db.insert(transactions).values({
                            id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                            userId: bet.userId,
                            walletId: wallet.id,
                            amount: newPayout,
                            type: "bet_payout",
                            balanceBefore: wallet.balance,
                            balanceAfter: Number(wallet.balance) + newPayout,
                            reference: bet.id,
                            description: `System Bet Win (${wonCombinations}/${totalCombinations}): ${bet.id}`
                        })
                    }
                    settledCount++
                } else if (!skipFinancials && sysFinalStatus === 'lost') {
                    await db.update(bets).set({
                        status: 'lost',
                        selections: updatedSelections,
                        settledAt: new Date(),
                        updatedAt: new Date()
                    }).where(eq(bets.id, bet.id))
                    settledCount++
                } else {
                    // Already settled, just update selections
                    await db.update(bets).set({
                        status: sysFinalStatus,
                        selections: updatedSelections,
                        potentialPayout: newPayout > 0 ? newPayout : bet.potentialPayout,
                        updatedAt: new Date()
                    }).where(eq(bets.id, bet.id))
                }

            } else {
                // Standard Multi/Single Settlement
                if (hasLostLeg) {
                    // Bet is LOST
                    if (!skipFinancials) {
                        await db.update(bets).set({
                            status: 'lost',
                            selections: updatedSelections,
                            settledAt: new Date(),
                            updatedAt: new Date()
                        }).where(eq(bets.id, bet.id))
                        settledCount++
                    } else if (betStatus === 'lost') {
                        // Just update selections for a bet already marked lost
                        await db.update(bets).set({
                            selections: updatedSelections,
                            updatedAt: new Date()
                        }).where(eq(bets.id, bet.id))
                    }
                } else if (allDecided && stillDecidedWin) {
                    // Bet is WON
                    const payoutAmount = bet.potentialPayout

                    // Payout adjustment (e.g. if some legs were voided during this or previous runs)
                    const currentTotalOdds = updatedSelections.reduce((acc, curr) => acc * (curr.status === 'void' ? 1.0 : curr.odds), 1)

                    if (!skipFinancials) {
                        await db.update(bets).set({
                            status: 'won',
                            selections: updatedSelections,
                            settledAt: new Date(),
                            updatedAt: new Date()
                        }).where(eq(bets.id, bet.id))

                        const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
                        if (userWallet.length > 0) {
                            const wallet = userWallet[0]
                            await db.update(wallets).set({
                                balance: sql`${wallets.balance} + ${payoutAmount}`,
                                updatedAt: new Date()
                            }).where(eq(wallets.userId, bet.userId))

                            await db.insert(transactions).values({
                                id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                                userId: bet.userId,
                                walletId: wallet.id,
                                amount: payoutAmount,
                                type: "bet_payout",
                                balanceBefore: wallet.balance,
                                balanceAfter: Number(wallet.balance) + payoutAmount,
                                reference: bet.id,
                                description: `Multi/Single Leg Win Payout: ${bet.id}`
                            })
                        }
                        settledCount++
                    } else if (betStatus === 'won') {
                        // Just update selections for a bet already marked won
                        await db.update(bets).set({
                            selections: updatedSelections,
                            updatedAt: new Date()
                        }).where(eq(bets.id, bet.id))
                    }
                } else {
                    // Bet is still pending (partial legs won), just update the selections
                    // console.log(`[DEBUG] Updating bet ${bet.id} selections (pending)...`);
                    await db.update(bets).set({
                        selections: updatedSelections,
                        updatedAt: new Date()
                    }).where(eq(bets.id, bet.id))
                }
            }
        }

        // Final Match Status Transition: Finished -> Settled
        // This signifies that all bets for this match have been processed at least once in its finished state.
        // We refetch the status to ensure we are seeing the latest update from the admin action
        const finalCheck = await db.select({ status: matches.status }).from(matches).where(eq(matches.id, matchId)).limit(1)
        if (finalCheck.length > 0 && (finalCheck[0].status === 'finished' || finalCheck[0].status === 'locked' || finalCheck[0].status === 'live')) {
            await db.update(matches).set({ status: 'settled' }).where(eq(matches.id, matchId))
        }

        return { success: true, settledCount }

    } catch (error) {
        console.error("Settlement error:", error)
        return { success: false, error: "Failed to settle bets" }
    }
}

/**
 * Intelligent Market Settlement Logic
 */
export function isSelectionWinner(
    selectionId: string,
    marketName: string,
    label: string,
    match: Match,
    result: { winner?: string, scores?: Record<string, number>, metadata?: Record<string, unknown> }
): { resolved: boolean, isWin: boolean, isVoid?: boolean, basis?: string } {
    const sport = (match.sportType || 'football').toLowerCase()
    const metadata = (result.metadata || {}) as Record<string, any>
    const scores = result.scores || {}
    const participants = match.participants || []

    // 0. MANUAL OVERRIDE (Explicit Outcomes from Admin)
    const outcomes = (metadata.outcomes as Record<string, string>) || {}
    const normalizedMarket = marketName.toLowerCase().trim()
    const selectionKey = `${marketName}:${label}`.toLowerCase().trim()

    // 0a. Check for Selection-Level Override (e.g. "Over/Under 2.5:Over" -> "won")
    if (outcomes[selectionKey]) {
        if (outcomes[selectionKey] === 'void') return { resolved: true, isWin: false, isVoid: true, basis: "Manual Override" }
        if (outcomes[selectionKey] === 'won') return { resolved: true, isWin: true, basis: "Manual Override" }
        if (outcomes[selectionKey] === 'lost') return { resolved: true, isWin: false, basis: "Manual Override" }
    }

    // 0b. Check for legacy Market-Level Override (e.g. "Match Winner" -> "team-id")
    const overrideKey = Object.keys(outcomes).find(k => k.toLowerCase().trim() === normalizedMarket)
    if (overrideKey && outcomes[overrideKey]) {
        if (outcomes[overrideKey] === 'void') {
            return { resolved: true, isWin: false, isVoid: true, basis: "Manual Override" }
        }
        return { resolved: true, isWin: outcomes[overrideKey] === selectionId, basis: "Manual Override" }
    }

    // Virtuals Adapter: If it's a virtual match outcome
    const isVirtualOutcome = (result as any).winnerIndex !== undefined && Array.isArray((result as any).totalScores);
    const vOutcome = isVirtualOutcome ? (result as any) : null;

    // Normalize Market Name for robust matching (Remove spaces/special chars)
    const norm = marketName.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
    // console.log(`[DEBUG] Market: ${marketName}, Normalized: ${norm}, Label: ${label}`);

    // Period detection (HT vs FT)
    const isHT = (norm.includes("ht") && !norm.includes("ft")) ||
        norm.includes("1h") ||
        norm.includes("1sthalf") ||
        norm.includes("firsthalf")

    const isHTFT = norm.includes("htft") || norm.includes("halftimefulltime")

    // Market Type Detection with Aliases (Fuzzy Matching)
    const isMatchWinner = !isHT && !isHTFT && (
        norm.includes("winner") ||
        norm.includes("1x2") ||
        norm.includes("win") ||
        norm.includes("result") ||
        norm.includes("12") ||
        norm.includes("homeaway") ||
        norm.includes("moneyline")
    )

    const isTotal = (norm.includes("total") ||
        norm.includes("overunder") ||
        norm.includes("goals") ||
        norm.includes("points") ||
        (norm.includes("ou") && !norm.includes("double")) || // Avoid 'double' overlap
        norm.includes("tg") ||
        norm.includes("tp") ||
        norm.includes("gls") ||
        norm.includes("run") ||
        norm.includes("wickets")) && !isHTFT

    const isBTTS = norm.includes("btts") ||
        norm.includes("bothteamstoscore") ||
        norm.includes("bts") ||
        norm.includes("bothscore") ||
        norm.includes("gg") || // Goal Goal
        norm.includes("goalgoal")

    const isHandicap = norm.includes("handicap") ||
        norm.includes("spread") ||
        norm.includes("hcap") ||
        norm.includes("hc")

    const isDoubleChance = norm.includes("doublechance") || norm.includes("dc") || norm.includes("doubleres")

    const isDNB = norm.includes("drawnobet") ||
        norm.includes("dnb") ||
        norm.includes("drawno")

    const isWinningMargin = norm.includes("winningmargin") || norm.includes("margin")

    const isFirstGoal = norm.includes("firstteam") ||
        norm.includes("firstgoal") ||
        norm.includes("teamtoscorefirst") ||
        norm.includes("fg") ||
        norm.includes("1stgoal")

    const isOddEven = (norm.includes("oddeven") || (norm.includes("odd") || norm.includes("even"))) && !norm.includes("over") && !isTotal

    // console.log(`[DEBUG] Flags for ${norm}: MW=${isMatchWinner}, T=${isTotal}, BTTS=${isBTTS}, DC=${isDoubleChance}, DNB=${isDNB}, WM=${isWinningMargin}`);

    // --- ALIAS-AWARE HELPERS ---
    const getParticipant = (idOrName: string) => {
        const clean = idOrName.trim().toLowerCase();
        return participants.find(p =>
            p.schoolId.toLowerCase() === clean ||
            p.name.trim().toLowerCase() === clean ||
            (Array.isArray(p.aliases) && p.aliases.some(a => a.trim().toLowerCase() === clean))
        );
    };

    const isDrawSelected = (idOrLabel: string) => {
        const clean = idOrLabel.toLowerCase().trim();
        return clean === 'x' || clean.includes('draw') || clean === 'drawmatch';
    };

    // Auto-resolve winner if missing but scores exist
    let currentWinner = result.winner;
    if (!currentWinner && sport !== 'quiz') {
        const pIds = Object.keys(scores);
        if (pIds.length >= 2) {
            const s1 = scores[pIds[0]];
            const s2 = scores[pIds[1]];
            if (s1 > s2) currentWinner = pIds[0];
            else if (s2 > s1) currentWinner = pIds[1];
            else if (typeof s1 === 'number' && typeof s2 === 'number') currentWinner = 'X';
        }
    }

    const getTeamScore = (idOrName: string, scoreMap: Record<string, number> = scores) => {
        if (scoreMap[idOrName] !== undefined) return scoreMap[idOrName];
        const p = getParticipant(idOrName);
        if (p) {
            if (scoreMap[p.schoolId] !== undefined) return scoreMap[p.schoolId];
            if (scoreMap[p.name] !== undefined) return scoreMap[p.name];
        }
        return undefined;
    };

    const isMatchWinnerInternal = (teamIdOrName: string) => {
        if (currentWinner === teamIdOrName) return true;
        if (isDrawSelected(teamIdOrName)) return currentWinner === 'X';

        const p = getParticipant(teamIdOrName);
        if (p) {
            return currentWinner === p.schoolId || currentWinner === p.name;
        }

        // Home/Away shortcuts
        if (teamIdOrName === '1' && participants[0]) return currentWinner === participants[0].schoolId;
        if (teamIdOrName === '2' && participants[1]) return currentWinner === participants[1].schoolId;

        return false;
    };
    // ----------------------------

    // 1. HT/FT (Half Time / Full Time)
    if (isHTFT) {
        const isFinished = match.status === 'finished' || match.status === 'settled' || (currentWinner && currentWinner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        const footballDetails = (metadata.footballDetails as Record<string, { ht: number, ft: number }>) || {}
        if (Object.keys(footballDetails).length < 2) return { resolved: false, isWin: false }

        const p1 = participants[0]?.schoolId
        const p2 = participants[1]?.schoolId

        const h1 = footballDetails[p1]?.ht || 0
        const a1 = footballDetails[p2]?.ht || 0
        const htRes = h1 > a1 ? '1' : (a1 > h1 ? '2' : 'X')

        const h2 = footballDetails[p1]?.ft || 0
        const a2 = footballDetails[p2]?.ft || 0
        const ftRes = h2 > a2 ? '1' : (a2 > h2 ? '2' : 'X')

        const combinedResult = `${htRes}/${ftRes}` // e.g. "X/1", "1/1"
        return {
            resolved: true,
            isWin: selectionId === combinedResult || label === combinedResult,
            basis: `HT: ${h1}-${a1}, FT: ${h2}-${a2}`
        }
    }

    // 2. FIRST HALF WINNER / TOTALS (Prioritize HT over FT)
    if (isHT) {
        const footballDetails = (metadata.footballDetails as Record<string, { ht: number, ft: number }>) || {}
        const hasHTScores = Object.values(footballDetails).some(d => d.ht !== undefined)
        const isHTDecided = hasHTScores || (match.status === 'finished' || match.status === 'settled' || match.status === 'HT' || match.status === '2nd Half') || (typeof metadata.period === 'string' && ["HT", "2H", "finished"].includes(metadata.period))

        if (!isHTDecided) return { resolved: false, isWin: false }

        const htScores: Record<string, number> = {}
        Object.entries(footballDetails).forEach(([id, data]) => htScores[id] = data.ht)

        if (norm.includes("winner") || norm.includes("result") || norm === "1h" || norm === "ht") {
            if (isDrawSelected(selectionId) || isDrawSelected(label)) {
                const values = Object.values(htScores)
                return { resolved: true, isWin: values.length >= 2 && values.every(v => v === values[0]) }
            }
            const myScore = getTeamScore(selectionId, htScores)
            const otherScores = Object.entries(htScores).filter(([id]) => id !== selectionId).map(([_, s]) => s)
            const htScoreStr = Object.entries(htScores).map(([_, s]) => s).join('-')
            return {
                resolved: true,
                isWin: myScore !== undefined && otherScores.every(os => myScore > os),
                basis: `HT Score: ${htScoreStr}`
            }
        }

        if (norm.includes("total") || norm.includes("goals") || norm.includes("ou") || norm.includes("tg")) {
            const totalHT = Object.values(htScores).reduce((a, b) => a + (b || 0), 0)
            const target = parseFloat(label.match(/[\d.]+/)?.[0] || "0")
            const basis = `Total HT Goals: ${totalHT}`
            if (label.toLowerCase().includes("over")) return { resolved: true, isWin: totalHT > target, basis }
            if (label.toLowerCase().includes("under")) return { resolved: true, isWin: totalHT < target, basis }
        }

        return { resolved: false, isWin: false }
    }

    // 3. MATCH WINNER (1X2 / 12)
    if (isMatchWinner) {
        const isFinished = match.status === 'finished' || match.status === 'settled' || (currentWinner && currentWinner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        if (isDrawSelected(selectionId) || isDrawSelected(label)) {
            const basis = isVirtualOutcome ? `V-Score: ${vOutcome.totalScores.join('-')}` : `Score: ${Object.values(scores).join(' - ')}`;
            if (isVirtualOutcome) {
                const vScores = vOutcome.totalScores;
                if (vScores.length === 2) return { resolved: true, isWin: vScores[0] === vScores[1], basis };
                return { resolved: true, isWin: false, basis };
            }
            return { resolved: true, isWin: currentWinner === 'X', basis };
        }

        const mwBasis = isVirtualOutcome ? `V-Score: ${vOutcome.totalScores.join('-')}` : `Score: ${Object.values(scores).join(' - ')}`;
        if (isVirtualOutcome) {
            const winnerName = vOutcome.schools[vOutcome.winnerIndex];
            const normalizedSid = selectionId.startsWith('v-') ? selectionId.substring(2) : selectionId;

            if (selectionId === "1") return { resolved: true, isWin: vOutcome.winnerIndex === 0, basis: mwBasis };
            if (selectionId === "2") return { resolved: true, isWin: vOutcome.winnerIndex === 1, basis: mwBasis };
            return { resolved: true, isWin: winnerName === normalizedSid, basis: mwBasis };
        }

        if (isMatchWinnerInternal(selectionId) || isMatchWinnerInternal(label)) return { resolved: true, isWin: true, basis: mwBasis };

        // Final score check fallback
        const myScore = getTeamScore(selectionId)
        if (myScore !== undefined) {
            const participant = getParticipant(selectionId)
            const targetId = participant?.schoolId || selectionId
            const otherScores = Object.entries(scores).filter(([id]) => id !== targetId).map(([_, s]) => s);
            return { resolved: true, isWin: otherScores.every(os => myScore > os), basis: mwBasis };
        }

        return { resolved: true, isWin: false, basis: mwBasis };
    }

    // 4. TOTAL POINTS / GOALS (Over/Under)
    if (isTotal) {
        const totalScore = isVirtualOutcome
            ? (vOutcome.totalScores as number[]).reduce((a, b) => a + b, 0)
            : Object.values(scores).reduce((a, b) => a + b, 0)

        const target = parseFloat(label.match(/[\d.]+/)?.[0] || "0")
        if (isNaN(target)) return { resolved: false, isWin: false }

        const isOver = label.toLowerCase().includes("over")
        const isUnder = label.toLowerCase().includes("under")

        const basis = `Total: ${totalScore}`
        // If it's already "Over" the line, it's resolved even if match is live
        if (isOver && totalScore > target) return { resolved: true, isWin: true, basis }

        // If match is finished, resolve definitively
        if (match.status === 'finished' || match.status === 'settled') {
            return { resolved: true, isWin: isOver ? totalScore > target : totalScore < target, basis }
        }

        // If it's "Under" and we already passed it, it's lost
        if (isUnder && totalScore > target) return { resolved: true, isWin: false, basis }

        return { resolved: false, isWin: false }
    }

    // 5. QUIZ ROUND WINNER
    // 5. QUIZ ROUND WINNER
    if (norm.includes("round") && norm.includes("winner")) {
        const roundNum = norm.match(/\d+/)?.[0]
        if (!roundNum) return { resolved: false, isWin: false }

        const roundKey = `r${roundNum}`
        const quizDetails = (metadata.quizDetails as Record<string, Record<string, number>>) || {}
        const roundResolved = participants.every(p => {
            const score = quizDetails[p.schoolId]?.[roundKey]
            return score !== undefined && !isNaN(score)
        })

        if (!roundResolved) return { resolved: false, isWin: false }

        const roundScores: Record<string, number> = {}
        participants.forEach(p => roundScores[p.schoolId] = quizDetails[p.schoolId][roundKey])

        const myScore = roundScores[selectionId] !== undefined ? roundScores[selectionId] :
            (getParticipant(selectionId) ? roundScores[getParticipant(selectionId)!.schoolId] : undefined)

        const targetId = getParticipant(selectionId)?.schoolId || selectionId
        const otherScores = Object.entries(roundScores).filter(([id]) => id !== targetId).map(([_, s]) => s)

        if (isDrawSelected(selectionId) || isDrawSelected(label)) {
            return { resolved: true, isWin: Object.values(roundScores).every(v => v === Object.values(roundScores)[0]) }
        }

        return { resolved: true, isWin: myScore !== undefined && otherScores.every(os => myScore > os) }
    }

    // 6. HANDICAP / SPREAD
    if (isHandicap) {
        const isFinished = match.status === 'finished' || match.status === 'settled' || (currentWinner && currentWinner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        const lineSign = label.includes("+") ? "+" : "-"
        const [targetName, lineValueStr] = label.split(lineSign)
        const line = parseFloat(`${lineSign}${lineValueStr}`)

        const participant = getParticipant(targetName || selectionId)
        if (!participant) return { resolved: false, isWin: false }

        const targetId = participant.schoolId
        const myScore = scores[targetId] || 0
        const adjustedScore = myScore + line
        const otherScores = Object.entries(scores).filter(([id]) => id !== targetId).map(([_, s]) => s)
        const basis = `Adj. Score: ${adjustedScore} (vs ${otherScores.join('/')})`

        return { resolved: true, isWin: otherScores.every(os => adjustedScore > os), basis }
    }

    // 7. BTTS (Both Teams to Score)
    if (isBTTS) {
        const isFinishedOrSettled = match.status === 'finished' || match.status === 'settled'
        if (!isFinishedOrSettled && !Object.values(scores).every(s => s > 0)) return { resolved: false, isWin: false }

        const bothScored = Object.values(scores).length >= 2 && Object.values(scores).every(s => s > 0)
        const basis = bothScored ? "Both Scored: YES" : "Both Scored: NO"
        if (selectionId === "Yes" || label.toLowerCase() === "yes") return { resolved: true, isWin: bothScored, basis }
        if (selectionId === "No" || label.toLowerCase() === "no") return { resolved: true, isWin: !bothScored, basis }
    }

    // 8. DOUBLE CHANCE
    if (isDoubleChance) {
        const isFinished = match.status === 'finished' || match.status === 'settled' || (currentWinner && currentWinner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        const homeId = participants[0]?.schoolId
        const awayId = participants[1]?.schoolId
        const winner = currentWinner
        const l = label.toLowerCase()
        console.log(`[DEBUG] Double Chance Match! Winner: ${winner}, Label: ${label}`);

        // Handle standard keys
        if (selectionId === "1X" || label === "1X") return { resolved: true, isWin: winner === homeId || winner === 'X' }
        if (selectionId === "12" || label === "12") return { resolved: true, isWin: winner === homeId || winner === awayId }
        if (selectionId === "X2" || label === "X2") return { resolved: true, isWin: winner === awayId || winner === 'X' }

        // Handle descriptive labels (e.g. "Team1 or Draw")
        if (l.includes("or draw") || l.includes("/draw")) {
            const teamName = label.split(/ or |\/| or Draw/i)[0].trim().toLowerCase()
            const p = getParticipant(teamName)
            console.log(`[DEBUG] Descriptive check: teamName=${teamName}, foundParticipant=${p?.schoolId}`);
            if (p) {
                const win = winner === p.schoolId || winner === 'X';
                console.log(`[DEBUG] Result for ${teamName}: ${win}`);
                return { resolved: true, isWin: win }
            }
        }
        if (l.includes("draw or ")) {
            const teamName = label.split(/draw or /i)[1].trim().toLowerCase()
            const p = getParticipant(teamName)
            if (p) {
                return { resolved: true, isWin: winner === p.schoolId || winner === 'X' }
            }
        }
        // Handle "Team1 or Team2"
        if (l.includes(" or ") && !l.includes("draw")) {
            const parts = label.split(/ or /i)
            const p1 = getParticipant(parts[0].trim().toLowerCase())
            const p2 = getParticipant(parts[1].trim().toLowerCase())
            const winnerStr = winner === homeId ? 'Home' : (winner === awayId ? 'Away' : 'Draw')
            const basis = `Result: ${winnerStr}`
            if (p1 && p2) {
                return { resolved: true, isWin: winner === p1.schoolId || winner === p2.schoolId, basis }
            }
        }
    }

    // 9. DRAW NO BET
    if (isDNB) {
        const isFinished = match.status === 'finished' || match.status === 'settled' || (currentWinner && currentWinner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        const basis = `Winner: ${currentWinner}`
        if (currentWinner === 'X') return { resolved: true, isWin: false, isVoid: true, basis }
        return { resolved: true, isWin: isMatchWinnerInternal(selectionId) || isMatchWinnerInternal(label), basis }
    }

    // 10. WINNING MARGIN
    // 10. WINNING MARGIN
    if (isWinningMargin) {
        const isFinished = match.status === 'finished' || match.status === 'settled' || (currentWinner && currentWinner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        const values = Object.values(scores)
        if (values.length < 2) return { resolved: false, isWin: false }

        const p1 = participants[0]?.schoolId
        const p2 = participants[1]?.schoolId
        const s1 = scores[p1] || 0
        const s2 = scores[p2] || 0

        const diff = Math.abs(s1 - s2)
        const victor = s1 > s2 ? '1' : (s2 > s1 ? '2' : 'X')
        const isHomeLeg = victor === '1'
        const labelLower = label.toLowerCase()

        const basis = `Margin: ${victor}-${diff}`
        if (isHomeLeg && labelLower.includes('home by')) {
            if (labelLower.includes('+') && diff >= parseInt(labelLower.match(/\d+/)?.[0] || "0")) return { resolved: true, isWin: true, basis }
            return { resolved: true, isWin: diff === parseInt(labelLower.match(/\d+/)?.[0] || "0"), basis }
        }
        if (!isHomeLeg && labelLower.includes('away by')) {
            if (labelLower.includes('+') && diff >= parseInt(labelLower.match(/\d+/)?.[0] || "0")) return { resolved: true, isWin: true, basis }
            return { resolved: true, isWin: diff === parseInt(labelLower.match(/\d+/)?.[0] || "0"), basis }
        }

        return { resolved: true, isWin: false, basis }
    }

    // 11. FIRST TEAM TO SCORE
    if (isFirstGoal) {
        const firstScorerId = metadata.firstScorerId
        const isFinishedOrSettled = match.status === 'finished' || match.status === 'settled'
        if (!firstScorerId && !isFinishedOrSettled) return { resolved: false, isWin: false }

        const totalGoals = Object.values(scores).reduce((a, b) => a + b, 0)
        if (isFinishedOrSettled && totalGoals === 0) {
            return { resolved: true, isWin: selectionId === 'none' || label.toLowerCase().includes('no goal') }
        }

        if (firstScorerId) {
            const pScorer = getParticipant(firstScorerId)
            const basis = `First Goal: ${pScorer?.name || firstScorerId}`
            if (firstScorerId === selectionId) return { resolved: true, isWin: true, basis }
            const p = getParticipant(selectionId)
            if (p && p.schoolId === firstScorerId) return { resolved: true, isWin: true, basis }
            const pLabel = getParticipant(label)
            if (pLabel && pLabel.schoolId === firstScorerId) return { resolved: true, isWin: true, basis }
            return { resolved: true, isWin: false, basis }
        }

        return { resolved: false, isWin: false }
    }

    // 12. ODD/EVEN TOTAL GOALS
    if (isOddEven) {
        const isFinished = match.status === 'finished' || match.status === 'settled' || (currentWinner && currentWinner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }
        const totalGoals = Object.values(scores).reduce((a, b) => a + (b || 0), 0)
        const isOdd = totalGoals % 2 !== 0
        const basis = `Total: ${totalGoals} (${isOdd ? 'Odd' : 'Even'})`
        if (selectionId.toLowerCase() === 'odd' || label.toLowerCase() === 'odd') return { resolved: true, isWin: isOdd, basis }
        if (selectionId.toLowerCase() === 'even' || label.toLowerCase() === 'even') return { resolved: true, isWin: !isOdd, basis }
    }

    // Default Fallback
    return { resolved: false, isWin: false }
}

export async function settleOutrightBets(tournamentId: string, winnerId: string) {
    try {
        console.log(`Starting settlement for tournament outrights: ${tournamentId}`)

        // 1. Fetch all PENDING bets that contain an outright prediction for this tournament
        const allPendingBets = await db.select().from(bets).where(eq(bets.status, "pending"))
        const pendingBets = allPendingBets.filter(bet => {
            const selections = bet.selections as unknown as Array<{ tournamentId?: string, marketName: string }> | null
            return selections?.some(s => s.tournamentId === tournamentId && (s.marketName === "Tournament Winner" || s.marketName === "Outright Winner"))
        })

        console.log(`Found ${pendingBets.length} pending outright bets to settle`)

        let settledCount = 0

        for (const bet of pendingBets) {
            const selections = bet.selections as unknown as Array<{
                tournamentId?: string,
                selectionId: string,
                odds: number,
                marketName: string,
                status?: string
            }>

            if (bet.status !== "pending") continue;

            const updatedSelections = selections.map(s => {
                if (s.tournamentId === tournamentId && (s.marketName === "Tournament Winner" || s.marketName === "Outright Winner")) {
                    return { ...s, status: s.selectionId === winnerId ? 'won' : 'lost' }
                }
                return s
            })

            // Since outrights are SINGLES (enforced at placement), the bet status is simply the selection status
            const outrightSelection = updatedSelections.find(s => s.tournamentId === tournamentId)
            if (!outrightSelection) continue

            const isWin = outrightSelection.status === 'won'
            const finalStatus = isWin ? 'won' : 'lost'

            if (isWin) {
                const payoutAmount = bet.potentialPayout
                const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)

                if (userWallet.length > 0) {
                    const wallet = userWallet[0]
                    const balanceBefore = parseFloat(wallet.balance.toString())
                    const balanceAfter = balanceBefore + payoutAmount

                    await db.update(wallets).set({ balance: balanceAfter }).where(eq(wallets.userId, bet.userId))

                    await db.insert(transactions).values({
                        id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                        userId: bet.userId,
                        walletId: wallet.id,
                        amount: payoutAmount,
                        type: "bet_payout",
                        balanceBefore,
                        balanceAfter,
                        reference: bet.id,
                        description: `Outright Winner Payout: ${bet.id}`
                    })
                }
            }

            await db.update(bets).set({
                status: finalStatus,
                selections: updatedSelections,
                settledAt: new Date()
            }).where(eq(bets.id, bet.id))

            settledCount++
        }

        return { success: true, settledCount }
    } catch (error) {
        console.error("Outright settlement error:", error)
        return { success: false, error: "Failed to settle outright bets" }
    }
}

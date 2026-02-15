
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

async function main() {
    console.log("--- Starting Bonus System Verification ---")

    // Dynamic import to ensure env vars are loaded first
    const { createBonus, getUserBonuses, getReferralStats } = await import("@/lib/bonus-actions")
    const { db } = await import("@/lib/db")

    // 1. Get a test user (or create one if needed, but better to use existing)
    const testUser = await db.query.users.findFirst()

    if (!testUser) {
        console.error("No users found to test with.")
        return
    }

    console.log(`Testing with user: ${testUser.name} (${testUser.id})`)

    // 2. Test Referral Stats (Should generate code if missing)
    console.log("\n1. Testing getReferralStats...")
    const stats = await getReferralStats(testUser.id)
    console.log("Referral Stats:", stats)

    if (!stats?.code) {
        console.error("FAILED: Referral code not generated.")
    } else {
        console.log("PASSED: Referral code exists:", stats.code)
    }

    // 3. Test Issue Bonus
    console.log("\n2. Testing createBonus...")
    const bonusAmount = 50
    const result = await createBonus({
        userId: testUser.id,
        type: "manual_test",
        amount: bonusAmount,
        daysValid: 7
    })

    if (result.success) {
        console.log("PASSED: Bonus created successfully.")
    } else {
        console.error("FAILED: Bonus creation failed:", result.error)
    }

    // 4. Test Get User Bonuses
    console.log("\n3. Testing getUserBonuses...")
    const { active, history } = await getUserBonuses(testUser.id)

    console.log(`Active Bonuses: ${active.length}`)
    console.log(`History Bonuses: ${history.length}`)

    const foundBonus = active.find((b: any) => b.type === "manual_test" && b.amount === bonusAmount)

    if (foundBonus) {
        console.log("PASSED: verification bonus found in active list.")
        console.log("Bonus Details:", foundBonus)
    } else {
        console.error("FAILED: verification bonus not found in active list.")
    }

    console.log("\n--- Verification Complete ---")
}

main().catch(console.error)

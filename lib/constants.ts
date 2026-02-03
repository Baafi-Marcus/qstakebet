
export const FINANCE_LIMITS = {
    DEPOSIT: {
        MIN: 1,
        MAX: 1000
    },
    WITHDRAWAL: {
        MIN: 1,
        MAX: 1000
    },
    BET: {
        MIN_STAKE: 1,
        MAX_STAKE: 20000,
        MAX_PAYOUT: 1000000
    }
}

export const AI_RISK_SETTINGS = {
    ENABLED: true,
    // Target Return to Player (RTP) - typically 85-90%
    TARGET_RTP: 0.88,
    // Max odds allowed to prevent "Longshot" payouts
    MAX_ODDS_CAP: 25.00,
    // Volatility damping: Reduces "Noise" in odds generation
    VOLATILITY_DAMPING: 0.8,
    // "Smart" margin that increases for riskier (lower probability) bets
    DYNAMIC_MARGIN_FACTOR: 1.15
}

export const MULTI_BONUS = {
    // Hard cap on the bonus GIFT amount (GHS)
    MAX_BONUS_AMOUNT_CAP: 250,
    // Minimum selections to qualify for bonus
    MIN_SELECTIONS: 3,
    // Bonus percentage based on selection count
    SCALING: {
        3: 5,   // 3 selections = 5% bonus
        4: 10,  // 4 selections = 10%
        5: 15,  // 5 selections = 15%
        6: 20,  // 6 selections = 20%
        7: 25,  // 7 selections = 25%
        8: 30,  // 8 selections = 30%
        9: 40,  // 9 selections = 40%
        10: 50, // 10 selections = 50%
        15: 100 // 15+ selections = 100%
    }
}

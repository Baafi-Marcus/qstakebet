
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

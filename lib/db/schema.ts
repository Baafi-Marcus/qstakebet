import { pgTable, text, boolean, jsonb, timestamp, real, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const schools = pgTable("schools", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    district: text("district"),
    category: text("category"), // e.g. "A", "B", "C" or Group
    location: text("location"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const tournaments = pgTable("tournaments", {
    id: text("id").primaryKey(),
    name: text("name").notNull(), // e.g. "Ashanti Inter-Schools 2026"
    region: text("region").notNull(),
    sportType: text("sport_type").notNull(), // e.g. "football", "athletics", "quiz"
    gender: text("gender").notNull(), // "male", "female", "mixed"
    year: text("year").notNull(),
    status: text("status").default("active").notNull(), // "active", "completed"
    createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").references(() => tournaments.id),
    participants: jsonb("participants").notNull(), // Array of { schoolId, odd, name, result? }
    startTime: text("start_time").notNull(), // Keep for backward compatibility
    scheduledAt: timestamp("scheduled_at"), // Proper datetime for scheduling
    status: text("status").default("upcoming").notNull(), // "upcoming", "live", "finished", "cancelled"
    result: jsonb("result"), // { winner: schoolId, scores: { schoolId: number }, ... }
    isLive: boolean("is_live").default(false).notNull(),
    stage: text("stage").notNull(), // e.g. "Zone 1", "Quarter Final"
    odds: jsonb("odds").notNull(), // Maintain for backward compatibility or direct access
    extendedOdds: jsonb("extended_odds"),
    isVirtual: boolean("is_virtual").default(false).notNull(),
    sportType: text("sport_type").default("quiz").notNull(),
    gender: text("gender").default("male").notNull(),
    margin: jsonb("margin").default(0.1).notNull(), // Default 10% profit margin
    createdAt: timestamp("created_at").defaultNow(),
});

export const schoolStrengths = pgTable("school_strengths", {
    id: text("id").primaryKey(),
    schoolId: text("school_id").notNull().references(() => schools.id),
    sportType: text("sport_type").notNull(),
    gender: text("gender").notNull(),
    rating: jsonb("rating").notNull(), // 0-100 score
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// USER AUTHENTICATION & WALLET SYSTEM
// ============================================

export const users = pgTable("users", {
    id: text("id").primaryKey(), // Format: usr-xxxxx
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified"),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    phone: text("phone").notNull().unique(),
    role: text("role").default("user").notNull(), // "user", "admin"
    status: text("status").default("active").notNull(), // "active", "suspended", "banned"
    referralCode: text("referral_code").unique(), // User's unique referral code
    referredBy: text("referred_by"), // Referral code used during signup
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    sessionToken: text("session_token").notNull().unique(),
    expires: timestamp("expires").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
    id: text("id").primaryKey(), // Format: wlt-xxxxx
    userId: text("user_id").notNull().references(() => users.id).unique(),
    balance: real("balance").default(0).notNull(),
    bonusBalance: real("bonus_balance").default(0).notNull(),
    currency: text("currency").default("GHS").notNull(), // Ghana Cedis
    lastDepositAt: timestamp("last_deposit_at"),
    lastWithdrawalAt: timestamp("last_withdrawal_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const bets = pgTable("bets", {
    id: text("id").primaryKey(), // Format: bet-xxxxx
    userId: text("user_id").notNull().references(() => users.id),
    selections: jsonb("selections").notNull(), // Array of Selection objects
    stake: real("stake").notNull(),
    totalOdds: real("total_odds").notNull(),
    potentialPayout: real("potential_payout").notNull(),
    status: text("status").default("pending").notNull(), // "pending", "won", "lost", "void"
    bonusUsed: text("bonus_id"), // If bonus was used
    isBonusBet: boolean("is_bonus_bet").default(false).notNull(),
    bonusAmountUsed: real("bonus_amount_used").default(0),
    settledAt: timestamp("settled_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
    id: text("id").primaryKey(), // Format: txn-xxxxx
    userId: text("user_id").notNull().references(() => users.id),
    walletId: text("wallet_id").notNull().references(() => wallets.id),
    type: text("type").notNull(), // "deposit", "withdrawal", "bet_stake", "bet_payout", "bonus", "referral_bonus"
    amount: real("amount").notNull(),
    balanceBefore: real("balance_before").notNull(),
    balanceAfter: real("balance_after").notNull(),
    reference: text("reference"), // bet ID, deposit reference, etc.
    description: text("description"),

    // Moolre Payment Fields
    paymentProvider: text("payment_provider"), // "moolre", "manual"
    paymentReference: text("payment_reference"), // Moolre transaction reference
    paymentStatus: text("payment_status"), // "pending", "success", "failed"
    paymentMethod: text("payment_method"), // "mtn_momo", "telecel_cash", "at_money"
    paymentMetadata: jsonb("payment_metadata"), // Store full Moolre response

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const bonuses = pgTable("bonuses", {
    id: text("id").primaryKey(), // Format: bns-xxxxx
    userId: text("user_id").notNull().references(() => users.id),
    type: text("type").notNull(), // "welcome", "deposit", "referral", "free_bet", "cashback"
    amount: real("amount").notNull(),
    status: text("status").default("active").notNull(), // "active", "used", "expired"

    // Bonus Conditions
    minOdds: real("min_odds"), // Minimum odds requirement
    minSelections: integer("min_selections"), // Minimum selections in bet slip
    expiresAt: timestamp("expires_at"),

    // Tracking
    usedAt: timestamp("used_at"),
    betId: text("bet_id").references(() => bets.id), // If used on a bet

    createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
    id: text("id").primaryKey(),
    referrerId: text("referrer_id").notNull().references(() => users.id),
    referredUserId: text("referred_user_id").notNull().references(() => users.id),
    referralCode: text("referral_code").notNull(),

    // Rewards
    referrerBonus: real("referrer_bonus").default(0),
    referredBonus: real("referred_bonus").default(0),

    // Status
    status: text("status").default("pending").notNull(), // "pending", "completed"
    completedAt: timestamp("completed_at"), // When referred user makes first deposit

    createdAt: timestamp("created_at").defaultNow(),
});

// Type exports
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type SchoolStrength = typeof schoolStrengths.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Bet = typeof bets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Bonus = typeof bonuses.$inferSelect;
export type Referral = typeof referrals.$inferSelect;

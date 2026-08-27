import { pgTable, text, boolean, jsonb, timestamp, real, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const schools = pgTable("schools", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    district: text("district"),
    category: text("category"), // e.g. "A", "B", "C" or Group
    level: text("level").default("shs").notNull(), // "shs", "university", etc.
    location: text("location"),
    parentId: text("parent_id"), // Self-reference for University -> Hall/Dept
    type: text("type").default("school").notNull(), // "school", "hall", "department", "program"
    aliases: jsonb("aliases").default([]).$type<string[]>(), // Old names for backward compatibility
    createdAt: timestamp("created_at").defaultNow(),
});

export const tournaments = pgTable("tournaments", {
    id: text("id").primaryKey(),
    name: text("name").notNull(), // e.g. "Ashanti Inter-Schools 2026"
    region: text("region").notNull(),
    sportType: text("sport_type").notNull(), // e.g. "football", "athletics", "quiz"
    gender: text("gender").notNull(), // "male", "female", "mixed"
    year: text("year").notNull(),
    level: text("level").default("shs").notNull(), // "shs", "university", etc.
    status: text("status").default("active").notNull(), // "active", "completed"
    isOutrightEnabled: boolean("is_outright_enabled").default(false).notNull(),
    outrightOdds: jsonb("outright_odds").default([]).$type<{ schoolId: string, odd: number, status: string }[]>(),
    winnerId: text("winner_id"),
    metadata: jsonb("metadata"), // Groups, Matchdays, Rules
    createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").references(() => tournaments.id),
    participants: jsonb("participants").notNull(), // Array of { schoolId, odd, name, result? }
    startTime: text("start_time"), // Keep for backward compatibility
    scheduledAt: timestamp("scheduled_at"), // Proper datetime for scheduling
    status: text("status").default("upcoming").notNull(), // "upcoming", "live", "finished", "cancelled"
    result: jsonb("result"), // { winner: schoolId, scores: { schoolId: number }, ... }
    isLive: boolean("is_live").default(false).notNull(),
    stage: text("stage").notNull(), // e.g. "Zone 1", "Quarter Final"
    odds: jsonb("odds").notNull(), // Maintain for backward compatibility or direct access
    extendedOdds: jsonb("extended_odds"),
    metadata: jsonb("metadata"), // General market metadata, tooltips, etc.
    baseOdds: jsonb("base_odds").$type<Record<string, number>>(), // Original odds before adjustment
    lastRecalculatedAt: timestamp("last_recalculated_at"),
    currentRound: integer("current_round").default(0).notNull(),
    lastTickAt: timestamp("last_tick_at"),
    autoEndAt: timestamp("auto_end_at"), // Optional specific time to auto-end match
    liveMetadata: jsonb("live_metadata"), // Stores simulation results for global playback
    isVirtual: boolean("is_virtual").default(false).notNull(),
    sportType: text("sport_type").default("quiz").notNull(),
    gender: text("gender").default("male").notNull(),
    group: text("group"), // e.g. "Group A"
    matchday: text("matchday"), // e.g. "Matchday 1"
    margin: jsonb("margin").default(0.1).notNull(), // Default 10% profit margin
    betVolume: jsonb("bet_volume").$type<{
        [selectionId: string]: {
            totalStake: number,
            betCount: number,
            lastUpdated: string
        }
    }>().default({}),
    createdAt: timestamp("created_at").defaultNow(),
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
    username: text("username").unique(), // Public display name (falls back to name)
    phone: text("phone").notNull().unique(),
    phoneVerified: timestamp("phone_verified"),
    role: text("role").default("user").notNull(), // "user", "admin"
    status: text("status").default("active").notNull(), // "active", "suspended", "banned"
    referralCode: text("referral_code").unique(), // User's unique referral code
    referredBy: text("referred_by"), // Referral code used during signup
    linkClicks: integer("link_clicks").default(0).notNull(),
    linkClicksRewardClaimed: boolean("link_clicks_reward_claimed").default(false).notNull(),
    loyaltyPoints: integer("loyalty_points").default(0).notNull(),
    almaMater: text("alma_mater"),
    lifetimePoints: integer("lifetime_points").default(0).notNull(),
    totalFantasyPoints: integer("total_fantasy_points").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralClicks = pgTable("referral_clicks", {
    id: text("id").primaryKey(),
    referralCode: text("referral_code").notNull(),
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
    id: text("id").primaryKey(),
    type: text("type").notNull(), // "text", "image"
    content: text("content"),
    imageUrl: text("image_url"),
    link: text("link"),
    isActive: boolean("is_active").default(true).notNull(),
    priority: integer("priority").default(0).notNull(),
    style: text("style"), // "default", "neon", "gold", "purple", "dark"
    createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    sessionToken: text("session_token").notNull().unique(),
    expires: timestamp("expires").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// Removed wallets table

// Removed transactions table

// Removed bonuses, withdrawal_requests, and referrals tables

export const realSchoolStats = pgTable("real_school_stats", {
    id: text("id").primaryKey(), // rss-xxxxx
    schoolId: text("school_id").notNull().references(() => schools.id),

    // Context
    sportType: text("sport_type").default("football").notNull(),
    gender: text("gender").default("male").notNull(),

    // Performance Tracking
    matchesPlayed: integer("matches_played").default(0),
    wins: integer("wins").default(0),
    losses: integer("losses").default(0),
    draws: integer("draws").default(0),
    goalsFor: integer("goals_for").default(0),
    goalsAgainst: integer("goals_against").default(0),
    points: integer("points").default(0), // League Points (3 for win, 1 for draw)

    currentForm: real("current_form").default(1.0), // 1.0 = Base
    lastUpdated: timestamp("last_updated").defaultNow(),
});

// Removed booked_bets table

export const apiKeys = pgTable("api_keys", {
    id: text("id").primaryKey(), // key-xxxxx
    key: text("key").notNull(),
    provider: text("provider").default("github_models").notNull(), // "github_models", "openai"
    label: text("label"), // e.g. "Primary Key", "Backup 1"
    isActive: boolean("is_active").default(true).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    errorCount: integer("error_count").default(0).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow(),
});

// Removed relations


export const matchHistory = pgTable("match_history", {
    id: text("id").primaryKey(), // mh-xxxxx
    matchId: text("match_id").notNull().references(() => matches.id),
    action: text("action").notNull(), // "score_update", "status_change", "period_change"
    previousData: jsonb("previous_data"), // Previous scores/status
    newData: jsonb("new_data"), // New scores/status
    updatedBy: text("updated_by"), // Admin user ID or "system"
    metadata: jsonb("metadata"), // Additional context (period, time, etc.)
    createdAt: timestamp("created_at").defaultNow(),
});

export const verificationCodes = pgTable("verification_codes", {
    id: text("id").primaryKey(), // vc-xxxxx
    phone: text("phone").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const smsLogs = pgTable("sms_logs", {
    id: text("id").primaryKey(), // sl-xxxxx
    messageId: text("message_id"), // From Vynfy
    phone: text("phone").notNull(),
    message: text("message").notNull(),
    status: text("status").default("pending").notNull(), // "pending", "delivered", "failed"
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
    key: text("key").primaryKey(), // e.g. "maintenance_mode", "min_bet"
    value: jsonb("value").notNull(), // Stoes any JSON data
    description: text("description"),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatRooms = pgTable("chat_rooms", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    creatorId: text("creator_id").references(() => users.id),
    isPublic: boolean("is_public").default(true).notNull(),
    inviteCode: text("invite_code").unique(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
    id: text("id").primaryKey(),
    channel: text("channel").default("global").notNull(),
    roomId: text("room_id").references(() => chatRooms.id),
    userId: text("user_id").notNull().references(() => users.id),
    content: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const chatRoomMembers = pgTable("chat_room_members", {
    id: text("id").primaryKey(),
    roomId: text("room_id").notNull().references(() => chatRooms.id),
    userId: text("user_id").notNull().references(() => users.id),
    joinedAt: timestamp("joined_at").defaultNow(),
});

export const pendingResults = pgTable("pending_results", {
    id: text("id").primaryKey(), // pr-xxxxx
    source: text("source").notNull(), // "twitter", "facebook"
    rawText: text("raw_text").notNull(),
    parsedData: jsonb("parsed_data").notNull(), // { round: number, scores: [{ schoolName: string, score: number }] }
    status: text("status").default("pending").notNull(), // "pending", "approved", "rejected", "ignored"
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const fantasyLineups = pgTable("fantasy_lineups", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    school1Id: text("school1_id").notNull().references(() => schools.id),
    school2Id: text("school2_id").notNull().references(() => schools.id),
    school3Id: text("school3_id").notNull().references(() => schools.id),
    gameWeek: text("game_week").notNull(),
    pointsEarned: integer("points_earned").default(0).notNull(),
    rank: integer("rank"),
    substitutionsMade: integer("substitutions_made").default(0).notNull(),
    creditsSpent: integer("credits_spent").default(0).notNull(),
    status: text("status").default("active").notNull(),
    pointsBreakdown: jsonb("points_breakdown"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const quarterFinalPredictions = pgTable("quarter_final_predictions", {
    id: text("id").primaryKey(), // qfp-xxxxx
    userId: text("user_id").notNull().references(() => users.id),
    predictions: jsonb("predictions").notNull().$type<{ matchId: string; predictedWinnerId: string }[]>(),
    wildcardMatchId: text("wildcard_match_id"),
    masterPickSchoolId: text("master_pick_school_id"),
    pointsEarned: integer("points_earned").default(0).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    lockedAt: timestamp("locked_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const semiFinalPredictions = pgTable("semi_final_predictions", {
    id: text("id").primaryKey(), // sfp-xxxxx
    userId: text("user_id").notNull().references(() => users.id),
    predictions: jsonb("predictions").notNull().$type<{ matchId: string; predictedWinnerId: string; confidence: number }[]>(),
    pointsEarned: integer("points_earned").default(0).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    lockedAt: timestamp("locked_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const grandFinalPredictions = pgTable("grand_final_predictions", {
    id: text("id").primaryKey(), // gfp-xxxxx
    userId: text("user_id").notNull().references(() => users.id),
    championSchoolId: text("champion_school_id").references(() => schools.id),
    runnerUpSchoolId: text("runner_up_school_id").references(() => schools.id),
    marginRange: text("margin_range"), // '1-5', '6-10', '11-20', '21-30', '31+'
    finalBoost: text("final_boost"), // 'champion', 'runner_up', 'margin'
    pointsEarned: integer("points_earned").default(0).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    lockedAt: timestamp("locked_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type QuarterFinalPrediction = typeof quarterFinalPredictions.$inferSelect;
export type SemiFinalPrediction = typeof semiFinalPredictions.$inferSelect;
export type GrandFinalPrediction = typeof grandFinalPredictions.$inferSelect;
export type MatchHistory = typeof matchHistory.$inferSelect;
export type NewMatchHistory = typeof matchHistory.$inferInsert;
export type FantasyLineup = typeof fantasyLineups.$inferSelect;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type PendingResult = typeof pendingResults.$inferSelect;

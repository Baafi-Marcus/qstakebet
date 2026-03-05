CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"content" text,
	"image_url" text,
	"link" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"style" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"provider" text DEFAULT 'github_models' NOT NULL,
	"label" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"selections" jsonb NOT NULL,
	"stake" real NOT NULL,
	"total_odds" real NOT NULL,
	"potential_payout" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"bonus_id" text,
	"is_bonus_bet" boolean DEFAULT false NOT NULL,
	"mode" text DEFAULT 'multi' NOT NULL,
	"bonus_amount_used" real DEFAULT 0,
	"bonus_gift_amount" real DEFAULT 0,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bonuses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" real NOT NULL,
	"initial_amount" real DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"min_odds" real,
	"min_selections" integer,
	"expires_at" timestamp,
	"used_at" timestamp,
	"bet_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "booked_bets" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"selections" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "booked_bets_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "match_history" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"action" text NOT NULL,
	"previous_data" jsonb,
	"new_data" jsonb,
	"updated_by" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "real_school_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"sport_type" text DEFAULT 'football' NOT NULL,
	"gender" text DEFAULT 'male' NOT NULL,
	"matches_played" integer DEFAULT 0,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"draws" integer DEFAULT 0,
	"goals_for" integer DEFAULT 0,
	"goals_against" integer DEFAULT 0,
	"points" integer DEFAULT 0,
	"current_form" real DEFAULT 1,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_clicks" (
	"id" text PRIMARY KEY NOT NULL,
	"referral_code" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referred_user_id" text NOT NULL,
	"referral_code" text NOT NULL,
	"referrer_bonus" real DEFAULT 0,
	"referred_bonus" real DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "sms_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" real NOT NULL,
	"balance_before" real NOT NULL,
	"balance_after" real NOT NULL,
	"reference" text,
	"description" text,
	"payment_provider" text,
	"payment_reference" text,
	"payment_status" text,
	"payment_method" text,
	"payment_metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"password_hash" text NOT NULL,
	"name" text,
	"phone" text NOT NULL,
	"phone_verified" timestamp,
	"role" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"referral_code" text,
	"referred_by" text,
	"link_clicks" integer DEFAULT 0 NOT NULL,
	"link_clicks_reward_claimed" boolean DEFAULT false NOT NULL,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "virtual_school_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"learning_index" real DEFAULT 0,
	"volatility_index" real DEFAULT 0.1,
	"matches_played" integer DEFAULT 0,
	"wins" integer DEFAULT 0,
	"current_form" real DEFAULT 1,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance" real DEFAULT 0 NOT NULL,
	"bonus_balance" real DEFAULT 0 NOT NULL,
	"locked_balance" real DEFAULT 0 NOT NULL,
	"turnover_wagered" real DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'GHS' NOT NULL,
	"last_deposit_at" timestamp,
	"last_withdrawal_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text NOT NULL,
	"account_number" text NOT NULL,
	"account_name" text,
	"admin_id" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "start_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "status" text DEFAULT 'upcoming' NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "result" jsonb;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "base_odds" jsonb;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "last_recalculated_at" timestamp;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "current_round" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "last_tick_at" timestamp;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "auto_end_at" timestamp;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "live_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "group" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "matchday" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "bet_volume" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "level" text DEFAULT 'shs' NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "type" text DEFAULT 'school' NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "aliases" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "level" text DEFAULT 'shs' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "is_outright_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "outright_odds" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "winner_id" text;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_bet_id_bets_id_fk" FOREIGN KEY ("bet_id") REFERENCES "public"."bets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_history" ADD CONSTRAINT "match_history_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_school_stats" ADD CONSTRAINT "real_school_stats_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_school_stats" ADD CONSTRAINT "virtual_school_stats_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
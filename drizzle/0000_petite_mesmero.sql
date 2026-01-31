CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text,
	"participants" jsonb NOT NULL,
	"start_time" text NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"stage" text NOT NULL,
	"odds" jsonb NOT NULL,
	"extended_odds" jsonb,
	"is_virtual" boolean DEFAULT false NOT NULL,
	"sport_type" text DEFAULT 'quiz' NOT NULL,
	"gender" text DEFAULT 'male' NOT NULL,
	"margin" jsonb DEFAULT '0.1'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_strengths" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"sport_type" text NOT NULL,
	"gender" text NOT NULL,
	"rating" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"district" text,
	"category" text,
	"location" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"sport_type" text NOT NULL,
	"gender" text NOT NULL,
	"year" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_strengths" ADD CONSTRAINT "school_strengths_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
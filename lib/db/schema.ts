import { pgTable, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const matches = pgTable("matches", {
    id: text("id").primaryKey(), // Using text to match current ID format ("1", "2")
    schoolA: text("school_a").notNull(),
    schoolB: text("school_b").notNull(),
    schoolC: text("school_c").notNull(),
    startTime: text("start_time").notNull(), // Keeping as string for "10:00 AM" format simplicity, could be timestamp later
    isLive: boolean("is_live").default(false).notNull(),
    stage: text("stage").notNull(),
    odds: jsonb("odds").notNull(), // { schoolA: number, schoolB: number, schoolC: number }
    extendedOdds: jsonb("extended_odds"), // Flexible structure for extended markets
    isVirtual: boolean("is_virtual").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const schools = pgTable("schools", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    district: text("district"),
    category: text("category"), // e.g. "A", "B", "C" or Group
    location: text("location"),
    createdAt: timestamp("created_at").defaultNow(),
});

export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;

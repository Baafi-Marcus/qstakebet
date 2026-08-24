import { z } from "zod";

/**
 * Shared validation rules
 */
const phoneRegex = /^(?:\+233|0)[235]\d{8}$/; // Basic Ghana phone regex
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

/**
 * User Registration Schema
 */
export const RegisterUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string()
        .regex(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 characters (letters, numbers, underscores only)")
        .optional(),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(phoneRegex, "Invalid Ghana phone number (e.g., 024xxxxxxx)"),
    password: passwordSchema,
    referredBy: z.string().optional(),
    almaMater: z.string().optional()
});

/**
 * Username validation rule (shared by register + settings)
 */
export const UsernameSchema = z.string()
    .regex(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 characters (letters, numbers, underscores only)");

/**
 * Admin Registration Schema
 */
export const RegisterAdminSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(phoneRegex, "Invalid Ghana phone number"),
    password: passwordSchema,
    adminToken: z.string().min(1, "Admin registration token is required")
});

/**
 * Login Schema
 */
export const LoginSchema = z.object({
    phone: z.string().regex(phoneRegex, "Invalid phone number"),
    password: z.string().min(1, "Password is required")
});

/**
 * Place Bet Schema
 */
export const SelectionSchema = z.object({
    matchId: z.string(),
    selectionId: z.string(),
    label: z.string(),
    odds: z.number().positive(),
    marketName: z.string(),
    matchLabel: z.string(),
    tournamentId: z.string().optional(),
}).passthrough();

export const PlaceBetSchema = z.object({
    stake: z.number().min(0.01, "Minimum stake is GHS 0.01"),
    selections: z.array(SelectionSchema).min(1, "At least one selection is required"),
    bonusId: z.string().optional(),
    bonusAmount: z.number().default(0),
    mode: z.enum(["single", "multi"]).default("multi")
});

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
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(phoneRegex, "Invalid Ghana phone number (e.g., 024xxxxxxx)"),
    password: passwordSchema,
    referredBy: z.string().optional(),
    otp: z.string().length(6, "OTP must be 6 digits")
});

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
    stake: z.number().min(1, "Minimum stake is GHS 1.00"),
    selections: z.array(SelectionSchema).min(1, "At least one selection is required"),
    bonusId: z.string().optional(),
    bonusAmount: z.number().default(0),
    mode: z.enum(["single", "multi"]).default("multi")
});

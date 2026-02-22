import { headers } from "next/headers";

type RateLimitRecord = {
    count: number;
    resetTime: number;
};

// In-memory cache for rate limiting. 
// Note: In serverless environments, this will reset on cold starts.
// For more robust production use, consider Upstash/Redis.
const cache = new Map<string, RateLimitRecord>();

/**
 * Basic rate limiting utility for server actions
 * @param key The action identifier (e.g., 'login', 'place-bet')
 * @param limit Number of allowed requests in the window
 * @param windowMs Time window in milliseconds (default 1 minute)
 */
export async function rateLimit(key: string, limit: number = 5, windowMs: number = 60000) {
    const headerList = await headers();
    // Get IP address from headers
    const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "anonymous";
    const identifier = `${key}:${ip}`;

    const now = Date.now();
    const record = cache.get(identifier);

    // If no record or window has passed, reset
    if (!record || now > record.resetTime) {
        cache.set(identifier, {
            count: 1,
            resetTime: now + windowMs
        });
        return { success: true };
    }

    // If limit exceeded
    if (record.count >= limit) {
        const secondsLeft = Math.ceil((record.resetTime - now) / 1000);
        return {
            success: false,
            error: `Too many attempts. Please try again in ${secondsLeft} seconds.`,
            retryAfter: secondsLeft
        };
    }

    // Increment count
    record.count++;
    return { success: true };
}

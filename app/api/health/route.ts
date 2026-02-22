import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
    try {
        // 1. Check Database Connectivity
        await db.execute(sql`SELECT 1`);

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                database: "up",
                api: "up"
            },
            version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0"
        }, { status: 200 });

    } catch (error) {
        console.error("Health check failed:", error);

        return NextResponse.json({
            status: "degraded",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error",
            services: {
                database: "down",
                api: "up"
            }
        }, { status: 503 });
    }
}

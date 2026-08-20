import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const depthParam = searchParams.get("depth");
        const depth = depthParam ? parseInt(depthParam) : 5;
        const maxItems = Math.min(Math.max(depth, 1), 100); // Clamp between 1 and 100

        let apifyToken = process.env.APIFY_API_TOKEN;

        if (!apifyToken) {
            const dbKeys = await db.select().from(apiKeys).where(and(eq(apiKeys.provider, "apify"), eq(apiKeys.isActive, true))).limit(1);
            if (dbKeys.length > 0) {
                apifyToken = dbKeys[0].key;
                await db.update(apiKeys).set({ usageCount: dbKeys[0].usageCount + 1, lastUsedAt: new Date() }).where(eq(apiKeys.id, dbKeys[0].id));
            }
        }

        if (!apifyToken) {
            return NextResponse.json({ error: "APIFY_API_TOKEN is not configured in ENV or Database" }, { status: 500 });
        }

        const client = new ApifyClient({
            token: apifyToken,
        });

        // Use a reliable Twitter Scraper (apidojo/tweet-scraper)
        const input = {
            twitterHandles: ["NSMQGhana"],
            maxItems: maxItems,
            sort: "Latest",
            tweetLanguage: "en",
        };

        const host = req.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const appUrl = `${protocol}://${host}`;
        const callbackUrl = `${appUrl}/api/webhooks/apify-sync`;

        console.log(`Starting Apify Twitter Scraper asynchronously (Webhook callback: ${callbackUrl})...`);
        const run = await client.actor("apidojo/tweet-scraper").start(input, {
            webhooks: [
                {
                    eventTypes: ["ACTOR.RUN.SUCCEEDED"],
                    requestUrl: callbackUrl,
                    payloadTemplate: '{"runId": "{{resource.id}}", "defaultDatasetId": "{{resource.defaultDatasetId}}"}'
                }
            ]
        });

        return NextResponse.json({ 
            success: true, 
            message: `Scraper task successfully queued. Apify is fetching the latest ${maxItems} tweets in the background. The queue will update in a few seconds!`,
            runId: run.id
        });

    } catch (error: any) {
        console.error("Error in Apify Twitter sync trigger:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { matches } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qstakebet.vercel.app'

    // Fetch only upcoming & live matches — these are the public-facing pages Google can crawl
    const allMatches = await db.select({ id: matches.id, lastModified: matches.createdAt })
        .from(matches)
        .where(sql`${matches.status} IN ('upcoming', 'live', 'scheduled')`)
        .limit(500)

    const matchEntries = allMatches.map((m) => ({
        url: `${baseUrl}/matches/${m.id}`,   // ✅ correct path: /matches/[id]
        lastModified: m.lastModified || new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
    }))

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 1,
        },
        {
            url: `${baseUrl}/virtuals`,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/live`,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/how-to-play`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/rewards`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/tournaments`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/help`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/cookies`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.2,
        },
        {
            url: `${baseUrl}/account/bonuses`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        ...matchEntries,
    ]
}

import "dotenv/config"
import { db } from "../lib/db"
import { schools } from "../lib/db/schema"
import { eq } from "drizzle-orm"

const TIER_1_KEYWORDS = [
    "presec", "mfantsipim", "prempeh", "opoku ware", 
    "augustine", "adisadel", "achimota"
]

const TIER_2_KEYWORDS = [
    "accra academy", "keta", "mawuli", "peter's snr", "peter's shs",
    "wesley girls", "holy child", "pope john", "gsts", "porter girls"
]

const TIER_3_KEYWORDS = [
    "bishop herman", "kumasi academy", "st. james", "aburi girls", 
    "rose's shs", "winneba", "tamale", "ghana national", "st. thomas aquinas",
    "st. louis snr", "st. louis shs", "yaa asantewaa"
]

async function main() {
    console.log("Starting to seed tiers and credit costs for schools...")
    
    const allSchools = await db.select().from(schools)
    console.log(`Loaded ${allSchools.length} schools from database.`)

    let updatedCount = 0

    for (const school of allSchools) {
        const lowerName = school.name.toLowerCase()
        let tier = 4
        let cost = 10

        if (TIER_1_KEYWORDS.some(kw => lowerName.includes(kw))) {
            tier = 1
            cost = 45
        } else if (TIER_2_KEYWORDS.some(kw => lowerName.includes(kw))) {
            tier = 2
            cost = 30
        } else if (TIER_3_KEYWORDS.some(kw => lowerName.includes(kw))) {
            tier = 3
            cost = 20
        }

        // Apply cost updates to database
        await db.update(schools)
            .set({
                tier,
                creditCost: cost
            })
            .where(eq(schools.id, school.id))
        
        updatedCount++
    }

    console.log(`Successfully updated ${updatedCount} schools with tiers and credits.`)
    process.exit(0)
}

main().catch((err) => {
    console.error("Error seeding tiers:", err)
    process.exit(1)
})

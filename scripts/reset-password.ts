import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local" })

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing")
    process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function main() {
    const adminPhone = "0544865254"
    const newPassword = "admin123" // The new password to log in with
    
    try {
        console.log(`Resetting admin password for ${adminPhone}...`)
        
        // Generate new bcrypt hash
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(newPassword, salt)
        
        // Update user password hash in the database
        const res = await sql`
            UPDATE users 
            SET password_hash = ${passwordHash} 
            WHERE phone = ${adminPhone}
            RETURNING id, phone, role;
        `
        
        if (res.length > 0) {
            console.log(`✅ SUCCESS: Admin password successfully reset to: "${newPassword}"`)
            console.log("User details:", res[0])
        } else {
            console.error(`❌ FAILED: User with phone ${adminPhone} not found in database.`)
        }
    } catch (e: any) {
        console.error("FAILED to reset password:", e.message || e)
    }
}

main()

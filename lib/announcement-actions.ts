"use server"

import { db } from "@/lib/db"
import { announcements } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

export async function getActiveAnnouncements() {
    try {
        return await db.select()
            .from(announcements)
            .where(eq(announcements.isActive, true))
            .orderBy(desc(announcements.priority), desc(announcements.createdAt))
    } catch (error) {
        console.error("Failed to fetch active announcements:", error)
        return []
    }
}

export async function getAllAnnouncements() {
    try {
        return await db.select()
            .from(announcements)
            .orderBy(desc(announcements.createdAt))
    } catch (error) {
        console.error("Failed to fetch all announcements:", error)
        return []
    }
}

export async function createAnnouncement(data: {
    type: "text" | "image"
    content?: string
    imageUrl?: string
    link?: string
    priority?: number
    style?: string
}) {
    try {
        await db.insert(announcements).values({
            id: `ann-${nanoid(10)}`,
            ...data,
            isActive: true,
        })
        revalidatePath("/")
        revalidatePath("/admin/announcements")
        return { success: true }
    } catch (error) {
        console.error("Failed to create announcement:", error)
        return { success: false, error: "Failed to create announcement" }
    }
}

export async function updateAnnouncement(id: string, data: Partial<{
    content: string
    imageUrl: string
    link: string
    isActive: boolean
    priority: number
    style: string
}>) {
    try {
        await db.update(announcements)
            .set(data)
            .where(eq(announcements.id, id))
        revalidatePath("/")
        revalidatePath("/admin/announcements")
        return { success: true }
    } catch (error) {
        console.error("Failed to update announcement:", error)
        return { success: false, error: "Failed to update announcement" }
    }
}

export async function deleteAnnouncement(id: string) {
    try {
        await db.delete(announcements)
            .where(eq(announcements.id, id))
        revalidatePath("/")
        revalidatePath("/admin/announcements")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete announcement:", error)
        return { success: false, error: "Failed to delete announcement" }
    }
}

export async function uploadAdvertImage(base64Data: string, filename: string) {
    try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "adverts")

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        // Clean base64 string
        const base64Image = base64Data.split(';base64,').pop()
        if (!base64Image) throw new Error("Invalid base64 data")

        // Create unique filename to prevent overwrites
        const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filepath = path.join(uploadDir, uniqueFilename)

        // Write file
        fs.writeFileSync(filepath, base64Image, { encoding: 'base64' })

        // Return the public URL
        return { success: true, url: `/uploads/adverts/${uniqueFilename}` }
    } catch (error) {
        console.error("Failed to upload advert image:", error)
        return { success: false, error: "Failed to upload image" }
    }
}

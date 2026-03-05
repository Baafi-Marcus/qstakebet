"use client"
import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface FootballIconProps {
    className?: string
}

export function FootballIcon({ className }: FootballIconProps) {
    return (
        <Image
            src="/icons/football.png"
            alt="Football"
            width={24}
            height={24}
            className={cn("object-contain", className)}
        />
    )
}

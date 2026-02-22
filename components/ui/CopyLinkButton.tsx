"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function CopyLinkButton({ referralCode }: { referralCode: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        const link = `${window.location.origin}/r/${referralCode}`
        navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Button
            size="sm"
            variant="secondary"
            className={cn("gap-2 transition-all", copied && "bg-green-500 hover:bg-green-600 text-white")}
            onClick={handleCopy}
        >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Link"}
        </Button>
    )
}

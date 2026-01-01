"use client"

import { ReactNode } from "react"

interface MarketGroupProps {
    title: string
    children: ReactNode
}

export function MarketGroup({ title, children }: MarketGroupProps) {
    return (
        <div className="bg-secondary/10 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center">
                <div className="w-1 h-4 bg-accent mr-2 rounded-full"></div>
                {title}
            </h3>
            {children}
        </div>
    )
}

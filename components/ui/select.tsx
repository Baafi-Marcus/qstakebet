
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// A simplified version that mimics the Radix UI Select API but uses native select for simplicity
// This is because implementing a full custom Select without Radix is complex

const SelectContext = React.createContext<{
    value?: string
    defaultValue?: string
    startTransition: (value: string) => void
} | null>(null)

// Note: This is an abstraction that actually renders a native select visually styled
// It allows us to keep the API structure same as shadcn/ui: Select > SelectTrigger > SelectValue > SelectContent > SelectItem
// But under the hood, we might need to cheat a bit or just use a custom dropdown.

// Implementing a custom dropdown Select
interface SelectProps {
    children: React.ReactNode
    onValueChange?: (value: string) => void
    defaultValue?: string
    name?: string
}

export function Select({ children, onValueChange, defaultValue, name }: SelectProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(defaultValue || "")

    return (
        <SelectContext.Provider value={{
            open,
            setOpen,
            value,
            setValue: (v) => {
                setValue(v)
                setOpen(false)
                if (onValueChange) onValueChange(v)
            },
            name
        } as any}>
            <div className="relative">{children}</div>
            {name && <input type="hidden" name={name} value={value} />}
        </SelectContext.Provider>
    )
}

export function SelectTrigger({ children, className }: { children: React.ReactNode, className?: string }) {
    const context = React.useContext(SelectContext) as any
    return (
        <button
            type="button"
            onClick={() => context.setOpen(!context.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                className
            )}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
    const context = React.useContext(SelectContext) as any
    // This is tricky without knowing the label for the value.
    // For now we just show the value or placeholder. 
    // In a real implementation we'd need to map value to label.
    // We can rely on the fact that SelectItem children usually *are* the label.
    // But we don't have access to them here easily without traversing children.

    // Simplification: Just show value. 
    // If the user wants to show a label, they need to handle it or we need a better implementation.
    // However, usually `SelectValue` automatically picks it up in Radix.

    // Hack: We will just display the value for now, or "Select..."

    return <span>{context.value || placeholder || "Select..."}</span>
}

export function SelectContent({ children, className }: { children: React.ReactNode, className?: string }) {
    const context = React.useContext(SelectContext) as any

    if (!context.open) return null

    return (
        <div className={cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
            "top-full mt-1 w-full",
            className
        )}>
            <div className="p-1">{children}</div>
        </div>
    )
}

export function SelectItem({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
    const context = React.useContext(SelectContext) as any
    return (
        <div
            onClick={() => context.setValue(value)}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                "hover:bg-accent hover:text-accent-foreground cursor-pointer",
                className
            )}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {context.value === value && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                )}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
}

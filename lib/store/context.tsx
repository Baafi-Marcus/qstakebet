"use client"

import React from 'react'

export type Selection = {
    matchId: string
    selectionId: string
    label: string
    odds: number
    marketName: string
    matchLabel: string
    stake?: number // Individual stake for Single mode
}

export interface BetSlipContextType {
    isOpen: boolean
    selections: Selection[]
    stake: number
    toggleSlip: () => void
    addSelection: (selection: Selection) => void
    removeSelection: (selectionId: string) => void
    setStake: (amount: number) => void
    updateSelectionStake: (selectionId: string, amount: number) => void // New
    clearSlip: () => void
    useBonus: boolean
    setUseBonus: (use: boolean) => void
    openSlip: () => void
    closeSlip: () => void
}

export const BetSlipContext = React.createContext<BetSlipContextType | undefined>(undefined)

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selections, setSelections] = React.useState<Selection[]>([])
    const [stake, setStakeState] = React.useState(10)
    const [useBonus, setUseBonus] = React.useState(false)

    const toggleSlip = () => setIsOpen(prev => !prev)
    const openSlip = () => setIsOpen(true)
    const closeSlip = () => setIsOpen(false)

    const addSelection = (selection: Selection) => {
        setSelections(prev => {
            const exists = prev.find(s => s.selectionId === selection.selectionId)
            if (exists) {
                return prev.filter(s => s.selectionId !== selection.selectionId)
            }
            // Allow one selection per market for each match
            const filtered = prev.filter(s => !(s.matchId === selection.matchId && s.marketName === selection.marketName))
            return [...filtered, selection]
        })
        // Don't auto-open the bet slip - user must click the button
    }

    const removeSelection = (selectionId: string) => {
        setSelections(prev => prev.filter(s => s.selectionId !== selectionId))
    }

    const setStake = (amount: number) => setStakeState(amount)
    const updateSelectionStake = (selectionId: string, amount: number) => {
        setSelections(prev => prev.map(s =>
            s.selectionId === selectionId ? { ...s, stake: amount } : s
        ))
    }
    const clearSlip = () => setSelections([])

    const value = {
        isOpen,
        selections,
        stake,
        toggleSlip,
        addSelection,
        removeSelection,
        setStake,
        updateSelectionStake,
        clearSlip,
        useBonus,
        setUseBonus,
        openSlip,
        closeSlip
    }

    return (
        <BetSlipContext.Provider value={value}>
            {children}
        </BetSlipContext.Provider>
    )
}

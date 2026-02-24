"use client"

import React from 'react'

export type Selection = {
    matchId: string
    tournamentId?: string // Link to tournament for outrights
    selectionId: string
    label: string
    odds: number
    marketName: string
    matchLabel: string
    sportType?: string
    stake?: number
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
    bonusId: string | undefined
    setBonusId: (id: string | undefined) => void
    bonusAmount: number
    setBonusAmount: (amount: number) => void
    openSlip: () => void
    closeSlip: () => void
    selectedMatchId: string | null
    setSelectedMatchId: (id: string | null) => void
    checkSelected: (selectionId: string) => boolean
    showDeposit: boolean
    setShowDeposit: (show: boolean) => void
    pendingWin: { amount: number } | null
    setPendingWin: (win: { amount: number } | null) => void
}

export const BetSlipContext = React.createContext<BetSlipContextType | undefined>(undefined)

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selections, setSelections] = React.useState<Selection[]>([])
    const [stake, setStakeState] = React.useState(10)
    const [useBonus, setUseBonus] = React.useState(false)
    const [bonusId, setBonusId] = React.useState<string | undefined>(undefined)
    const [bonusAmount, setBonusAmount] = React.useState(0)
    const [selectedMatchId, setSelectedMatchId] = React.useState<string | null>(null)
    const [showDeposit, setShowDeposit] = React.useState(false)
    const [pendingWin, setPendingWin] = React.useState<{ amount: number } | null>(null)

    const checkSelected = (selectionId: string) => {
        return selections.some(s => s.selectionId === selectionId)
    }

    const toggleSlip = () => setIsOpen(prev => !prev)
    const openSlip = () => setIsOpen(true)
    const closeSlip = () => setIsOpen(false)

    const addSelection = (selection: Selection) => {
        setSelections(prev => {
            const exists = prev.find(s => s.selectionId === selection.selectionId)
            if (exists) {
                return prev.filter(s => s.selectionId !== selection.selectionId)
            }

            // ENFORCE SINGLES ONLY for "Tournament Winner" / "Outright Winner"
            const isOutright = selection.marketName === "Tournament Winner" || selection.marketName === "Outright Winner"
            if (isOutright) {
                // If adding an outright, it MUST be the only selection in the slip
                // Or if there are existing selections, we remove them? 
                // Better: if there are ANY other selections, we clear them if the user adds an outright.
                return [selection]
            }

            // If we are adding a NORMAL bet but there is an OUTRIGHT in the slip, clear the outright
            const hasOutright = prev.some(s => s.marketName === "Tournament Winner" || s.marketName === "Outright Winner")
            if (hasOutright) {
                return [selection]
            }

            // Allow one selection per market for each match
            const filtered = prev.filter(s => !(s.matchId === selection.matchId && s.marketName === selection.marketName))
            return [...filtered, selection]
        })
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
    const clearSlip = () => {
        setSelections([])
        setUseBonus(false)
        setBonusId(undefined)
        setBonusAmount(0)
    }

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
        bonusId,
        setBonusId,
        bonusAmount,
        setBonusAmount,
        openSlip,
        closeSlip,
        selectedMatchId,
        setSelectedMatchId,
        checkSelected,
        showDeposit,
        setShowDeposit,
        pendingWin,
        setPendingWin
    }

    return (
        <BetSlipContext.Provider value={value}>
            {children}
        </BetSlipContext.Provider>
    )
}

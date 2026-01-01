"use client"

import { useContext } from 'react'
import { BetSlipContext } from './context'
export type { Selection } from './context'

export function useBetSlip() {
    const context = useContext(BetSlipContext)
    if (context === undefined) {
        throw new Error('useBetSlip must be used within a BetSlipProvider')
    }
    return context
}

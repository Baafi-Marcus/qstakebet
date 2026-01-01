export interface Match {
    id: string
    schoolA: string
    schoolB: string
    schoolC: string
    startTime: string
    isLive: boolean
    isVirtual: boolean
    stage: string // e.g. "Quarter Final"
    odds: {
        schoolA: number | null
        schoolB: number | null
        schoolC: number | null
    }
    extendedOdds?: {
        [marketName: string]: {
            [optionLabel: string]: number | null
        }
    }
}

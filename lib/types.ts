export interface Match {
    id: string
    tournamentId?: string | null
    tournamentName?: string | null
    participants: {
        schoolId: string
        name: string
        odd: number
        result?: number | string | null
    }[]
    startTime: string
    scheduledAt?: Date | string | null
    status?: string
    result?: {
        winner?: string
        scores?: { [schoolId: string]: number }
    } | null
    isLive: boolean
    isVirtual: boolean
    stage: string
    odds: {
        [key: string]: number | null
    }
    extendedOdds?: {
        [marketName: string]: {
            [optionLabel: string]: number | null
        }
    }
    sportType: string
    gender: string
    group?: string | null
    matchday?: string | null
    margin: number
    currentRound?: number
    liveMetadata?: any
    level?: string
    createdAt?: Date | string | null
    lastTickAt?: Date | string | null
    autoEndAt?: Date | string | null
    betVolume?: {
        [selectionId: string]: {
            totalStake: number,
            betCount: number,
            lastUpdated: string
        }
    }
}

export interface Tournament {
    id: string
    name: string
    region: string
    sportType: string
    gender: string
    year: string
    level: string
    status: string
    metadata?: any
    createdAt?: Date | null
}

export interface School {
    id: string
    name: string
    region: string
    district?: string | null
    category?: string | null
    level: string
    type?: string | null
    parentId?: string | null
    location?: string | null
    createdAt?: Date | null
}

export interface SchoolStrength {
    id: string
    schoolId: string
    sportType: string
    gender: string
    rating: number
    updatedAt?: Date | null
}

export interface Bet {
    id: string
    userId: string
    selections: {
        matchId: string
        selectionId: string
        label: string
        odds: number
        marketName: string
        matchLabel: string
    }[]
    stake: number
    totalOdds: number
    potentialPayout: number
    status: string
    bonusUsed?: string | null
    isBonusBet: boolean
    bonusAmountUsed?: number | null
    settledAt?: Date | null
    createdAt?: Date | null
}

export interface Announcement {
    id: string
    type: string // "text" | "image"
    content: string | null
    imageUrl: string | null
    link: string | null
    isActive: boolean
    priority: number
    style: string | null
    createdAt: Date | null
}

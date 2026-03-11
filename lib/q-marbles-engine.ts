import { seededRandom, clamp } from "./virtuals"
import { UNIVERSITIES, UniversityID, UniversityInfo } from "./q-penalty-engine"

export interface MarbleInfo extends UniversityInfo {
    speedBoost: number // Hidden speed variation
}

export interface MarbleSnapshot {
    marbleId: UniversityID
    position: number // 0 to 100 (percentage of track)
    velocity: number
}

export interface QMarblesRaceOutcome {
    matchId: string
    timestamp: number
    marbles: MarbleInfo[]
    snapshots: MarbleSnapshot[][] // Snapshots over time for animation
    finishOrder: UniversityID[]
    winner: UniversityID
    top3: UniversityID[]
    isPhotoFinish: boolean // If 1st and 2nd are very close
    oddWinner: boolean // If winner's marble index is odd
}

export function simulateQMarblesRace(
    matchId: string,
    seed: number,
    timestamp?: number,
    providedSchools?: { name: string, shortName?: string, color?: string }[]
): QMarblesRaceOutcome {
    // 1. Select 6 marbles (Universities)
    let selectedMarbles: UniversityInfo[] = []

    if (providedSchools && providedSchools.length >= 6) {
        // Pick 6 unique schools using seed
        const indices = new Set<number>()
        let i = 0
        while (indices.size < 6 && i < 100) {
            indices.add(Math.floor(seededRandom(seed + 50 + i) * providedSchools.length))
            i++
        }
        const picked = Array.from(indices).map(idx => providedSchools[idx])
        selectedMarbles = picked.map((s, idx) => ({
            id: `M${idx}` as any,
            name: s.name,
            shortName: s.shortName || s.name,
            color: s.color || `hsl(${(idx * 60) % 360}, 70%, 50%)`
        }))
    } else {
        const allIds = Object.keys(UNIVERSITIES) as UniversityID[]
        const selectedIds = allIds.slice(0, 6)
        selectedMarbles = selectedIds.map(id => UNIVERSITIES[id])
    }
    
    const marbles: MarbleInfo[] = selectedMarbles.map((m, idx) => ({
        ...m,
        speedBoost: 0.9 + (seededRandom(seed + idx) * 0.2) // 0.9 to 1.1
    }))

    const selectedIds = marbles.map(m => m.id as UniversityID)

    const snapshots: MarbleSnapshot[][] = []
    const currentPositions = selectedIds.map(() => 0)
    const currentVelocities = selectedIds.map(() => 0)
    
    // Simulate race in steps
    // A race takes about 20-30 seconds of "visual" time.
    // We'll generate 20 snapshots (one per second or so)
    const totalSteps = 40 
    const stepSize = 0.5 

    for (let step = 0; step <= totalSteps; step++) {
        const stepSnapshots: MarbleSnapshot[] = []
        
        for (let i = 0; i < marbles.length; i++) {
            const marble = marbles[i]
            // Physics: acceleration + drag + random jitter
            const jitter = (seededRandom(seed + step * 100 + i) - 0.5) * 2
            const accel = (0.5 * marble.speedBoost) + (jitter * 0.2)
            
            currentVelocities[i] = clamp(currentVelocities[i] + accel, 0, 5)
            currentPositions[i] = Math.min(100, currentPositions[i] + (currentVelocities[i] * stepSize))
            
            stepSnapshots.push({
                marbleId: marble.id,
                position: currentPositions[i],
                velocity: currentVelocities[i]
            })
        }
        
        snapshots.push(stepSnapshots)
        
        // Break if all marbles finished (actually let's just run to 40 steps)
        if (currentPositions.every(p => p >= 100)) break
    }

    // Determine final order
    // Since snapshots might end early or late, we calculate final "time" to reach 100
    // But for a simple virtual, we can just sort by position at final step
    // and if tied, use the seed.
    const finalPositions = snapshots[snapshots.length - 1]
    const finishOrder = [...finalPositions]
        .sort((a, b) => {
            if (b.position !== a.position) return b.position - a.position
            return seededRandom(seed + a.marbleId.length) - 0.5 // Tie breaker
        })
        .map(s => s.marbleId)

    const winner = finishOrder[0]
    const winnerIndexInSelected = selectedIds.indexOf(winner)

    return {
        matchId,
        timestamp: timestamp || Date.now(),
        marbles,
        snapshots,
        finishOrder,
        winner,
        top3: finishOrder.slice(0, 3),
        isPhotoFinish: Math.abs(finalPositions.find(p => p.marbleId === finishOrder[0])!.position - finalPositions.find(p => p.marbleId === finishOrder[1])!.position) < 1,
        oddWinner: (winnerIndexInSelected + 1) % 2 !== 0
    }
}

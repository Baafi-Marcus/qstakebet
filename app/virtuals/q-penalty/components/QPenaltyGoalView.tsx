'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { QPenaltyMatchOutcome } from '@/lib/q-penalty-engine'
import { cn } from '@/lib/utils'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Plane, Sphere, Box, CameraControls } from '@react-three/drei'
import { EffectComposer, Vignette, DepthOfField, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

interface QPenaltyGoalViewProps {
    outcome: QPenaltyMatchOutcome
    gameState: any 
}

// --- Internal 3D Components ---

function GoalFrame() {
    return (
        <group position={[0, 0, -10]}>
            <Box args={[0.2, 3, 0.2]} position={[-4, 1.5, 0]}>
                <meshStandardMaterial color="white" roughness={0.2} metalness={0.1} />
            </Box>
            <Box args={[0.2, 3, 0.2]} position={[4, 1.5, 0]}>
                <meshStandardMaterial color="white" roughness={0.2} metalness={0.1} />
            </Box>
            <Box args={[8.2, 0.2, 0.2]} position={[0, 3.1, 0]}>
                <meshStandardMaterial color="white" roughness={0.2} metalness={0.1} />
            </Box>
            <Box args={[8, 3, 2]} position={[0, 1.5, -1]}>
                <meshStandardMaterial color="white" transparent opacity={0.15} wireframe />
            </Box>
        </group>
    )
}

function Goalkeeper3D({ isKicking, goalieDirection }: { isKicking: boolean, goalieDirection: string }) {
    const groupRef = useRef<THREE.Group>(null)
    const headRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (!groupRef.current || !headRef.current) return
        const time = state.clock.getElapsedTime()

        // 1. Idle "Breathing" Animation
        if (!isKicking) {
            groupRef.current.position.y = (Math.sin(time * 2) * 0.05) + 0.5
            groupRef.current.position.x = Math.sin(time * 0.5) * 0.1
            
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1)
            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1)
        } else {
            // 2. Diving Animation
            const diveSpeed = 0.2
            if (goalieDirection === 'left') {
                groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, -3, diveSpeed)
                groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.2, diveSpeed)
                groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 3, diveSpeed)
            } else if (goalieDirection === 'right') {
                groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 3, diveSpeed)
                groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.2, diveSpeed)
                groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -Math.PI / 3, diveSpeed)
            } else {
                groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 1.5, diveSpeed)
                groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, diveSpeed)
            }
        }
    })

    return (
        <group ref={groupRef} position={[0, 0.5, -9]}>
            <Box args={[0.8, 1.2, 0.4]} position={[0, 0.6, 0]} castShadow>
                <meshStandardMaterial color="#eab308" />
            </Box>
            <Sphere ref={headRef} args={[0.3, 16, 16]} position={[0, 1.5, 0]} castShadow>
                <meshStandardMaterial color="#fde68a" />
            </Sphere>
            <Box args={[0.2, 1, 0.2]} position={[-0.6, 0.6, 0]} rotation={[0, 0, 0.3]} castShadow>
                <meshStandardMaterial color="#eab308" />
            </Box>
            <Box args={[0.2, 1, 0.2]} position={[0.6, 0.6, 0]} rotation={[0, 0, -0.3]} castShadow>
                <meshStandardMaterial color="#eab308" />
            </Box>
            <Box args={[0.25, 1, 0.25]} position={[-0.25, -0.5, 0]} castShadow>
                <meshStandardMaterial color="#1e293b" />
            </Box>
            <Box args={[0.25, 1, 0.25]} position={[0.25, -0.5, 0]} castShadow>
                <meshStandardMaterial color="#1e293b" />
            </Box>
        </group>
    )
}

function TurfParticles({ triggerKick }: { triggerKick: boolean }) {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const count = 50
    const dummy = useMemo(() => new THREE.Object3D(), [])
    
    // Store particle states
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            position: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5),
            velocity: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 3 + 1, (Math.random() - 0.5) * 2),
            life: 1.0,
            active: false
        }))
    }, [])

    useEffect(() => {
        if (triggerKick) {
            particles.forEach(p => {
                p.active = true
                p.life = 1.0
                p.position.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5)
                p.velocity.set((Math.random() - 0.5) * 3, Math.random() * 4 + 2, (Math.random() - 0.5) * 3)
            })
        }
    }, [triggerKick, particles])

    useFrame((state, delta) => {
        if (!meshRef.current) return
        
        let i = 0
        particles.forEach((p, idx) => {
            if (p.active) {
                // Apply gravity and velocity
                p.velocity.y -= 9.8 * delta
                p.position.addScaledVector(p.velocity, delta)
                p.life -= delta * 1.5

                if (p.position.y < 0) {
                    p.position.y = 0
                    p.velocity.y *= -0.3
                    p.velocity.x *= 0.5
                    p.velocity.z *= 0.5
                }
                
                if (p.life <= 0) p.active = false

                const scale = Math.max(0, p.life)
                dummy.position.copy(p.position)
                dummy.scale.set(scale, scale, scale)
                dummy.updateMatrix()
                meshRef.current!.setMatrixAt(idx, dummy.matrix)
            } else {
                dummy.position.set(0,-10,0)
                dummy.scale.set(0,0,0)
                dummy.updateMatrix()
                meshRef.current!.setMatrixAt(idx, dummy.matrix)
            }
            i++
        })
        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.05]} />
            <meshStandardMaterial color="#065f46" roughness={1} />
        </instancedMesh>
    )
}

function Ball3D({ isKicking, isFlying, isFinished, direction, isScored }: { isKicking: boolean, isFlying: boolean, isFinished: boolean, direction: string, isScored: boolean }) {
    const ballRef = useRef<THREE.Mesh>(null)
    const [startZ] = useState(0)
    const destZ = -10
    
    useFrame((state) => {
        if (!ballRef.current) return
        const ball = ballRef.current

        if (!isFlying && !isFinished) {
            ball.position.set(0, 0.11, startZ)
        } else if (isFlying) {
            let destX = 0
            let destY = 1.5

            if (direction === 'left') {
                destX = isScored ? -3.5 : -5.5
                destY = isScored ? 2 : 3
            } else if (direction === 'right') {
                destX = isScored ? 3.5 : 5.5
                destY = isScored ? 2 : 3
            }
            if (!isScored && direction === 'center') {
                destY = 4 // Overshoot
            }

            // Move forward linearly
            ball.position.z = THREE.MathUtils.lerp(ball.position.z, destZ, 0.1)
            
            // Calculate progress (0 to 1)
            const progress = (startZ - ball.position.z) / (startZ - destZ)
            
            // Arc logic -> y = -ax^2 + bx + c
            const archHeight = 1.5
            const yArc = Math.sin(progress * Math.PI) * archHeight
            
            ball.position.x = THREE.MathUtils.lerp(ball.position.x, destX, 0.1)
            ball.position.y = THREE.MathUtils.lerp(ball.position.y, destY + yArc, 0.1)
            
            ball.rotation.x -= 0.5
            ball.rotation.z += (direction === 'left' ? 0.3 : direction === 'right' ? -0.3 : 0)
        } else if (isFinished) {
            // Apply gravity/bounce if it missed or is dead in net
            if (ball.position.y > 0.11) {
                ball.position.y = THREE.MathUtils.lerp(ball.position.y, 0.11, 0.1)
            }
        }
    })

    return (
        <Sphere ref={ballRef} args={[0.11, 32, 32]} position={[0, 0.11, 0]} castShadow>
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </Sphere>
    )
}

function SceneCamera({ isKicking }: { isKicking: boolean }) {
    const controlsRef = useRef<any>(null)
    
    useFrame((state) => {
        const targetZ = isKicking ? 2 : 4
        const targetY = isKicking ? 1.5 : 2
        
        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05)
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05)
        state.camera.lookAt(0, 1.5, -10)
        
        // Add random shake when kicking
        if (isKicking && Math.random() > 0.8) {
             state.camera.position.x += (Math.random() - 0.5) * 0.05
             state.camera.position.y += (Math.random() - 0.5) * 0.05
        }
    })
    
    return null
}

export function QPenaltyGoalView({ outcome, gameState }: QPenaltyGoalViewProps) {
    const isInProgress = gameState.phase === 'IN_PROGRESS'
    const isSettlement = gameState.phase === 'SET_SETTLEMENT' || gameState.phase === 'SETTLEMENT'

    const timeElapsed = 30 - gameState.timeRemaining
    const currentAttemptIdx = Math.floor(timeElapsed / 3) 
    const attemptTime = timeElapsed % 3

    const isPlayerBTurn = currentAttemptIdx % 2 !== 0
    const currentRound = Math.floor(currentAttemptIdx / 2)
    
    const currentAttempt = useMemo(() => {
        if (!isInProgress) return null
        return isPlayerBTurn ? outcome.attemptsB[currentRound] : outcome.attemptsA[currentRound]
    }, [isInProgress, isPlayerBTurn, currentRound, outcome])

    const isKicking = attemptTime > 1.0 && attemptTime < 1.3
    const isFlying = attemptTime >= 1.2 && attemptTime < 1.6
    const isFinished = attemptTime >= 1.6

    if (!isInProgress && !isSettlement) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4 bg-slate-900/20 rounded-3xl overflow-hidden">
                 <div className="w-64 h-32 border-4 border-white/5 rounded-t-lg relative">
                    <div className="absolute inset-0 bg-slate-900/50" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                     Preparation Phase
                 </span>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-end overflow-hidden rounded-3xl bg-slate-900 shadow-inner">
            {/* Scoreboard / Sequence Overlay */}
            <div className="absolute top-4 left-6 z-40 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2 min-w-[120px] shadow-2xl">
                 <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Shootout</span>
                      <span className="text-[8px] font-black text-emerald-400">LIVE</span>
                 </div>
                 <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-4">
                           <span className="text-[10px] font-black text-white truncate max-w-[50px]">{outcome.teamA.shortName}</span>
                           <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => {
                                    const res = outcome.attemptsA[i]
                                    const isPast = (currentAttemptIdx / 2) > i || (!isPlayerBTurn && currentRound === i && isFinished)
                                    return (
                                        <div key={i} className={cn(
                                            "w-2.5 h-2.5 rounded-sm border transition-all duration-300",
                                            !isPast ? "bg-black/40 border-white/10" : 
                                            res?.isScored ? "bg-emerald-500 border-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500 border-red-400"
                                        )} />
                                    )
                                })}
                           </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                           <span className="text-[10px] font-black text-white truncate max-w-[50px]">{outcome.teamB.shortName}</span>
                           <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => {
                                    const res = outcome.attemptsB[i]
                                    const isPast = (currentAttemptIdx / 2) > i + 0.5 || (isPlayerBTurn && currentRound === i && isFinished)
                                    return (
                                        <div key={i} className={cn(
                                            "w-2.5 h-2.5 rounded-sm border transition-all duration-300",
                                            !isPast ? "bg-black/40 border-white/10" : 
                                            res?.isScored ? "bg-emerald-500 border-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500 border-red-400"
                                        )} />
                                    )
                                })}
                           </div>
                      </div>
                 </div>
            </div>

            {/* 3D Canvas */}
            <div className="absolute inset-0 z-10">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center text-emerald-500 font-mono text-xs">Loading 3D Engine...</div>}>
                    <Canvas shadows camera={{ position: [0, 2, 4], fov: 60 }} dpr={[1, 2]}>
                        <color attach="background" args={['#0f172a']} />
                        <ambientLight intensity={0.4} />
                        <spotLight position={[-10, 20, 10]} angle={0.3} penumbra={1} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
                        <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={1.5} />
                        
                        <Environment preset="night" />

                        <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                            <meshStandardMaterial color="#064e3b" roughness={0.9} />
                        </Plane>

                        <GoalFrame />
                        <Goalkeeper3D 
                            isKicking={isKicking || isFlying} 
                            goalieDirection={currentAttempt?.goalieDirection || 'center'} 
                        />
                        
                        <Ball3D 
                            isKicking={isKicking} 
                            isFlying={isFlying} 
                            isFinished={isFinished} 
                            direction={currentAttempt?.direction || 'center'} 
                            isScored={currentAttempt?.isScored || false}
                        />

                        <TurfParticles triggerKick={isKicking && attemptTime > 1.05 && attemptTime < 1.1} />

                        <SceneCamera isKicking={isKicking || isFlying} />

                        <EffectComposer>
                            <DepthOfField focusDistance={0.02} focalLength={0.2} bokehScale={2} height={480} />
                            <Bloom luminanceThreshold={1} mipmapBlur />
                            <Vignette eskil={false} offset={0.1} darkness={1.1} />
                        </EffectComposer>
                    </Canvas>
                </React.Suspense>
            </div>

            {/* Kick Indicator Overlay */}
            <div className="absolute bottom-6 right-6 z-40 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-2xl flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                      {currentRound + 1}
                 </div>
                 <div className="flex flex-col pr-2">
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">Shooter</span>
                      <span className="text-xs font-black text-white uppercase italic">
                           {isPlayerBTurn ? outcome.teamB.shortName : outcome.teamA.shortName}
                      </span>
                 </div>
            </div>

            {/* Result Popup Overlay */}
            {isFinished && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none pb-20">
                    <div className={cn(
                        "px-16 py-8 rounded-3xl backdrop-blur-xl border border-white/20 shadow-[-20px_20px_60px_rgba(0,0,0,0.8)] transform -skew-x-12 animate-in zoom-in-50 duration-500",
                        currentAttempt?.isScored 
                            ? "bg-emerald-600/80 text-white" 
                            : "bg-red-600/80 text-white"
                    )}>
                        <div className="text-7xl font-black uppercase italic tracking-tighter drop-shadow-2xl">
                            {currentAttempt?.isScored ? "GOAL!" : "SAVED!"}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

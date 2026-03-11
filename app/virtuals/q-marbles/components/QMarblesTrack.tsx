'use client'

import React, { useMemo } from 'react'
import { QMarblesRaceOutcome } from '@/lib/q-marbles-engine'
import { cn } from '@/lib/utils'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { Environment, Text, ContactShadows } from '@react-three/drei'
import { EffectComposer, DepthOfField, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

interface QMarblesTrackProps {
    outcome: QMarblesRaceOutcome
    gameState: any
}

// --- Internal 3D Components ---

function TrackSurface() {
    return (
        <group>
            {/* The Main Incline */}
            <RigidBody type="fixed" friction={0.1} restitution={0.2} position={[0, -2, 0]} rotation={[-Math.PI / 2 + 0.1, 0, 0]}>
                <mesh receiveShadow>
                    <planeGeometry args={[20, 100, 64, 64]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.8} />
                </mesh>
            </RigidBody>

            {/* Invisible Walls to keep marbles on track */}
            <RigidBody type="fixed" position={[-5, 0, 0]}>
                <CuboidCollider args={[1, 10, 50]} />
            </RigidBody>
            <RigidBody type="fixed" position={[5, 0, 0]}>
                <CuboidCollider args={[1, 10, 50]} />
            </RigidBody>
            {/* Starting Gate */}
            <RigidBody type="fixed" position={[0, 0, -25]}>
                <CuboidCollider args={[10, 10, 1]} />
            </RigidBody>
        </group>
    )
}

function PhysicalMarble({ marbleData, index, isPlaying, startZ }: { marbleData: any, index: number, isPlaying: boolean, startZ: number }) {
    const bodyRef = React.useRef<any>(null)
    const color = new THREE.Color(marbleData.color)
    const startX = -3 + (index * 1.2)

    useFrame((state, delta) => {
        if (!bodyRef.current || !isPlaying) return

        const baseForce = 2.0 * marbleData.speedBoost
        const time = state.clock.getElapsedTime()
        const jitterX = (Math.sin(time * 10 + index) * 0.2) + (Math.random() - 0.5) * 0.5
        const jitterZ = (Math.random() - 0.5) * 0.2
        
        bodyRef.current.applyImpulse({ x: jitterX * delta * 5, y: 0, z: (baseForce + jitterZ) * delta * 50 }, true)
        bodyRef.current.applyTorqueImpulse({ x: (Math.random() - 0.5) * delta, y: (Math.random() - 0.5) * delta, z: (Math.random() - 0.5) * delta }, true)
    })

    return (
        <RigidBody 
            ref={bodyRef} 
            position={[startX, 5, startZ]} 
            restitution={0.5} 
            friction={0.2}
            colliders="ball"
            mass={1}
        >
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.4, 32, 32]} />
                <meshPhysicalMaterial 
                    color={color} 
                    roughness={0.1} 
                    metalness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                />
            </mesh>
            <Text
                position={[0, 0.8, 0]}
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="black"
            >
                {marbleData.shortName}
            </Text>
        </RigidBody>
    )
}

function CameraRig({ isPlaying }: { isPlaying: boolean }) {
    useFrame((state) => {
        if (isPlaying) {
            state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 20, 0.01)
            state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 5, 0.01)
            state.camera.lookAt(0, 0, state.camera.position.z + 10)
        } else {
            state.camera.position.set(0, 15, -30)
            state.camera.lookAt(0, 0, 0)
        }
    })
    return null
}

export function QMarblesTrack({ outcome, gameState }: QMarblesTrackProps) {
    const isInProgress = gameState.phase === 'IN_PROGRESS'
    const isSettlement = gameState.phase === 'SET_SETTLEMENT' || gameState.phase === 'SETTLEMENT'

    const timeElapsed = 30 - gameState.timeRemaining
    const currentStep = Math.min(outcome.snapshots.length - 1, Math.floor(timeElapsed / 0.75))
    const currentStepData = outcome.snapshots[currentStep]

    const rankedMarbles = useMemo(() => {
        if (!currentStepData) return outcome.marbles
        return [...outcome.marbles].sort((a, b) => {
            const posA = currentStepData.find(s => s.marbleId === a.id)?.position || 0
            const posB = currentStepData.find(s => s.marbleId === b.id)?.position || 0
            return posB - posA
        })
    }, [currentStepData, outcome.marbles])

    if (!isInProgress && !isSettlement) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-3xl border border-white/5 relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                 <div className="text-center z-10 p-8">
                      <div className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Race Starting Soon</div>
                      <div className="mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">Prepare your bets</div>
                 </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full bg-[#f8fafc] rounded-3xl border border-slate-200 relative overflow-hidden flex shadow-inner">
            <div className="w-40 h-full bg-slate-900/90 backdrop-blur-md z-30 flex flex-col border-r border-white/5 shadow-2xl absolute left-0 top-0">
                 <div className="p-3 border-b border-white/10 bg-black/20">
                      <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black italic text-white/40 tracking-tighter">03:45 +1 LAP</span>
                      </div>
                 </div>
                 <div className="flex-1 overflow-hidden py-1">
                      {rankedMarbles.map((m, i) => (
                          <div key={m.id} className={cn(
                              "flex items-center gap-2 px-3 py-1.5 transition-all duration-500",
                              i % 2 === 0 ? "bg-white/5" : "bg-transparent"
                          )}>
                              <span className="text-[8px] font-black text-emerald-400 w-3">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                   <div className="text-[9px] font-black text-white truncate uppercase tracking-tighter">{m.shortName}</div>
                              </div>
                              <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: m.color }} />
                          </div>
                      ))}
                 </div>
                 <div className="p-2 bg-emerald-600/10 border-t border-emerald-500/20">
                      <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest text-center">Live Tracking</div>
                 </div>
            </div>

            <div className="flex-1 relative overflow-hidden ml-40">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">Loading 3D Engine...</div>}>
                    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 15, -30], fov: 45 }}>
                        <color attach="background" args={['#e2e8f0']} />
                        <ambientLight intensity={0.5} />
                        <directionalLight castShadow position={[10, 20, 10]} intensity={1.5} shadow-mapSize={[1024, 1024]} />
                        <Environment preset="city" />

                        <Physics gravity={[0, -9.81, 0]}>
                            <TrackSurface />
                            
                            {outcome.marbles.map((marble, i) => (
                                <PhysicalMarble 
                                    key={marble.id} 
                                    marbleData={marble} 
                                    index={i} 
                                    isPlaying={isInProgress} 
                                    startZ={-20} 
                                />
                            ))}
                        </Physics>

                        <CameraRig isPlaying={isInProgress} />

                        <EffectComposer>
                            <DepthOfField focusDistance={0.01} focalLength={0.2} bokehScale={2} height={480} />
                            <Vignette eskil={false} offset={0.1} darkness={1.1} />
                        </EffectComposer>
                        <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#0f172a" />
                    </Canvas>
                </React.Suspense>

                {isSettlement && outcome.isPhotoFinish && (
                    <div className="absolute top-4 right-4 z-30 bg-amber-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-xl animate-bounce">
                        Photo Finish!
                    </div>
                )}
            </div>
        </div>
    )
}

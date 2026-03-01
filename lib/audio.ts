'use client'

class AudioService {
    private ctx: AudioContext | null = null

    private init() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            if (AudioContextClass) {
                this.ctx = new AudioContextClass()
            }
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
        this.init()
        if (!this.ctx) return

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = type
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

        gain.gain.setValueAtTime(volume, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start()
        osc.stop(this.ctx.currentTime + duration)
    }

    light() {
        this.playTone(800, 'sine', 0.1, 0.05)
    }

    success() {
        this.playTone(600, 'sine', 0.1, 0.1)
        setTimeout(() => this.playTone(900, 'sine', 0.2, 0.1), 100)
    }

    error() {
        this.playTone(300, 'sawtooth', 0.3, 0.1)
    }

    bullseye() {
        this.playTone(800, 'sine', 0.1, 0.1)
        setTimeout(() => this.playTone(1000, 'sine', 0.1, 0.1), 100)
        setTimeout(() => this.playTone(1200, 'sine', 0.3, 0.1), 200)
    }

    hit() {
        this.playTone(400, 'sine', 0.1, 0.08)
    }
}

export const audio = new AudioService()

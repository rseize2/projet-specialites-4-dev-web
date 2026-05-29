import { useEffect, useRef } from 'react'

/**
 * Joue une sonnerie en boucle tant que `active` vaut true.
 * Utilise Web Audio API pour ne pas dépendre d'un fichier audio externe.
 *
 * Pattern type téléphone : deux tons (440 Hz + 480 Hz) alternant
 * pendant 1 s, puis 2 s de silence, en boucle.
 */
export function useRingtone(active: boolean) {
    const ctxRef = useRef<AudioContext | null>(null)
    const stopRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!active) {
            stopRef.current?.()
            stopRef.current = null
            return
        }

        // L'AudioContext doit être créé/repris suite à une interaction utilisateur,
        // sinon il sera en état "suspended". On tente quand même.
        const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!Ctx) return

        const ctx = ctxRef.current ?? new Ctx()
        ctxRef.current = ctx
        ctx.resume().catch(() => {})

        let cancelled = false
        const oscillators: OscillatorNode[] = []

        function playRing(at: number) {
            if (cancelled) return
            const gain = ctx.createGain()
            gain.gain.setValueAtTime(0, at)
            gain.gain.linearRampToValueAtTime(0.15, at + 0.05)
            gain.gain.setValueAtTime(0.15, at + 0.95)
            gain.gain.linearRampToValueAtTime(0, at + 1.0)
            gain.connect(ctx.destination)

            for (const freq of [440, 480]) {
                const osc = ctx.createOscillator()
                osc.type = 'sine'
                osc.frequency.value = freq
                osc.connect(gain)
                osc.start(at)
                osc.stop(at + 1.0)
                oscillators.push(osc)
            }
        }

        // Planifie 4 cycles à l'avance, puis re-planifie périodiquement
        const cycleDuration = 3.0 // 1s ring + 2s silence
        function scheduleCycles(startAt: number, count: number) {
            for (let i = 0; i < count; i++) {
                playRing(startAt + i * cycleDuration)
            }
        }

        let nextCycle = ctx.currentTime
        scheduleCycles(nextCycle, 4)
        nextCycle += 4 * cycleDuration

        const interval = setInterval(() => {
            if (cancelled) return
            scheduleCycles(nextCycle, 2)
            nextCycle += 2 * cycleDuration
        }, cycleDuration * 1000 * 2)

        stopRef.current = () => {
            cancelled = true
            clearInterval(interval)
            for (const o of oscillators) {
                try {
                    o.stop()
                } catch {
                    // ignore
                }
            }
        }

        return () => {
            stopRef.current?.()
            stopRef.current = null
        }
    }, [active])

    useEffect(() => {
        // Au démontage final, fermer le contexte audio
        return () => {
            ctxRef.current?.close().catch(() => {})
            ctxRef.current = null
        }
    }, [])
}

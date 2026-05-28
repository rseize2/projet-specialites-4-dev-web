import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'

export interface IncomingCall {
    documentId: string
    documentTitle?: string
    by: { id: string; role: string }
}

/**
 * Hook global qui écoute les appels entrants sur N'IMPORTE QUEL document
 * où l'utilisateur a accès (la sélection des destinataires est faite côté serveur,
 * via la room personnelle user:<id>).
 */
export function useIncomingCalls() {
    const [incomingCalls, setIncomingCalls] = useState<Map<string, IncomingCall>>(new Map())

    useEffect(() => {
        const socket = getSocket()

        const onStarted = (payload: IncomingCall) => {
            setIncomingCalls((prev) => {
                const next = new Map(prev)
                next.set(payload.documentId, payload)
                return next
            })
        }

        const onEnded = ({ documentId }: { documentId: string }) => {
            setIncomingCalls((prev) => {
                if (!prev.has(documentId)) return prev
                const next = new Map(prev)
                next.delete(documentId)
                return next
            })
        }

        socket.on('call:started', onStarted)
        socket.on('call:ended', onEnded)

        return () => {
            socket.off('call:started', onStarted)
            socket.off('call:ended', onEnded)
        }
    }, [])

    const dismiss = (documentId: string) =>
        setIncomingCalls((prev) => {
            if (!prev.has(documentId)) return prev
            const next = new Map(prev)
            next.delete(documentId)
            return next
        })

    return { incomingCalls, dismiss }
}

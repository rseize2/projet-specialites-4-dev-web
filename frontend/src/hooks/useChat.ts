import { useCallback, useEffect, useState } from 'react'
import client from '@/api/client'
import { getSocket } from '@/lib/socket'

export interface ChatMessage {
    id: string
    documentId: string
    content: string
    createdAt: string
    user: { id: string; firstName: string; lastName: string }
}

export function useChat(documentId: string | undefined) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // historique au montage
    useEffect(() => {
        if (!documentId) return
        let cancelled = false
        setLoading(true)
        client
            .get(`/api/documents/${documentId}/messages?limit=100`)
            .then((res) => {
                if (!cancelled) setMessages(res.data as ChatMessage[])
            })
            .catch((err) => {
                if (!cancelled) setError(err.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [documentId])

    // join room + écoute messages en direct
    useEffect(() => {
        if (!documentId) return
        const socket = getSocket()
        socket.emit('join-doc', { documentId })

        const onMessage = (msg: ChatMessage) => {
            if (msg.documentId !== documentId) return
            setMessages((prev) =>
                prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
            )
        }

        socket.on('chat:message', onMessage)
        return () => {
            socket.off('chat:message', onMessage)
            socket.emit('leave-doc', { documentId })
        }
    }, [documentId])

    const send = useCallback(
        async (content: string) => {
            if (!documentId || !content.trim()) return
            setSending(true)
            return new Promise<void>((resolve, reject) => {
                getSocket().emit(
                    'chat:send',
                    { documentId, content: content.trim() },
                    (ack: { ok: boolean; error?: string }) => {
                        setSending(false)
                        if (ack?.ok) resolve()
                        else reject(new Error(ack?.error ?? 'SEND_FAILED'))
                    },
                )
            })
        },
        [documentId],
    )

    return { messages, loading, sending, error, send }
}

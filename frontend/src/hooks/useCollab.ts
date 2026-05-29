import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { getSocket } from '@/lib/socket'

export interface ConnectedUser {
    userId: string
    firstName: string
    lastName: string
}

function getWsUrl() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/collab`
}

export function useCollab(
    documentId: string | undefined,
    currentUser?: { id: string; firstName: string; lastName: string } | null,
) {
    const ydoc = useRef(new Y.Doc()).current
    const providerRef = useRef<HocuspocusProvider | null>(null)
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
    const [isSynced, setIsSynced] = useState(false)

    useEffect(() => {
        if (!documentId) return

        const token = localStorage.getItem('token') ?? ''

        const provider = new HocuspocusProvider({
            url: getWsUrl(),
            name: documentId,
            document: ydoc,
            token,
            onSynced: () => setIsSynced(true),
        })
        providerRef.current = provider

        if (currentUser) {
            provider.setAwarenessField('user', {
                name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
                color: userColorHex(currentUser.id),
            })
        }

        const socket = getSocket()
        socket.emit('join-doc', { documentId })

        socket.on('user-joined', ({ userId, firstName, lastName }: ConnectedUser) => {
            setConnectedUsers(prev => {
                if (prev.some(u => u.userId === userId)) return prev
                return [...prev, { userId, firstName, lastName }]
            })
        })

        socket.on('user-left', ({ userId }: { userId: string }) => {
            setConnectedUsers(prev => prev.filter(u => u.userId !== userId))
        })

        return () => {
            provider.destroy()
            providerRef.current = null
            socket.off('user-joined')
            socket.off('user-left')
            socket.emit('leave-doc', { documentId })
            setConnectedUsers([])
            setIsSynced(false)
        }
    }, [documentId])

    return {
        ydoc,
        connectedUsers,
        isSynced,
    }
}

export function userColorHex(userId: string) {
    const palette = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#f43f5e', '#f59e0b']
    const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return palette[hash % palette.length]
}

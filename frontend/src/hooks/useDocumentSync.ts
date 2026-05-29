import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { getSocket } from '@/lib/socket'

export function useDocumentSync(
    documentId: string | undefined,
    editor: Editor | null,
) {
    const [connectedUsers, setConnectedUsers] = useState<string[]>([])
    const emitRef = useRef<(content: string) => void>(() => {})

    useEffect(() => {
        if (!documentId) return
        const socket = getSocket()
        socket.emit('join-doc', { documentId })

        socket.on('user-joined', ({ userId }: { userId: string }) => {
            setConnectedUsers(prev => [...new Set([...prev, userId])])
        })

        socket.on('user-left', ({ userId }: { userId: string }) => {
            setConnectedUsers(prev => prev.filter(id => id !== userId))
        })

        socket.on('doc-update', ({ content }: { content: string }) => {
            if (editor) {
                // false = ne pas déclencher onUpdate (évite la boucle)
                editor.commands.setContent(content, { emitUpdate: false })
            }
        })

        emitRef.current = (content: string) => {
            socket.emit('doc-update', { documentId, content })
        }

        return () => {
            socket.off('user-joined')
            socket.off('user-left')
            socket.off('doc-update')
            socket.emit('leave-doc', { documentId })
            setConnectedUsers([])
        }
    }, [documentId, editor])

    return {
        connectedUsers,
        emitUpdate: (content: string) => emitRef.current(content),
    }
}

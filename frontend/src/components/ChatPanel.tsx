import { useEffect, useRef, useState } from 'react'
import { Send, MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChat } from '@/hooks/useChat'

interface Props {
    documentId: string
    open: boolean
    onClose: () => void
}

export default function ChatPanel({ documentId, open, onClose }: Props) {
    const { messages, loading, sending, send } = useChat(documentId)
    const [value, setValue] = useState('')
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    if (!open) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const content = value.trim()
        if (!content) return
        try {
            await send(content)
            setValue('')
        } catch {
            // toast déjà géré ailleurs si besoin
        }
    }

    return (
        <div className="fixed right-4 bottom-4 w-80 h-96 rounded-xl border border-border bg-card shadow-lg flex flex-col z-50">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4" />
                    Discussion
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
                {loading && <div className="text-muted-foreground text-xs">Chargement...</div>}
                {!loading && messages.length === 0 && (
                    <div className="text-muted-foreground text-xs text-center mt-8">
                        Aucun message. Soyez le premier !
                    </div>
                )}
                {messages.map((m) => (
                    <div key={m.id} className="flex flex-col">
                        <div className="text-xs text-muted-foreground">
                            <span className="font-medium">{m.user.firstName} {m.user.lastName}</span>
                            {' · '}
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm">{m.content}</div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-2 border-t border-border flex gap-2">
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Écrire un message..."
                    disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || !value.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
    ArrowLeft, Phone, PhoneOff, Loader2, Check, UserPlus, Save, MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { getDocument, updateDocument, inviteCollaborator } from '@/api/documents'
import type { DocumentDetail } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import EditorToolbar from '@/components/editor/EditorToolbar'
import CallPanel from '@/components/CallPanel'
import ChatPanel from '@/components/ChatPanel'
import { useCall } from '@/hooks/useCall'

const AUTOSAVE_DELAY = 2000

type SaveStatus = 'saved' | 'saving' | 'unsaved'

export default function DocumentPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const [doc, setDoc] = useState<DocumentDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
    const [title, setTitle] = useState('')

    const [showCallPrompt, setShowCallPrompt] = useState(false)
    const [showChat, setShowChat] = useState(false)
    const call = useCall(id)

    const [showInvite, setShowInvite] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [isInviting, setIsInviting] = useState(false)
    const [inviteSuccess, setInviteSuccess] = useState(false)

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false }),
            Image,
            Placeholder.configure({ placeholder: 'Commencez à écrire...' }),
        ],
        content: '',
        onUpdate: ({ editor: e }) => {
            setSaveStatus('unsaved')
            scheduleAutoSave(e.getHTML())
        },
    })

    useEffect(() => {
        if (id) loadDocument(id)
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current)
        }
    }, [id])

    // Auto-join l'appel si on arrive avec ?call=join (clic sur le toast global)
    useEffect(() => {
        if (searchParams.get('call') !== 'join') return
        if (call.inCall || !id) return
        ;(async () => {
            try {
                await call.join()
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Impossible de rejoindre l'appel")
            } finally {
                // nettoyer l'URL
                searchParams.delete('call')
                setSearchParams(searchParams, { replace: true })
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, searchParams])

    const contentLoadedRef = useRef(false)

    async function loadDocument(docId: string) {
        try {
            const data = await getDocument(docId)
            setDoc(data)
            setTitle(data.title)
            setSaveStatus('saved')
            // Le contenu sera injecté dans l'éditeur par l'useEffect ci-dessous,
            // une fois l'éditeur prêt ET le doc chargé.
        } catch (err) {
            console.error('[DocumentPage] loadDocument failed:', err)
            toast.error('Impossible de charger ce document')
            navigate('/dashboard')
        } finally {
            setIsLoading(false)
        }
    }

    // Sync content → editor une fois les deux prêts (TipTap commandManager peut
    // ne pas être prêt au moment où loadDocument termine).
    useEffect(() => {
        if (!editor || !doc || contentLoadedRef.current) return
        try {
            editor.commands.setContent(doc.content || '')
            contentLoadedRef.current = true
            setSaveStatus('saved')
        } catch (e) {
            // commandManager pas encore prêt — on retentera au prochain render
            console.warn('[DocumentPage] editor not ready yet, retrying...', e)
        }
    }, [editor, doc])

    const scheduleAutoSave = useCallback(
        (content: string) => {
            if (saveTimer.current) clearTimeout(saveTimer.current)
            saveTimer.current = setTimeout(() => {
                saveContent(content)
            }, AUTOSAVE_DELAY)
        },
        [id, title] // eslint-disable-line react-hooks/exhaustive-deps
    )

    async function saveContent(content?: string) {
        if (!id) return
        setSaveStatus('saving')
        try {
            await updateDocument(id, content ?? editor?.getHTML() ?? '', title)
            setSaveStatus('saved')
        } catch {
            setSaveStatus('unsaved')
        }
    }

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        if (!id || !inviteEmail) return
        setIsInviting(true)
        try {
            await inviteCollaborator(id, inviteEmail)
            setInviteSuccess(true)
            setInviteEmail('')
            setTimeout(() => {
                setInviteSuccess(false)
                setShowInvite(false)
            }, 1500)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Impossible d\'envoyer l\'invitation')
        } finally {
            setIsInviting(false)
        }
    }

    function handleTitleBlur() {
        if (title !== doc?.title) {
            saveContent()
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!doc || !editor) return null

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} title="Retour">
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="flex-1 bg-transparent text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                    placeholder="Titre du document..."
                />

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[80px]">
                    {saveStatus === 'saving' && (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Sauvegarde...</span>
                        </>
                    )}
                    {saveStatus === 'saved' && (
                        <>
                            <Check className="h-3 w-3 text-green-500" />
                            <span>Enregistré</span>
                        </>
                    )}
                    {saveStatus === 'unsaved' && (
                        <span className="text-orange-500">Non sauvegardé</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveContent()}
                        disabled={saveStatus === 'saving'}
                    >
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Sauvegarder
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => setShowInvite(true)}>
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        Inviter
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowChat((s) => !s)}
                    >
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                        Chat
                    </Button>

                    <Button
                        variant={call.inCall ? 'destructive' : 'outline'}
                        size="sm"
                        className={call.incomingCall && !call.inCall ? 'animate-pulse ring-2 ring-primary' : ''}
                        onClick={() => {
                            if (call.inCall) call.leave()
                            else setShowCallPrompt(true)
                        }}
                    >
                        {call.inCall ? (
                            <>
                                <PhoneOff className="mr-1.5 h-3.5 w-3.5" />
                                Raccrocher
                            </>
                        ) : (
                            <>
                                <Phone className="mr-1.5 h-3.5 w-3.5" />
                                Appel
                            </>
                        )}
                    </Button>

                    {call.inCall && (
                        <Badge variant="default" className="text-xs">
                            {call.participants.length + 1} en appel
                        </Badge>
                    )}
                </div>
            </div>

            {call.inCall && (
                <CallPanel
                    localStream={call.localStream}
                    remoteStreams={call.remoteStreams}
                    participants={call.participants}
                    micEnabled={call.micEnabled}
                    cameraEnabled={call.cameraEnabled}
                    hasVideo={call.hasVideo}
                    onToggleMic={call.toggleMic}
                    onToggleCamera={call.toggleCamera}
                />
            )}

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <EditorToolbar editor={editor} />
                <EditorContent
                    editor={editor}
                    className="min-h-[500px] max-h-[70vh] overflow-y-auto"
                />
            </div>

            <Dialog open={showInvite} onOpenChange={setShowInvite}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Inviter un collaborateur</DialogTitle>
                        <DialogDescription>
                            La personne recevra un accès pour éditer ce document.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInvite}>
                        <div className="py-4 space-y-2">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="collaborateur@exemple.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isInviting || inviteSuccess}>
                                {inviteSuccess ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Invitation envoyée
                                    </>
                                ) : isInviting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi...
                                    </>
                                ) : (
                                    'Inviter'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showCallPrompt} onOpenChange={setShowCallPrompt}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Démarrer un appel audio</DialogTitle>
                        <DialogDescription>
                            Vous allez démarrer un appel audio avec les collaborateurs de ce document.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCallPrompt(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={async () => {
                                setShowCallPrompt(false)
                                try {
                                    await call.join()
                                } catch (err) {
                                    toast.error(
                                        err instanceof Error ? err.message : "Impossible de démarrer l'appel"
                                    )
                                }
                            }}
                        >
                            <Phone className="mr-2 h-4 w-4" />
                            Démarrer l'appel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {id && (
                <ChatPanel
                    documentId={id}
                    open={showChat}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    )
}

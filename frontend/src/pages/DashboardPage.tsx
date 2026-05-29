import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FileText, FilePlus, Trash2, Clock, User, Search,
    MoreHorizontal, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { getDocuments, createDocument, deleteDocument } from '@/api/documents'
import { fullName } from '@/types'
import type { Document } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
}

export default function DashboardPage() {
    const navigate = useNavigate()

    const [docs, setDocs]              = useState<Document[]>([])
    const [isLoading, setIsLoading]    = useState(true)
    const [search, setSearch]          = useState('')

    const [showNewDoc, setShowNewDoc]      = useState(false)
    const [newDocTitle, setNewDocTitle]    = useState('')
    const [isCreating, setIsCreating]      = useState(false)

    const [showDeleteConfirm, setShowDeleteConfirm]    = useState(false)
    const [docToDelete, setDocToDelete]                = useState<Document | null>(null)
    const [isDeleting, setIsDeleting]                  = useState(false)

    useEffect(() => {
        loadDocs()
    }, [])

    async function loadDocs() {
        try {
            const data = await getDocuments()
            setDocs(data)
        } catch {
        } finally {
            setIsLoading(false)
        }
    }

    async function handleCreateDoc(e: React.FormEvent) {
        e.preventDefault()
        if (!newDocTitle.trim()) return
        setIsCreating(true)
        try {
            const doc = await createDocument(newDocTitle.trim())
            setDocs([doc, ...docs])
            setShowNewDoc(false)
            setNewDocTitle('')
            toast.success('Document créé')
            navigate(`/documents/${doc.id}`)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Impossible de créer le document')
        } finally {
            setIsCreating(false)
        }
    }

    function confirmDelete(doc: Document) {
        setDocToDelete(doc)
        setShowDeleteConfirm(true)
    }

    async function handleDelete() {
        if (!docToDelete) return
        setIsDeleting(true)
        try {
            await deleteDocument(docToDelete.id)
            setDocs(docs.filter((d) => d.id !== docToDelete.id))
            setShowDeleteConfirm(false)
            setDocToDelete(null)
            toast.success('Document supprimé')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Impossible de supprimer le document')
        } finally {
            setIsDeleting(false)
        }
    }

    const filtered = docs.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className    = "text-2xl font-bold text-foreground">Mes documents</h1>
                    <p className     = "text-sm text-muted-foreground">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
                </div>
                <Button size="sm" onClick={() => setShowNewDoc(true)}>
                    <FilePlus className="mr-1.5 h-4 w-4" />
                    Nouveau document
                </Button>
            </div>

            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder    = "Rechercher un document..."
                    value          = {search}
                    onChange       = {(e) => setSearch(e.target.value)}
                    className      = "pl-9"
                />
            </div>

            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FileText className    = "h-10 w-10 opacity-30" />
                    <p className           = "text-sm">
                        {search ? 'Aucun résultat pour cette recherche' : 'Aucun document pour l\'instant'}
                    </p>
                    {!search && (
                        <Button variant="ghost" size="sm" onClick={() => setShowNewDoc(true)}>
                            Créer votre premier document
                        </Button>
                    )}
                </div>
            ) : (
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                    {filtered.map((doc) => (
                        <div
                            key          = {doc.id}
                            className    = "flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick      = {() => navigate(`/documents/${doc.id}`)}
                        >
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-4 w-4 text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className      = "truncate font-medium text-sm text-foreground">{doc.title}</p>
                                <div className    = "flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(doc.updatedAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {doc.updatedByUser ? fullName(doc.updatedByUser) : fullName(doc.owner)}
                                    </span>
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`) }}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Ouvrir
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className    = "text-destructive focus:text-destructive"
                                        onClick      = {(e) => { e.stopPropagation(); confirmDelete(doc) }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={showNewDoc} onOpenChange={setShowNewDoc}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouveau document</DialogTitle>
                        <DialogDescription>Donnez un titre à votre document pour commencer</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDoc}>
                        <div className="py-4">
                            <Label htmlFor="doc-title">Titre du document</Label>
                            <Input
                                id             = "doc-title"
                                className      = "mt-2"
                                placeholder    = "Mon nouveau document..."
                                value          = {newDocTitle}
                                onChange       = {(e) => setNewDocTitle(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type    = "button" variant="outline" onClick={() => setShowNewDoc(false)}>Annuler</Button>
                            <Button type    = "submit" disabled={!newDocTitle.trim() || isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Créer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer le document</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>"{docToDelete?.title}"</strong> ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant    = "outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
                        <Button variant    = "destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

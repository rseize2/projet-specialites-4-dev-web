import { useState, useEffect } from 'react'
import { UserPlus, Lock, Unlock, Loader2, Search, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { getUsers, createUser, blockUser, unblockUser } from '@/api/users'
import type { User } from '@/types'
import { fullName, initials } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export default function AdminUsersPage() {
    const [users, setUsers]            = useState<User[]>([])
    const [isLoading, setIsLoading]    = useState(true)
    const [search, setSearch]          = useState('')
    const [loadingId, setLoadingId]    = useState<string | null>(null)

    const [showCreate, setShowCreate]        = useState(false)
    const [newFirstName, setNewFirstName]    = useState('')
    const [newLastName, setNewLastName]      = useState('')
    const [newEmail, setNewEmail]            = useState('')
    const [newPassword, setNewPassword]      = useState('')
    const [newRole, setNewRole]              = useState<'USER' | 'ADMIN'>('USER')
    const [isCreating, setIsCreating]        = useState(false)

    useEffect(() => {
        loadUsers()
    }, [])

    async function loadUsers() {
        try {
            const data = await getUsers()
            setUsers(data)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Impossible de charger les utilisateurs')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleBlock(user: User) {
        setLoadingId(user.id)
        try {
            if (user.blocked) {
                await unblockUser(user.id)
                setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, blocked: false } : u))
                toast.success(`${fullName(user)} débloqué`)
            } else {
                await blockUser(user.id)
                setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, blocked: true } : u))
                toast.success(`${fullName(user)} bloqué`)
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la modification')
        } finally {
            setLoadingId(null)
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (newPassword.length < 8) {
            toast.error('Le mot de passe doit faire au moins 8 caractères')
            return
        }
        setIsCreating(true)
        try {
            const user = await createUser({ firstName: newFirstName, lastName: newLastName, email: newEmail, password: newPassword, role: newRole })
            setUsers([...users, user])
            setShowCreate(false)
            setNewFirstName(''); setNewLastName(''); setNewEmail(''); setNewPassword(''); setNewRole('USER')
            toast.success('Compte créé avec succès')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la création')
        } finally {
            setIsCreating(false)
        }
    }

    const filtered = users.filter(
        (u) => fullName(u).toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                        <Shield className="h-6 w-6 text-primary" />
                        Gestion des utilisateurs
                    </h1>
                    <p className="text-sm text-muted-foreground">{users.length} compte{users.length !== 1 ? 's' : ''}</p>
                </div>
                <Button size="sm" onClick={() => setShowCreate(true)}>
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Nouveau compte
                </Button>
            </div>

            <div className="mb-4 relative">
                <Search className     = "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder    = "Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className    = "px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                                    <th className    = "px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                                    <th className    = "px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
                                    <th className    = "px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                                    <th className    = "px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Créé le</th>
                                    <th className    = "px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((user) => (
                                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                                                    {initials(user)}
                                                </div>
                                                <span className="font-medium text-foreground truncate max-w-[120px]">{fullName(user)}</span>
                                            </div>
                                        </td>
                                        <td className    = "px-4 py-3 text-muted-foreground truncate max-w-[150px]">{user.email}</td>
                                        <td className    = "px-4 py-3">
                                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                {user.role === 'ADMIN' ? 'Admin' : 'Utilisateur'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={user.blocked ? 'destructive' : 'success'}>
                                                {user.blocked ? 'Bloqué' : 'Actif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                            {user.createdAt ? formatDate(user.createdAt) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant      = "outline"
                                                size         = "sm"
                                                onClick      = {() => handleBlock(user)}
                                                disabled     = {loadingId === user.id}
                                                className    = {user.blocked ? 'text-green-600 hover:text-green-700' : 'text-destructive hover:text-destructive'}
                                            >
                                                {loadingId === user.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : user.blocked ? (
                                                    <><Unlock className="mr-1.5 h-3.5 w-3.5" />Débloquer</>
                                                ) : (
                                                    <><Lock className="mr-1.5 h-3.5 w-3.5" />Bloquer</>
                                                )}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                            Aucun utilisateur trouvé
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Créer un compte</DialogTitle>
                        <DialogDescription>Le nouveau compte sera immédiatement actif.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor    = "new-firstName">Prénom</Label>
                                    <Input id         = "new-firstName" placeholder="Jean" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} required autoFocus />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor    = "new-lastName">Nom</Label>
                                    <Input id         = "new-lastName" placeholder="Dupont" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor    = "new-email">Email</Label>
                                <Input id         = "new-email" type="email" placeholder="jean@exemple.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor    = "new-password">Mot de passe</Label>
                                <Input id         = "new-password" type="password" placeholder="8 caractères minimum" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor    = "new-role">Rôle</Label>
                                <Select value     = {newRole} onValueChange={(v) => setNewRole(v as 'USER' | 'ADMIN')}>
                                    <SelectTrigger id="new-role"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value    = "USER">Utilisateur</SelectItem>
                                        <SelectItem value    = "ADMIN">Administrateur</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type    = "button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                            <Button type    = "submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Créer le compte
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

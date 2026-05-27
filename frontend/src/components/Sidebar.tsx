import { NavLink, useNavigate } from 'react-router-dom'
import { FileText, LayoutDashboard, LogOut, Shield, User } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { logout as logoutApi } from '@/api/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { fullName, initials } from '@/types'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    )

interface SidebarProps {
    onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    async function handleLogout() {
        try {
            await logoutApi()
        } catch {
            // silent — logout client-side even if backend fails
        }
        logout()
        toast.success('Déconnecté')
        navigate('/login')
    }

    return (
        <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
            <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                    <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">WikiCollab</span>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                <NavLink to="/dashboard" className={navLinkClass} end onClick={onNavigate}>
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    Documents
                </NavLink>

                <NavLink to="/profile" className={navLinkClass} onClick={onNavigate}>
                    <User className="h-4 w-4 shrink-0" />
                    Mon profil
                </NavLink>

                {user?.role === 'ADMIN' && (
                    <>
                        <Separator className="my-2" />
                        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Administration
                        </p>
                        <NavLink to="/admin/users" className={navLinkClass} onClick={onNavigate}>
                            <Shield className="h-4 w-4 shrink-0" />
                            Utilisateurs
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="border-t border-border p-3 space-y-2">
                {user && (
                    <div className="flex items-center gap-3 px-2 py-1">
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback>{initials(user)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{fullName(user)}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                </Button>
            </div>
        </aside>
    )
}

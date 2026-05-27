import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
    adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />

    return <>{children}</>
}

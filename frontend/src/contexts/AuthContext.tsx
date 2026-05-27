import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getMe } from '@/api/auth'
import type { User } from '@/types'

interface AuthContextType {
    user: User | null
    token: string | null
    login: (token: string, user: User)    => void
    logout: ()                            => void
    updateUser: (user: User)              => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser]              = useState<User | null>(null)
    const [token, setToken]            = useState<string | null>(null)
    const [isLoading, setIsLoading]    = useState(true)

    useEffect(() => {
        const storedToken    = localStorage.getItem('token')
        const storedUser     = localStorage.getItem('user')
        if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
            getMe()
                .then((freshUser) => {
                    localStorage.setItem('user', JSON.stringify(freshUser))
                    setUser(freshUser)
                })
                .catch(() => {
                    // Token expire
                })
                .finally(() => setIsLoading(false))
        } else {
            setIsLoading(false)
        }
    }, [])

    function login(newToken: string, newUser: User) {
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(newUser))
        setToken(newToken)
        setUser(newUser)
    }

    function logout() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
    }

    function updateUser(updatedUser: User) {
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
    return ctx
}

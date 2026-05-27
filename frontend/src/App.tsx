import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import DocumentPage from '@/pages/DocumentPage'
import ProfilePage from '@/pages/ProfilePage'
import AdminUsersPage from '@/pages/AdminUsersPage'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/documents/:id" element={<DocumentPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute adminOnly>
                                    <AdminUsersPage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>

                <Toaster position="bottom-right" richColors closeButton />
            </BrowserRouter>
        </AuthProvider>
    )
}

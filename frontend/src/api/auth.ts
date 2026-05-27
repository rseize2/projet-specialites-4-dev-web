import client from './client'
import type { LoginDto, LoginResponse, RegisterDto, RegisterResponse, User } from '@/types'

export async function login(data: LoginDto): Promise<LoginResponse> {
    const res = await client.post<LoginResponse>('/api/auth/login', data)
    return res.data
}

export async function register(data: RegisterDto): Promise<RegisterResponse> {
    const res = await client.post<RegisterResponse>('/api/auth/register', data)
    return res.data
}

export async function logout(): Promise<void> {
    await client.post('/api/auth/logout')
}

export async function getMe(): Promise<User> {
    const res = await client.get<User>('/api/users/me')
    return res.data
}

export async function enable2FA(): Promise<{ qrCode: string; secret: string; otpauth: string }> {
    const res = await client.post('/api/auth/2fa/enable')
    return res.data
}

export async function verify2FA(code: string, authToken?: string): Promise<{ token: string; twoFactorEnabled: boolean }> {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined
    const res = await client.post('/api/auth/2fa/verify', { code }, { headers })
    return res.data
}

export async function disable2FA(code: string): Promise<{ twoFactorEnabled: boolean }> {
    const res = await client.post('/api/auth/2fa/disable', { code })
    return res.data
}

export async function updateProfile(data: {
    firstName?: string
    lastName?: string
    email?: string
    currentPassword?: string
    newPassword?: string
}): Promise<User> {
    const res = await client.patch<User>('/api/users/me', data)
    return res.data
}

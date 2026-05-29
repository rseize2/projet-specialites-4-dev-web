import client from './client'
import type { User } from '@/types'

export async function getUsers(): Promise<User[]> {
    const res = await client.get<{ users: User[]; pagination: unknown }>('/api/admin/users', {
        params: { pageSize: 100 },
    })
    return (res.data as { users: User[] }).users
}

export async function createUser(data: {
    firstName: string
    lastName: string
    email: string
    password: string
    role: 'USER' | 'ADMIN'
}): Promise<User> {
    const res = await client.post<User>('/api/admin/users', data)
    return res.data
}

export async function blockUser(id: string): Promise<void> {
    await client.patch(`/api/admin/users/${id}/block`)
}

export async function unblockUser(id: string): Promise<void> {
    await client.patch(`/api/admin/users/${id}/unblock`)
}

export async function deleteUser(id: string): Promise<void> {
    await client.delete(`/api/admin/users/${id}`)
}

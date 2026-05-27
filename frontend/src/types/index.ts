export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: 'USER' | 'ADMIN'
    twoFactorEnabled: boolean
    blocked?: boolean
    createdAt?: string
    updatedAt?: string
}

export interface DocumentOwner {
    id: string
    firstName: string
    lastName: string
}

export interface Document {
    id: string
    title: string
    ownerId: string
    updatedAt: string
    updatedBy: string | null
    owner: DocumentOwner
    updatedByUser: DocumentOwner | null
}

export interface DocumentDetail {
    id: string
    title: string
    content: string
    ownerId: string
    updatedBy: string | null
    createdAt: string
    updatedAt: string
}

export interface LoginResponse {
    user: User
    token: string
    twoFactorRequired?: boolean
}

export interface RegisterResponse {
    user: User
    token: string
}

export interface LoginDto {
    email: string
    password: string
}

export interface RegisterDto {
    email: string
    password: string
    firstName: string
    lastName: string
}

export function fullName(user: Pick<User, 'firstName' | 'lastName'>): string {
    return `${user.firstName} ${user.lastName}`
}

export function initials(user: Pick<User, 'firstName' | 'lastName'>): string {
    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
}

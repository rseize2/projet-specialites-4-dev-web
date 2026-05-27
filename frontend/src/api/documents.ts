import client from './client'
import type { Document, DocumentDetail } from '@/types'

export async function getDocuments(): Promise<Document[]> {
    const res = await client.get<Document[]>('/api/documents')
    return res.data
}

export async function getDocument(id: string): Promise<DocumentDetail> {
    const res = await client.get<DocumentDetail>(`/api/documents/${id}`)
    return res.data
}

export async function createDocument(title: string): Promise<Document> {
    const res = await client.post<Document>('/api/documents', { title })
    return res.data
}

export async function updateDocument(id: string, content: string, title?: string): Promise<void> {
    await client.put(`/api/documents/${id}`, { content, title })
}

export async function deleteDocument(id: string): Promise<void> {
    await client.delete(`/api/documents/${id}`)
}

export async function inviteCollaborator(docId: string, email: string): Promise<void> {
    await client.post(`/api/documents/${docId}/invite`, { email })
}

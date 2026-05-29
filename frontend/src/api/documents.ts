import client from './client'
import type { Document, DocumentDetail, DocumentFile } from '@/types'

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

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

export async function uploadFile(docId: string, file: File): Promise<DocumentFile> {
    const form = new FormData()
    form.append('file', file)
    const res = await client.post<DocumentFile>(`/api/documents/${docId}/files`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
}

export async function listFiles(docId: string): Promise<DocumentFile[]> {
    const res = await client.get<DocumentFile[]>(`/api/documents/${docId}/files`)
    return res.data
}

export async function downloadFile(docId: string, fileId: string, filename: string): Promise<void> {
    const res = await client.get(`/api/documents/${docId}/files/${fileId}`, {
        responseType: 'blob',
    })
    triggerDownload(res.data as Blob, filename)
}

export async function deleteFile(docId: string, fileId: string): Promise<void> {
    await client.delete(`/api/documents/${docId}/files/${fileId}`)
}

export async function exportPdf(docId: string, title: string): Promise<void> {
    const res = await client.get(`/api/documents/${docId}/export`, {
        params: { format: 'pdf' },
        responseType: 'blob',
    })
    triggerDownload(res.data as Blob, `${title}.pdf`)
}

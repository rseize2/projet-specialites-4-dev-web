import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Connexion Socket.io partagée, authentifiée via le JWT du localStorage.
 * Singleton - toutes les pages partagent la même socket.
 */
export function getSocket(): Socket {
    if (socket && socket.connected) return socket

    const token = localStorage.getItem('token')
    socket = io({
        auth: { token: token ?? '' },
        transports: ['websocket', 'polling'],
        autoConnect: true,
    })

    return socket
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

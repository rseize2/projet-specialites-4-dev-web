import { useCallback, useEffect, useRef, useState } from 'react'
import { getSocket } from '@/lib/socket'

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
]

export interface CallParticipant {
    socketId: string
    user: { id: string; role: string; firstName: string; lastName: string } | null
}

export interface IncomingCall {
    documentId: string
    by: { id: string; role: string }
}

interface UseCallReturn {
    inCall: boolean
    participants: CallParticipant[]
    localStream: MediaStream | null
    remoteStreams: Map<string, MediaStream>
    incomingCall: IncomingCall | null
    dismissIncoming: () => void
    join: () => Promise<void>
    leave: () => void
    error: string | null
    micEnabled: boolean
    cameraEnabled: boolean
    toggleMic: () => void
    toggleCamera: () => void
    hasVideo: boolean
}

/**
 * Appel audio multi-participants en mesh P2P via WebRTC.
 *
 * Stratégie de signalisation :
 *  - À l'arrivée, le serveur nous envoie `call:participants` (liste des présents).
 *    Pour chacun d'eux, NOUS initions une offer (nous sommes le "polite peer").
 *  - Quand quelqu'un de nouveau arrive après nous (`call:participant-joined`),
 *    on attend qu'IL nous envoie une offer.
 *  - Sur réception d'un signal, on route vers la bonne RTCPeerConnection.
 */
export function useCall(documentId: string | undefined): UseCallReturn {
    const [inCall, setInCall] = useState(false)
    const [participants, setParticipants] = useState<CallParticipant[]>([])
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
    const [error, setError] = useState<string | null>(null)
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
    const [micEnabled, setMicEnabled] = useState(true)
    const [cameraEnabled, setCameraEnabled] = useState(true)
    const [hasVideo, setHasVideo] = useState(false)

    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
    const localStreamRef = useRef<MediaStream | null>(null)

    const createPeer = useCallback(
        (remoteSocketId: string, isInitiator: boolean) => {
            const socket = getSocket()
            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

            // ajouter notre stream local au peer
            const stream = localStreamRef.current
            if (stream) {
                stream.getTracks().forEach((t) => pc.addTrack(t, stream))
            }

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit('call:signal', {
                        documentId,
                        to: remoteSocketId,
                        kind: 'ice',
                        data: e.candidate,
                    })
                }
            }

            pc.ontrack = (e) => {
                const [remote] = e.streams
                setRemoteStreams((prev) => {
                    const next = new Map(prev)
                    next.set(remoteSocketId, remote)
                    return next
                })
            }

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    cleanupPeer(remoteSocketId)
                }
            }

            peersRef.current.set(remoteSocketId, pc)

            if (isInitiator) {
                pc.createOffer()
                    .then((offer) => pc.setLocalDescription(offer))
                    .then(() => {
                        socket.emit('call:signal', {
                            documentId,
                            to: remoteSocketId,
                            kind: 'offer',
                            data: pc.localDescription,
                        })
                    })
                    .catch((err) => console.error('createOffer failed:', err))
            }

            return pc
        },
        [documentId],
    )

    const cleanupPeer = useCallback((socketId: string) => {
        const pc = peersRef.current.get(socketId)
        if (pc) {
            pc.close()
            peersRef.current.delete(socketId)
        }
        setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.delete(socketId)
            return next
        })
        setParticipants((prev) => prev.filter((p) => p.socketId !== socketId))
    }, [])

    const join = useCallback(async () => {
        if (!documentId || inCall) return
        setError(null)
        try {
            // Tente audio + vidéo, fallback en audio seul si pas de cam
            let stream: MediaStream
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: { width: { ideal: 640 }, height: { ideal: 480 } },
                })
                setHasVideo(true)
            } catch (videoErr) {
                console.warn('[useCall] caméra indisponible, fallback audio:', videoErr)
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                })
                setHasVideo(false)
            }
            localStreamRef.current = stream
            setLocalStream(stream)
            setMicEnabled(true)
            setCameraEnabled(stream.getVideoTracks().length > 0)

            const socket = getSocket()
            await new Promise<void>((resolve, reject) => {
                socket.emit('call:join', { documentId }, (resp: { ok: boolean; error?: string }) => {
                    if (resp.ok) resolve()
                    else reject(new Error(resp.error ?? 'JOIN_FAILED'))
                })
            })
            setInCall(true)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'CALL_FAILED'
            setError(msg)
            // Nettoyage si on a déjà ouvert le micro
            localStreamRef.current?.getTracks().forEach((t) => t.stop())
            localStreamRef.current = null
            setLocalStream(null)
        }
    }, [documentId, inCall])

    const leave = useCallback(() => {
        if (!inCall) return
        const socket = getSocket()
        if (documentId) socket.emit('call:leave', { documentId })

        // fermer tous les peers
        peersRef.current.forEach((pc) => pc.close())
        peersRef.current.clear()
        setRemoteStreams(new Map())
        setParticipants([])

        // couper le micro
        localStreamRef.current?.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
        setLocalStream(null)

        setInCall(false)
    }, [documentId, inCall])

    // Écoute permanente des appels entrants (même quand on n'est pas in-call)
    useEffect(() => {
        if (!documentId) return
        const socket = getSocket()

        const onCallStarted = (payload: IncomingCall) => {
            if (payload.documentId !== documentId) return
            setIncomingCall(payload)
        }

        const onCallEnded = ({ documentId: docId }: { documentId: string }) => {
            if (docId !== documentId) return
            setIncomingCall(null)
        }

        socket.on('call:started', onCallStarted)
        socket.on('call:ended', onCallEnded)

        return () => {
            socket.off('call:started', onCallStarted)
            socket.off('call:ended', onCallEnded)
        }
    }, [documentId])

    // listeners Socket.io (in-call uniquement)
    useEffect(() => {
        if (!inCall || !documentId) return
        const socket = getSocket()

        const onParticipants = ({ participants: list }: { participants: CallParticipant[] }) => {
            setParticipants(list)
            // On initie une offer pour chaque participant déjà présent
            list.forEach((p) => createPeer(p.socketId, true))
        }

        const onJoined = (p: CallParticipant) => {
            setParticipants((prev) => [...prev, p])
            // On NE prend PAS l'initiative — on attend leur offer
        }

        const onLeft = ({ socketId }: { socketId: string }) => {
            cleanupPeer(socketId)
        }

        const onSignal = async ({
            from,
            kind,
            data,
        }: {
            from: string
            kind: 'offer' | 'answer' | 'ice'
            data: any
        }) => {
            let pc = peersRef.current.get(from)
            if (!pc && kind === 'offer') {
                pc = createPeer(from, false)
            }
            if (!pc) return

            try {
                if (kind === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data))
                    const answer = await pc.createAnswer()
                    await pc.setLocalDescription(answer)
                    getSocket().emit('call:signal', {
                        documentId,
                        to: from,
                        kind: 'answer',
                        data: pc.localDescription,
                    })
                } else if (kind === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data))
                } else if (kind === 'ice') {
                    await pc.addIceCandidate(new RTCIceCandidate(data))
                }
            } catch (err) {
                console.error('signal handling error:', err)
            }
        }

        socket.on('call:participants', onParticipants)
        socket.on('call:participant-joined', onJoined)
        socket.on('call:participant-left', onLeft)
        socket.on('call:signal', onSignal)

        return () => {
            socket.off('call:participants', onParticipants)
            socket.off('call:participant-joined', onJoined)
            socket.off('call:participant-left', onLeft)
            socket.off('call:signal', onSignal)
        }
    }, [inCall, documentId, createPeer, cleanupPeer])

    // cleanup au démontage
    useEffect(() => {
        return () => {
            if (inCall) leave()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Quand on rejoint un appel, on dismiss l'incoming
    useEffect(() => {
        if (inCall) setIncomingCall(null)
    }, [inCall])

    const toggleMic = useCallback(() => {
        const stream = localStreamRef.current
        if (!stream) return
        const next = !micEnabled
        stream.getAudioTracks().forEach((t) => (t.enabled = next))
        setMicEnabled(next)
    }, [micEnabled])

    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current
        if (!stream) return
        const tracks = stream.getVideoTracks()
        if (tracks.length === 0) return
        const next = !cameraEnabled
        tracks.forEach((t) => (t.enabled = next))
        setCameraEnabled(next)
    }, [cameraEnabled])

    return {
        inCall,
        participants,
        localStream,
        remoteStreams,
        incomingCall,
        dismissIncoming: () => setIncomingCall(null),
        join,
        leave,
        error,
        micEnabled,
        cameraEnabled,
        toggleMic,
        toggleCamera,
        hasVideo,
    }
}

import { useEffect, useRef } from 'react'
import { Mic, MicOff, Video, VideoOff, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CallParticipant } from '@/hooks/useCall'

interface Props {
    localStream: MediaStream | null
    remoteStreams: Map<string, MediaStream>
    participants: CallParticipant[]
    micEnabled: boolean
    cameraEnabled: boolean
    hasVideo: boolean
    onToggleMic: () => void
    onToggleCamera: () => void
    selfName?: string
}

interface TileProps {
    stream: MediaStream | null
    name: string
    muted: boolean
    isLocal?: boolean
    micOn?: boolean
    camOn?: boolean
}

function VideoTile({ stream, name, muted, isLocal, micOn = true, camOn = true }: TileProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
    }, [stream])

    const hasVideoTrack = !!stream && stream.getVideoTracks().some((t) => t.enabled)

    return (
        <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
            {hasVideoTrack && camOn ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
                />
            ) : (
                <>
                    {/* audio toujours actif même si pas de vidéo */}
                    {stream && !isLocal && (
                        <audio
                            ref={(el) => {
                                if (el) el.srcObject = stream
                            }}
                            autoPlay
                            playsInline
                        />
                    )}
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-background">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                </>
            )}

            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
                <div className="rounded bg-black/60 px-2 py-0.5 text-xs text-white max-w-[70%] truncate">
                    {name}{isLocal ? ' (vous)' : ''}
                </div>
                <div className="flex gap-1">
                    {!micOn && (
                        <div className="rounded bg-red-500/80 p-1">
                            <MicOff className="h-3 w-3 text-white" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function CallPanel({
    localStream,
    remoteStreams,
    participants,
    micEnabled,
    cameraEnabled,
    hasVideo,
    onToggleMic,
    onToggleCamera,
    selfName = 'Vous',
}: Props) {
    const total = participants.length + 1
    // tailwind ne supporte pas le calcul dynamique des grilles → on choisit selon le nombre
    const cols =
        total <= 1 ? 'grid-cols-1' :
        total === 2 ? 'grid-cols-2' :
        total <= 4 ? 'grid-cols-2' :
        'grid-cols-3'

    return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Appel en cours — {total} participant{total > 1 ? 's' : ''}
                </div>
                <div className="flex gap-1.5">
                    <Button
                        size="icon"
                        variant={micEnabled ? 'outline' : 'destructive'}
                        className="h-8 w-8"
                        onClick={onToggleMic}
                        title={micEnabled ? 'Couper le micro' : 'Activer le micro'}
                    >
                        {micEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                    </Button>
                    {hasVideo && (
                        <Button
                            size="icon"
                            variant={cameraEnabled ? 'outline' : 'destructive'}
                            className="h-8 w-8"
                            onClick={onToggleCamera}
                            title={cameraEnabled ? 'Couper la caméra' : 'Activer la caméra'}
                        >
                            {cameraEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                        </Button>
                    )}
                </div>
            </div>

            <div className={`grid ${cols} gap-2`}>
                {/* Tuile locale */}
                <VideoTile
                    stream={localStream}
                    name={selfName}
                    muted
                    isLocal
                    micOn={micEnabled}
                    camOn={cameraEnabled}
                />

                {/* Tuiles distantes */}
                {participants.map((p) => {
                    const stream = remoteStreams.get(p.socketId) ?? null
                    const name = p.user
                        ? `${p.user.firstName} ${p.user.lastName}`.trim() || p.user.id.slice(0, 8)
                        : p.socketId.slice(0, 6)
                    return (
                        <VideoTile
                            key={p.socketId}
                            stream={stream}
                            name={name + (stream ? '' : ' (connexion...)')}
                            muted={false}
                        />
                    )
                })}
            </div>
        </div>
    )
}

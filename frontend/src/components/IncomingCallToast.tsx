import { Phone, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    open: boolean
    documentTitle?: string
    onAccept: ()     => void
    onDismiss: ()    => void
}

export default function IncomingCallToast({
    open,
    documentTitle,
    onAccept,
    onDismiss,
}: Props) {
    if (!open) return null

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="relative rounded-xl border border-border bg-card shadow-xl p-4 w-80">
                {/* Onde de pulsation */}
                <div className="absolute inset-0 rounded-xl pointer-events-none">
                    <div className="absolute inset-0 rounded-xl border-2 border-primary/40 animate-ping" />
                </div>

                <div className="relative flex items-start gap-3">
                    {/* Icône téléphone qui sonne */}
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                        <div className="relative h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-primary animate-bounce" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">Appel entrant</div>
                        <div className="text-xs text-muted-foreground truncate">
                            {documentTitle ? (
                                <>
                                    Sur le document <span className="font-medium">{documentTitle}</span>
                                </>
                            ) : (
                                'Un collaborateur a démarré un appel'
                            )}
                        </div>

                        <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={onAccept} className="flex-1">
                                <Phone className="mr-1.5 h-3.5 w-3.5" />
                                Rejoindre
                            </Button>
                            <Button size="sm" variant="ghost" onClick={onDismiss}>
                                <PhoneOff className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

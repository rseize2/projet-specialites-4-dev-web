import { useNavigate, useLocation } from 'react-router-dom'
import { useIncomingCalls } from '@/hooks/useIncomingCalls'
import { useRingtone } from '@/hooks/useRingtone'
import IncomingCallToast from './IncomingCallToast'

/**
 * Affiche le toast d'appel entrant pour le premier appel actif.
 * (Cas multi-appels simultanés rare en pratique — KISS.)
 */
export default function GlobalCallNotifications() {
    const { incomingCalls, dismiss } = useIncomingCalls()
    const navigate = useNavigate()
    const location = useLocation()

    const calls = Array.from(incomingCalls.values())
    const current = calls[0]

    // Sonnerie tant qu'un appel entrant est affiché
    useRingtone(!!current)

    if (!current) return null

    function handleAccept() {
        if (!current) return
        dismiss(current.documentId)
        const target = `/documents/${current.documentId}?call=join`
        if (location.pathname === `/documents/${current.documentId}`) {
            // déjà sur la page → on replace l'URL pour déclencher l'effet
            navigate(target, { replace: true })
        } else {
            navigate(target)
        }
    }

    return (
        <IncomingCallToast
            open
            documentTitle={current.documentTitle}
            onAccept={handleAccept}
            onDismiss={() => dismiss(current.documentId)}
        />
    )
}

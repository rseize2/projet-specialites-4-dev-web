import { useState } from 'react'
import { Loader2, Check, Shield, ShieldCheck, KeyRound, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile, enable2FA, verify2FA, disable2FA } from '@/api/auth'
import { fullName, initials } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProfilePage() {
    const { user, updateUser } = useAuth()

    const [firstName, setFirstName]    = useState(user?.firstName ?? '')
    const [lastName, setLastName]      = useState(user?.lastName ?? '')
    const [isSaving, setIsSaving]      = useState(false)

    const [currentPassword, setCurrentPassword]          = useState('')
    const [newPassword, setNewPassword]                  = useState('')
    const [confirmPassword, setConfirmPassword]          = useState('')
    const [isChangingPassword, setIsChangingPassword]    = useState(false)

    const [qrCode, setQrCode]                = useState('')
    const [secret, setSecret]                = useState('')
    const [totpInput, setTotpInput]          = useState('')
    const [disableInput, setDisableInput]    = useState('')
    const [isEnabling, setIsEnabling]        = useState(false)
    const [isVerifying, setIsVerifying]      = useState(false)
    const [isDisabling, setIsDisabling]      = useState(false)
    const [twoFASuccess, setTwoFASuccess]    = useState(false)

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault()
        setIsSaving(true)
        try {
            const updated = await updateProfile({ firstName, lastName })
            updateUser(updated)
            toast.success('Profil mis à jour')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
        } finally {
            setIsSaving(false)
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas')
            return
        }
        setIsChangingPassword(true)
        try {
            await updateProfile({ currentPassword, newPassword })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            toast.success('Mot de passe modifié')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe')
        } finally {
            setIsChangingPassword(false)
        }
    }

    async function handleEnable2FA() {
        setIsEnabling(true)
        try {
            const data = await enable2FA()
            setQrCode(data.qrCode)
            setSecret(data.secret)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la configuration 2FA')
        } finally {
            setIsEnabling(false)
        }
    }

    async function handleVerify2FA(e: React.FormEvent) {
        e.preventDefault()
        setIsVerifying(true)
        try {
            await verify2FA(totpInput)
            if (user) updateUser({ ...user, twoFactorEnabled: true })
            setTwoFASuccess(true)
            setQrCode('')
            setSecret('')
            setTotpInput('')
            toast.success('2FA activé avec succès !')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Code invalide')
            setTotpInput('')
        } finally {
            setIsVerifying(false)
        }
    }

    async function handleDisable2FA(e: React.FormEvent) {
        e.preventDefault()
        setIsDisabling(true)
        try {
            await disable2FA(disableInput)
            if (user) updateUser({ ...user, twoFactorEnabled: false })
            setTwoFASuccess(false)
            setDisableInput('')
            toast.success('2FA désactivé')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Code invalide')
            setDisableInput('')
        } finally {
            setIsDisabling(false)
        }
    }

    if (!user) return null

    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold text-foreground">Mon profil</h1>

            <Tabs defaultValue="info">
                <TabsList className="mb-6">
                    <TabsTrigger value    = "info">Informations</TabsTrigger>
                    <TabsTrigger value    = "security">Sécurité & 2FA</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary text-xl font-semibold">
                                    {initials(user)}
                                </div>
                                <div>
                                    <CardTitle>{fullName(user)}</CardTitle>
                                    <CardDescription>{user.email}</CardDescription>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                            {user.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                                        </Badge>
                                        {user.twoFactorEnabled && (
                                            <Badge variant="success" className="gap-1">
                                                <ShieldCheck className="h-3 w-3" />
                                                2FA activé
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <Separator />

                        <form onSubmit={handleSaveProfile}>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor    = "firstName">Prénom</Label>
                                        <Input id         = "firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor    = "lastName">Nom</Label>
                                        <Input id         = "lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value={user.email} disabled className="opacity-60" />
                                </div>

                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                    Sauvegarder
                                </Button>
                            </CardContent>
                        </form>

                        <Separator />

                        <form onSubmit={handleChangePassword}>
                            <CardContent className="space-y-4 pt-6">
                                <p className      = "text-sm font-medium text-foreground">Changer de mot de passe</p>
                                <div className    = "space-y-2">
                                    <Label htmlFor    = "currentPassword">Mot de passe actuel</Label>
                                    <Input id         = "currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor    = "newPassword">Nouveau mot de passe</Label>
                                    <Input id         = "newPassword" type="password" placeholder="8 caractères minimum" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor    = "confirmPassword">Confirmer</Label>
                                    <Input id         = "confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                </div>
                                <Button type="submit" variant="outline" disabled={isChangingPassword}>
                                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Changer le mot de passe
                                </Button>
                            </CardContent>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Authentification à deux facteurs
                            </CardTitle>
                            <CardDescription>
                                Renforcez la sécurité de votre compte avec une application d'authentification (Google Authenticator, Authy...).
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {(user.twoFactorEnabled || twoFASuccess) ? (
                                <>
                                    <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800">
                                        <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                                        <div>
                                            <p className    = "font-medium">2FA activé</p>
                                            <p className    = "text-sm opacity-80">Votre compte est protégé par une authentification à deux facteurs.</p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <form onSubmit={handleDisable2FA} className="space-y-3">
                                        <p className      = "text-sm font-medium text-foreground">Désactiver la 2FA</p>
                                        <div className    = "space-y-2">
                                            <Label htmlFor="disable-totp">Code de confirmation</Label>
                                            <Input
                                                id             = "disable-totp"
                                                type           = "text"
                                                placeholder    = "000000"
                                                maxLength      = {6}
                                                inputMode      = "numeric"
                                                value          = {disableInput}
                                                onChange       = {(e) => setDisableInput(e.target.value)}
                                                className      = "w-40"
                                            />
                                        </div>
                                        <Button type="submit" variant="destructive" size="sm" disabled={disableInput.length !== 6 || isDisabling}>
                                            {isDisabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                                            Désactiver la 2FA
                                        </Button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex items-center gap-3 rounded-lg bg-muted p-4 text-muted-foreground">
                                    <Shield className="h-5 w-5 flex-shrink-0" />
                                    <div>
                                        <p className    = "font-medium text-foreground">2FA non activé</p>
                                        <p className    = "text-sm">Activez le 2FA pour sécuriser davantage votre compte.</p>
                                    </div>
                                </div>
                            )}

                            {!user.twoFactorEnabled && !twoFASuccess && !qrCode && (
                                <Button onClick={handleEnable2FA} disabled={isEnabling} variant="outline">
                                    {isEnabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                    Configurer le 2FA
                                </Button>
                            )}

                            {qrCode && (
                                <div className="space-y-4">
                                    <Separator />
                                    <div>
                                        <p className    = "mb-3 text-sm font-medium">1. Scannez ce QR code avec votre application</p>
                                        <img src        = {qrCode} alt="QR Code 2FA" className="rounded-lg border border-border" width={200} height={200} />
                                        <p className    = "mt-2 text-xs text-muted-foreground">
                                            Clé manuelle : <code className="rounded bg-muted px-1 py-0.5 font-mono">{secret}</code>
                                        </p>
                                    </div>

                                    <form onSubmit={handleVerify2FA} className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="totp-verify">2. Entrez le code à 6 chiffres pour confirmer</Label>
                                            <Input
                                                id             = "totp-verify"
                                                type           = "text"
                                                placeholder    = "000000"
                                                maxLength      = {6}
                                                inputMode      = "numeric"
                                                value          = {totpInput}
                                                onChange       = {(e) => setTotpInput(e.target.value)}
                                                className      = "w-40"
                                            />
                                        </div>
                                        <Button type="submit" disabled={totpInput.length !== 6 || isVerifying}>
                                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Activer le 2FA
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { login as loginApi, verify2FA, getMe } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
    const navigate     = useNavigate()
    const { login }    = useAuth()

    const [email, setEmail]            = useState('')
    const [password, setPassword]      = useState('')
    const [isLoading, setIsLoading]    = useState(false)

    const [twoFactorRequired, setTwoFactorRequired]    = useState(false)
    const [totpCode, setTotpCode]                      = useState('')
    const [partialToken, setPartialToken]              = useState('')
    const [isVerifying, setIsVerifying]                = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await loginApi({ email, password })

            if (res.twoFactorRequired) {
                setPartialToken(res.token)
                setTwoFactorRequired(true)
                toast.info('Entrez votre code d\'authentification à deux facteurs')
            } else {
                login(res.token, res.user)
                navigate('/dashboard')
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Identifiants incorrects')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleVerify2FA(e: React.FormEvent) {
        e.preventDefault()
        setIsVerifying(true)
        try {
            const res = await verify2FA(totpCode, partialToken)
            localStorage.setItem('token', res.token)
            const realUser = await getMe()
            login(res.token, realUser)
            navigate('/dashboard')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Code 2FA invalide')
            setTotpCode('')
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className    = "text-2xl font-bold text-foreground">WikiCollab</h1>
                    <p className     = "text-sm text-muted-foreground">Édition collaborative en temps réel</p>
                </div>

                <Card>
                    {!twoFactorRequired ? (
                        <>
                            <CardHeader>
                                <CardTitle>Connexion</CardTitle>
                                <CardDescription>Entrez vos identifiants pour accéder à vos documents</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id             = "email"
                                            type           = "email"
                                            placeholder    = "vous@exemple.com"
                                            value          = {email}
                                            onChange       = {(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Mot de passe</Label>
                                        <Input
                                            id             = "password"
                                            type           = "password"
                                            placeholder    = "••••••••"
                                            value          = {password}
                                            onChange       = {(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-3">
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Se connecter
                                    </Button>
                                    <p className="text-sm text-muted-foreground">
                                        Pas encore de compte ?{' '}
                                        <Link to="/register" className="text-primary hover:underline">
                                            S'inscrire
                                        </Link>
                                    </p>
                                </CardFooter>
                            </form>
                        </>
                    ) : (
                        <>
                            <CardHeader>
                                <CardTitle>Vérification 2FA</CardTitle>
                                <CardDescription>
                                    Ouvrez votre application d'authentification et entrez le code à 6 chiffres.
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleVerify2FA}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="totp">Code d'authentification</Label>
                                        <Input
                                            id             = "totp"
                                            type           = "text"
                                            placeholder    = "000000"
                                            maxLength      = {6}
                                            inputMode      = "numeric"
                                            value          = {totpCode}
                                            onChange       = {(e) => setTotpCode(e.target.value)}
                                            autoFocus
                                            autoComplete="one-time-code"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-3">
                                    <Button type="submit" className="w-full" disabled={isVerifying || totpCode.length !== 6}>
                                        {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Vérifier
                                    </Button>
                                    <Button
                                        type       = "button"
                                        variant    = "ghost"
                                        size       = "sm"
                                        onClick    = {() => { setTwoFactorRequired(false); setPartialToken(''); setTotpCode('') }}
                                    >
                                        Retour à la connexion
                                    </Button>
                                </CardFooter>
                            </form>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}

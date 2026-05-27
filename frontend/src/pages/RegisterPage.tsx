import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { register as registerApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
    const navigate     = useNavigate()
    const { login }    = useAuth()

    const [firstName, setFirstName]    = useState('')
    const [lastName, setLastName]      = useState('')
    const [email, setEmail]            = useState('')
    const [password, setPassword]      = useState('')
    const [confirm, setConfirm]        = useState('')
    const [isLoading, setIsLoading]    = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (password !== confirm) {
            toast.error('Les mots de passe ne correspondent pas')
            return
        }
        if (password.length < 8) {
            toast.error('Le mot de passe doit faire au moins 8 caractères')
            return
        }

        setIsLoading(true)
        try {
            const res = await registerApi({ firstName, lastName, email, password })
            login(res.token, res.user)
            toast.success('Compte créé avec succès !')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur lors de l'inscription")
        } finally {
            setIsLoading(false)
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
                    <p className     = "text-sm text-muted-foreground">Créez votre compte</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Inscription</CardTitle>
                        <CardDescription>Rejoignez WikiCollab pour collaborer sur des documents</CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom</Label>
                                    <Input
                                        id             = "firstName"
                                        placeholder    = "Jean"
                                        value          = {firstName}
                                        onChange       = {(e) => setFirstName(e.target.value)}
                                        required
                                        autoComplete="given-name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nom</Label>
                                    <Input
                                        id             = "lastName"
                                        placeholder    = "Dupont"
                                        value          = {lastName}
                                        onChange       = {(e) => setLastName(e.target.value)}
                                        required
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>

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
                                    placeholder    = "8 caractères minimum"
                                    value          = {password}
                                    onChange       = {(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                                <Input
                                    id             = "confirm"
                                    type           = "password"
                                    placeholder    = "••••••••"
                                    value          = {confirm}
                                    onChange       = {(e) => setConfirm(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Créer mon compte
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                Déjà un compte ?{' '}
                                <Link to="/login" className="text-primary hover:underline">
                                    Se connecter
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}

'use client'

import { useState, useTransition } from 'react'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

export default function SignUpPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [formError, setFormError] = useState('')
    const [formSuccess, setFormSuccess] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')
        setFormSuccess('')

        if (!fullName || !email || !password || !confirmPassword) {
            const message = 'Please fill in all fields'
            setFormError(message)
            toast.error(message)
            return
        }

        if (password !== confirmPassword) {
            const message = 'Passwords do not match'
            setFormError(message)
            toast.error(message)
            return
        }

        if (password.length < 6) {
            const message = 'Password must be at least 6 characters'
            setFormError(message)
            toast.error(message)
            return
        }

        startTransition(async () => {
            try {
                const result = await signUp({ email, password, fullName })

                if (result.error) {
                    setFormError(result.error)
                    toast.error(result.error)
                    return
                }

                const successMessage = result.message || 'Account created successfully!'
                setFormSuccess(successMessage)
                setPassword('')
                setConfirmPassword('')
                toast.success(successMessage)

                if (result.requiresEmailConfirmation) {
                    return
                }

                router.refresh()
                router.push('/dashboard')
            } catch {
                const message = 'Unable to create account right now. Please try again.'
                setFormError(message)
                toast.error(message)
            }
        })
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center">
                <Card className="w-full max-w-md glass border-0 shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserPlus className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl text-secondary">Create Account</CardTitle>
                        <CardDescription>Sign up to track and manage your shipments</CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {formError ? (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {formError}
                                </p>
                            ) : null}

                            {formSuccess ? (
                                <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                                    {formSuccess}
                                </p>
                            ) : null}
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="bg-white/50"
                                    required
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white/50"
                                    required
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/50"
                                    required
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-white/50"
                                    required
                                    disabled={isPending}
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>

                            <p className="text-sm text-slate-500 text-center">
                                Already have an account?{' '}
                                <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </main>
        </div>
    )
}

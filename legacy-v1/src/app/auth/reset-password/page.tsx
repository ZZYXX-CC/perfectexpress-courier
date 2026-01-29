'use client'

import { useState, useTransition, useEffect } from 'react'
import { resetPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Lock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(false)

    // Check if we have a valid session (user came from reset email)
    useEffect(() => {
        // Supabase handles the token exchange automatically via the URL hash
        // The session will be set if the user clicked a valid reset link
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        startTransition(async () => {
            const result = await resetPassword(password)
            if (result.error) {
                toast.error(result.error)
                setError(true)
            } else {
                setSuccess(true)
                toast.success('Password reset successfully!')
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push('/auth/login')
                }, 2000)
            }
        })
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center">
                    <Card className="w-full max-w-md glass border-0 shadow-2xl">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl text-secondary">Password Reset!</CardTitle>
                            <CardDescription>
                                Your password has been successfully reset
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center text-slate-500">
                            <p>Redirecting you to login...</p>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Link href="/auth/login">
                                <Button variant="outline">Go to Login</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center">
                    <Card className="w-full max-w-md glass border-0 shadow-2xl">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <CardTitle className="text-2xl text-secondary">Reset Failed</CardTitle>
                            <CardDescription>
                                The password reset link may have expired or is invalid
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center text-slate-500">
                            <p>Please request a new password reset link</p>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Link href="/auth/forgot-password">
                                <Button>Request New Link</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center">
                <Card className="w-full max-w-md glass border-0 shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl text-secondary">Set New Password</CardTitle>
                        <CardDescription>
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/50"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-white/50"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Password must be at least 6 characters long
                            </p>
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </main>
        </div>
    )
}

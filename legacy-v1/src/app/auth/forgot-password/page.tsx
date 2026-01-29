'use client'

import { useState, useTransition } from 'react'
import { requestPasswordReset } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default function ForgotPasswordPage() {
    const [isPending, startTransition] = useTransition()
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error('Please enter your email address')
            return
        }

        startTransition(async () => {
            const result = await requestPasswordReset(email)
            if (result.error) {
                toast.error(result.error)
            } else {
                setSubmitted(true)
                toast.success(result.message)
            }
        })
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center">
                <Card className="w-full max-w-md glass border-0 shadow-2xl">
                    {submitted ? (
                        <>
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <CardTitle className="text-2xl text-secondary">Check Your Email</CardTitle>
                                <CardDescription>
                                    We've sent a password reset link to <strong>{email}</strong>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center text-slate-500">
                                <p>Click the link in the email to reset your password. If you don't see it, check your spam folder.</p>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setSubmitted(false)}
                                >
                                    Try a different email
                                </Button>
                                <Link href="/auth/login" className="text-sm text-primary font-semibold hover:underline">
                                    Back to login
                                </Link>
                            </CardFooter>
                        </>
                    ) : (
                        <>
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Mail className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl text-secondary">Forgot Password?</CardTitle>
                                <CardDescription>
                                    Enter your email address and we'll send you a link to reset your password
                                </CardDescription>
                            </CardHeader>

                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="bg-white/50"
                                            required
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
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </Button>

                                    <Link 
                                        href="/auth/login" 
                                        className="inline-flex items-center text-sm text-slate-500 hover:text-primary"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to login
                                    </Link>
                                </CardFooter>
                            </form>
                        </>
                    )}
                </Card>
            </main>
        </div>
    )
}

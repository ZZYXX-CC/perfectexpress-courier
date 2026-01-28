'use client'

import { useState, useTransition } from 'react'
import { updateProfile, updateEmail, changePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import { User, Mail, Lock, Package, Truck, CheckCircle, Loader2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ProfileClientProps {
    user: any
    profile: any
    stats: {
        totalShipments: number
        delivered: number
        inTransit: number
    }
}

export default function ProfileClient({ user, profile, stats }: ProfileClientProps) {
    const [isPending, startTransition] = useTransition()
    
    // Profile form
    const [fullName, setFullName] = useState(profile?.full_name || '')
    
    // Email form
    const [newEmail, setNewEmail] = useState('')
    
    // Password form
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            const result = await updateProfile({ fullName })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Profile updated successfully!')
            }
        })
    }

    const handleUpdateEmail = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail) {
            toast.error('Please enter a new email')
            return
        }
        startTransition(async () => {
            const result = await updateEmail(newEmail)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.message)
                setNewEmail('')
            }
        })
    }

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        startTransition(async () => {
            const result = await changePassword(currentPassword, newPassword)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Password changed successfully!')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            }
        })
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-slate-500 hover:text-primary transition-colors mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-secondary">My Profile</h1>
                    <p className="text-slate-500">Manage your account settings and preferences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Overview */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* User Card */}
                        <Card className="glass border-0 shadow-lg">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-10 h-10 text-primary" />
                                    </div>
                                    <h2 className="text-xl font-bold text-secondary">{profile?.full_name || 'User'}</h2>
                                    <p className="text-slate-500 text-sm">{user.email}</p>
                                    <Badge className="mt-2" variant="secondary">
                                        {profile?.role === 'admin' ? 'Administrator' : 'Customer'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Card */}
                        <Card className="glass border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg text-secondary">Shipment Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Package className="text-slate-500" size={20} />
                                        <span className="text-slate-600">Total Shipments</span>
                                    </div>
                                    <span className="font-bold text-secondary">{stats.totalShipments}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Truck className="text-blue-500" size={20} />
                                        <span className="text-slate-600">In Transit</span>
                                    </div>
                                    <span className="font-bold text-blue-600">{stats.inTransit}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="text-green-500" size={20} />
                                        <span className="text-slate-600">Delivered</span>
                                    </div>
                                    <span className="font-bold text-green-600">{stats.delivered}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Settings Forms */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Update Profile */}
                        <Card className="glass border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-secondary">
                                    <User size={20} className="text-primary" />
                                    Profile Information
                                </CardTitle>
                                <CardDescription>Update your personal information</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleUpdateProfile}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                            className="bg-white/50"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>

                        {/* Update Email */}
                        <Card className="glass border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-secondary">
                                    <Mail size={20} className="text-primary" />
                                    Email Address
                                </CardTitle>
                                <CardDescription>
                                    Current: <span className="font-medium">{user.email}</span>
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleUpdateEmail}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newEmail">New Email Address</Label>
                                        <Input
                                            id="newEmail"
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="newemail@example.com"
                                            className="bg-white/50"
                                        />
                                        <p className="text-xs text-slate-500">You'll need to verify your new email address</p>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={isPending} variant="outline">
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                        Update Email
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>

                        {/* Change Password */}
                        <Card className="glass border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-secondary">
                                    <Lock size={20} className="text-primary" />
                                    Change Password
                                </CardTitle>
                                <CardDescription>Update your password to keep your account secure</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleChangePassword}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="bg-white/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="bg-white/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="bg-white/50"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={isPending} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                        Change Password
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}

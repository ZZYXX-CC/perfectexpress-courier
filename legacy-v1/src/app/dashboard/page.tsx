import { getUserShipments, getUserProfile, getUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
    const user = await getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Run queries in parallel for faster loading
    const [profile, shipments] = await Promise.all([
        getUserProfile(),
        getUserShipments()
    ])

    if (profile?.role === 'admin') {
        redirect('/admin')
    }

    return <DashboardClient user={user} profile={profile} shipments={shipments} />
}

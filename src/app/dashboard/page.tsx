
import { getUserShipments, getUserProfile } from '@/app/actions/auth'
import { getUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { isAdmin } from '@/app/actions/auth'

export default async function DashboardPage() {
    const user = await getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const profile = await getUserProfile()

    if (profile?.role === 'admin') {
        redirect('/admin')
    }

    const shipments = await getUserShipments()

    return <DashboardClient user={user} profile={profile} shipments={shipments} />
}

import { getUser, getUserProfile, getUserShipments } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
    const user = await getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const profile = await getUserProfile()
    const shipments = await getUserShipments()

    // Calculate stats
    const stats = {
        totalShipments: shipments.length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
        inTransit: shipments.filter(s => ['in-transit', 'out-for-delivery'].includes(s.status || '')).length,
    }

    return <ProfileClient user={user} profile={profile} stats={stats} />
}

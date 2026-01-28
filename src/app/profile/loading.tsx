import { CardSkeleton, StatsSkeleton } from '@/components/PageLoader'
import Navbar from '@/components/layout/Navbar'

export default function ProfileLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-white">
            <Navbar />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
                <div className="mb-8">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
                </div>

                {/* Stats Skeleton */}
                <div className="mb-8">
                    <StatsSkeleton count={3} />
                </div>

                {/* Form Cards Skeleton */}
                <div className="space-y-6">
                    <CardSkeleton count={3} />
                </div>
            </main>
        </div>
    )
}

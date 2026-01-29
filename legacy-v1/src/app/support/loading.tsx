import { CardSkeleton } from '@/components/PageLoader'
import Navbar from '@/components/layout/Navbar'

export default function SupportLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-white">
            <Navbar />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
                <div className="mb-8">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
                </div>

                {/* Form Skeleton */}
                <div className="rounded-xl border border-slate-100 p-6 mb-8 animate-pulse">
                    <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
                    <div className="space-y-4">
                        <div className="h-10 bg-slate-100 rounded" />
                        <div className="h-24 bg-slate-100 rounded" />
                        <div className="h-10 w-32 bg-slate-200 rounded" />
                    </div>
                </div>

                {/* Tickets List Skeleton */}
                <CardSkeleton count={3} />
            </main>
        </div>
    )
}

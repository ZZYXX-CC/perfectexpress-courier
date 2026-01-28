import { StatsSkeleton, TableSkeleton } from '@/components/PageLoader'
import Navbar from '@/components/layout/Navbar'

export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-white">
            <Navbar />
            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
                    ))}
                </div>

                {/* Stats Skeleton */}
                <div className="mb-8">
                    <StatsSkeleton count={6} />
                </div>

                {/* Table Skeleton */}
                <TableSkeleton rows={8} columns={6} />
            </main>
        </div>
    )
}

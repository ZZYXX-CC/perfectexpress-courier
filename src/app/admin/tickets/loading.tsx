import { TableSkeleton } from '@/components/PageLoader'
import Navbar from '@/components/layout/Navbar'

export default function AdminTicketsLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-white">
            <Navbar />
            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="mb-8">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
                </div>

                {/* Filters Skeleton */}
                <div className="flex gap-4 mb-6 animate-pulse">
                    <div className="h-10 w-48 bg-slate-100 rounded" />
                    <div className="h-10 w-32 bg-slate-100 rounded" />
                    <div className="h-10 w-32 bg-slate-100 rounded" />
                </div>

                {/* Table Skeleton */}
                <TableSkeleton rows={8} columns={5} />
            </main>
        </div>
    )
}

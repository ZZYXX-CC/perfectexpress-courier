'use client'

import { Loader2 } from 'lucide-react'

interface PageLoaderProps {
    text?: string
    fullScreen?: boolean
}

/**
 * Reusable page loading component with spinner and optional text
 */
export default function PageLoader({ text = 'Loading...', fullScreen = false }: PageLoaderProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-slate-600 font-medium animate-pulse">{text}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-slate-500 text-sm">{text}</p>
            </div>
        </div>
    )
}

/**
 * Shimmer skeleton loader for cards
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-6 space-y-4 animate-pulse">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="h-5 w-32 bg-slate-200 rounded" />
                            <div className="h-4 w-48 bg-slate-100 rounded" />
                        </div>
                        <div className="h-6 w-20 bg-slate-200 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-slate-100 rounded" />
                        <div className="h-4 w-3/4 bg-slate-100 rounded" />
                    </div>
                </div>
            ))}
        </div>
    )
}

/**
 * Shimmer skeleton loader for tables
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="rounded-xl border border-slate-100 overflow-hidden animate-pulse">
            {/* Header */}
            <div className="bg-slate-50 p-4 flex gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="p-4 flex gap-4 border-t border-slate-100">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div key={colIndex} className="h-4 bg-slate-100 rounded flex-1" />
                    ))}
                </div>
            ))}
        </div>
    )
}

/**
 * Shimmer skeleton for stat cards
 */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-8 w-8 bg-slate-200 rounded-lg" />
                        <div className="h-6 w-12 bg-slate-100 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-slate-100 rounded mt-2" />
                </div>
            ))}
        </div>
    )
}

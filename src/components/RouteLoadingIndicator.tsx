'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Global route loading indicator that shows during page transitions
 * Displays a top progress bar and optional spinner overlay
 */
export default function RouteLoadingIndicator() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Start loading animation
        setIsLoading(true)
        setProgress(30)

        const timer1 = setTimeout(() => setProgress(60), 100)
        const timer2 = setTimeout(() => setProgress(80), 200)
        const timer3 = setTimeout(() => {
            setProgress(100)
            setTimeout(() => {
                setIsLoading(false)
                setProgress(0)
            }, 200)
        }, 300)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
        }
    }, [pathname, searchParams])

    if (!isLoading && progress === 0) return null

    return (
        <>
            {/* Top progress bar */}
            <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
                <div
                    className="h-full bg-gradient-to-r from-primary via-primary to-orange-400 transition-all duration-300 ease-out shadow-lg shadow-primary/50"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Optional: Full page shimmer overlay for longer loads */}
            {isLoading && progress < 100 && (
                <div className="fixed inset-0 z-[9998] pointer-events-none">
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] animate-pulse" />
                </div>
            )}
        </>
    )
}

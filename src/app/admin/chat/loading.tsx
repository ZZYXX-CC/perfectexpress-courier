import Navbar from '@/components/layout/Navbar'

export default function AdminChatLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-white">
            <Navbar />
            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="mb-8">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sessions List Skeleton */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xl border border-slate-100 p-4 animate-pulse">
                            <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="p-3 rounded-lg bg-slate-50">
                                        <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                                        <div className="h-3 w-32 bg-slate-100 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chat Window Skeleton */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border border-slate-100 h-[600px] animate-pulse">
                            <div className="h-16 border-b border-slate-100 p-4">
                                <div className="h-5 w-32 bg-slate-200 rounded" />
                            </div>
                            <div className="p-4 space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                                        <div className={`h-12 w-48 rounded-lg ${i % 2 === 0 ? 'bg-primary/20' : 'bg-slate-100'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

import { getShipment } from '@/app/actions/get-shipment'
import TrackingClient from '@/components/TrackingClient'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function TrackingPage({
    params,
}: {
    params: Promise<{ tracking_number: string }>
}) {
    const { tracking_number } = await params
    const shipment = await getShipment(tracking_number)

    if (!shipment) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <div className="flex-1 container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">Shipment Not Found</h1>
                    <p className="text-slate-500 mb-8">We couldn't find any shipment with tracking number: <span className="font-mono font-bold text-primary">{tracking_number}</span></p>
                    <Link href="/">
                        <Button>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-30" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl opacity-30" />
            </div>

            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
                <Link href="/" className="inline-flex items-center text-slate-500 hover:text-primary transition-colors mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Search
                </Link>

                <TrackingClient initialShipment={shipment} />
            </main>
        </div>
    )
}

import { getShipment } from '@/app/actions/get-shipment'
import TrackingTimeline from '@/components/TrackingTimeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { ArrowLeft, Box } from 'lucide-react'

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
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-slate-500 hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Search
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-secondary mb-2">
                                Tracking <span className="text-primary">{shipment.tracking_number}</span>
                            </h1>
                            <p className="text-slate-500">
                                Global Express Shipment
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-lg py-1 px-4 border-primary text-primary bg-primary/5 uppercase">
                                {shipment.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Timeline */}
                    <div className="lg:col-span-2 space-y-8">
                        <TrackingTimeline history={shipment.history as any[]} currentStatus={shipment.status || ''} />
                    </div>

                    {/* Sidebar Details */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Parcel Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Box className="text-primary mt-1" size={20} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Description</p>
                                        <p className="text-slate-500">{(shipment.parcel_details as any)?.description || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="font-bold text-primary w-5 text-center text-sm mt-1">KG</div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Weight</p>
                                        <p className="text-slate-500">{(shipment.parcel_details as any)?.weight || 'N/A'} kg</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Address Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 relative">
                                <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-slate-100" />

                                <div className="relative pl-8">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">From</p>
                                    <p className="font-medium text-secondary">{(shipment.sender_info as any)?.name}</p>
                                    <p className="text-sm text-slate-500">{(shipment.sender_info as any)?.address}</p>
                                </div>

                                <div className="relative pl-8">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center">
                                        <MapPin className="w-3 h-3 text-primary" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">To</p>
                                    <p className="font-medium text-secondary">{(shipment.receiver_info as any)?.name}</p>
                                    <p className="text-sm text-slate-500">{(shipment.receiver_info as any)?.address}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}

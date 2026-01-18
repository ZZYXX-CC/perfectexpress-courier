import { getUserShipments, getUserProfile } from '@/app/actions/auth'
import { getUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Package, Truck, CheckCircle, Clock, Plus, Eye } from 'lucide-react'

export default async function DashboardPage() {
    const user = await getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const profile = await getUserProfile()
    const shipments = await getUserShipments()

    const stats = {
        total: shipments.length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
        active: shipments.filter(s => ['in-transit', 'out-for-delivery', 'pending'].includes(s.status || '')).length,
    }

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'delivered': return 'border-green-500 text-green-600 bg-green-50'
            case 'in-transit': return 'border-blue-500 text-blue-600 bg-blue-50'
            case 'out-for-delivery': return 'border-yellow-500 text-yellow-600 bg-yellow-50'
            case 'held': return 'border-red-500 text-red-600 bg-red-50'
            default: return 'border-slate-500 text-slate-600 bg-slate-50'
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">
                            Welcome, {profile?.full_name || user.email}
                        </h1>
                        <p className="text-slate-500">Manage and track your shipments</p>
                    </div>
                    <Link href="/ship">
                        <Button className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" />
                            New Shipment
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Total Shipments</CardTitle>
                            <Package className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-secondary">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Active</CardTitle>
                            <Truck className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Delivered</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">{stats.delivered}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Shipments Table */}
                <Card className="glass border-0 shadow-lg overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                        <CardTitle className="text-secondary">Your Shipments</CardTitle>
                        <CardDescription className="text-slate-500">
                            {shipments.length === 0 ? 'No shipments yet' : `${shipments.length} shipment(s)`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {shipments.length === 0 ? (
                            <div className="py-20 text-center">
                                <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 mb-4">You haven't created any shipments yet</p>
                                <Link href="/ship">
                                    <Button>Create Your First Shipment</Button>
                                </Link>
                            </div>
                        ) : (
                            <ScrollArea className="h-[400px]">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-100">
                                            <TableHead className="text-slate-500 font-semibold">Tracking ID</TableHead>
                                            <TableHead className="text-slate-500 font-semibold">Recipient</TableHead>
                                            <TableHead className="text-slate-500 font-semibold">Status</TableHead>
                                            <TableHead className="text-slate-500 font-semibold">Date</TableHead>
                                            <TableHead className="text-right text-slate-500 font-semibold">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shipments.map((shipment: any) => (
                                            <TableRow key={shipment.id} className="border-slate-100 hover:bg-slate-50/50">
                                                <TableCell className="font-mono font-bold text-primary">
                                                    {shipment.tracking_number}
                                                </TableCell>
                                                <TableCell className="text-secondary">
                                                    {shipment.receiver_info?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`uppercase font-medium ${getStatusColor(shipment.status)}`}>
                                                        {shipment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500">
                                                    {shipment.created_at ? new Date(shipment.created_at).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/track/${shipment.tracking_number}`}>
                                                        <Button variant="outline" size="sm" className="border-slate-200">
                                                            <Eye size={14} className="mr-1" />
                                                            Track
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

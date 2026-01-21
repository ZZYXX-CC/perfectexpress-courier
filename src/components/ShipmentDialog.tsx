'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import ShipmentForm from './ShipmentForm'

export default function ShipmentDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full md:w-auto bg-primary text-white hover:bg-orange-600">
                    <Package className="mr-2 h-5 w-5" />
                    Ship Now
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass border-0">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-secondary">Create New Shipment</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a shipment request. Our team will review the details and confirm the price.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <ShipmentForm onSuccess={() => setOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
    )
}

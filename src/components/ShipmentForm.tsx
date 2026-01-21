'use client'

import { useState } from 'react'
import { useTransition } from 'react'
import { createShipment, ShipmentFormData } from '@/app/actions/shipment' // Validate path availability
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Package } from 'lucide-react'

export default function ShipmentForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isPending, startTransition] = useTransition()

    // Basic form state - could use react-hook-form for more complex validation
    const [formData, setFormData] = useState<ShipmentFormData>({
        sender_name: '',
        sender_email: '',
        sender_address: '',
        receiver_name: '',
        receiver_email: '',
        receiver_address: '',
        parcel_description: '',
        parcel_weight: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Simple validation
        if (!formData.sender_name || !formData.receiver_name || !formData.parcel_weight) {
            toast.error('Please fill in all required fields')
            return
        }

        startTransition(async () => {
            const result = await createShipment(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Shipment created! Tracking ID: ${result.tracking_number}`)
                if (onSuccess) {
                    onSuccess()
                }
                // Reset form
                setFormData({
                    sender_name: '',
                    sender_email: '',
                    sender_address: '',
                    receiver_name: '',
                    receiver_email: '',
                    receiver_address: '',
                    parcel_description: '',
                    parcel_weight: '',
                })
            }
        })
    }

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-xl border-slate-100 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl text-secondary">
                    <Package className="text-primary" />
                    Create New Shipment
                </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sender Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Sender Details</h3>
                        <div className="space-y-2">
                            <Label htmlFor="sender_name">Full Name</Label>
                            <Input id="sender_name" name="sender_name" placeholder="John Doe" value={formData.sender_name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sender_email">Email</Label>
                            <Input id="sender_email" name="sender_email" type="email" placeholder="john@example.com" value={formData.sender_email} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sender_address">Address</Label>
                            <Input id="sender_address" name="sender_address" placeholder="123 Main St, City" value={formData.sender_address} onChange={handleChange} required />
                        </div>
                    </div>

                    {/* Receiver Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Receiver Details</h3>
                        <div className="space-y-2">
                            <Label htmlFor="receiver_name">Full Name</Label>
                            <Input id="receiver_name" name="receiver_name" placeholder="Jane Smith" value={formData.receiver_name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="receiver_email">Email</Label>
                            <Input id="receiver_email" name="receiver_email" type="email" placeholder="jane@example.com" value={formData.receiver_email} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="receiver_address">Address</Label>
                            <Input id="receiver_address" name="receiver_address" placeholder="456 Market St, City" value={formData.receiver_address} onChange={handleChange} required />
                        </div>
                    </div>

                    {/* Parcel Info */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Parcel Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="parcel_weight">Weight (kg)</Label>
                                <Input id="parcel_weight" name="parcel_weight" placeholder="e.g. 5.2" value={formData.parcel_weight} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parcel_description">Content Description</Label>
                                <Input id="parcel_description" name="parcel_description" placeholder="e.g. Documents, Electronics" value={formData.parcel_description} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={isPending} className="w-full md:w-auto">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Create Shipment'
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

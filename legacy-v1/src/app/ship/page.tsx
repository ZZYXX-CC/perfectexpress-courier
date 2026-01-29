'use client'

import { useState, useTransition } from 'react'
import Navbar from '@/components/layout/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Package, User, Scale, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createShipment, ShipmentFormData } from '@/app/actions/shipment'

// Steps configuration
const STEPS = [
    { id: 1, title: 'Parties', icon: User },
    { id: 2, title: 'Parcel', icon: Scale },
    { id: 3, title: 'Review', icon: Check },
]

export default function ShipmentPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState({
        senderName: '',
        senderEmail: '',
        senderAddress: '',
        receiverName: '',
        receiverEmail: '',
        receiverAddress: '',
        weight: '',
        height: '',
        width: '',
        length: '',
        description: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3))
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

    const handleSubmit = () => {
        // Validate required fields
        if (!formData.senderName || !formData.receiverName || !formData.weight) {
            toast.error('Please fill in all required fields')
            return
        }

        startTransition(async () => {
            const shipmentData: ShipmentFormData = {
                sender_name: formData.senderName,
                sender_email: formData.senderEmail,
                sender_address: formData.senderAddress,
                receiver_name: formData.receiverName,
                receiver_email: formData.receiverEmail,
                receiver_address: formData.receiverAddress,
                parcel_description: formData.description,
                parcel_weight: formData.weight,
            }

            const result = await createShipment(shipmentData)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Shipment Created Successfully!', {
                    description: `Tracking ID: ${result.tracking_number}`,
                })
                // Redirect to tracking page
                setTimeout(() => {
                    router.push(`/track/${result.tracking_number}`)
                }, 1500)
            }
        })
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 relative overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-30" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl opacity-30" />
            </div>

            <Navbar />

            <main className="container mx-auto px-4 pt-32 max-w-3xl">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-3xl font-bold mb-2 text-secondary">Create New Shipment</h1>
                    <p className="text-slate-500">Fill in the details below to schedule a seamless pickup.</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-12 relative max-w-xl mx-auto sm:mx-0">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10" />
                    {STEPS.map((step) => {
                        const isActive = step.id === currentStep
                        const isCompleted = step.id < currentStep

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2 z-10">
                                <div className={`
                   h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm
                   ${isActive ? 'border-primary bg-primary text-white scale-110 shadow-primary/25' :
                                        isCompleted ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-400'}
                 `}>
                                    <step.icon className="h-5 w-5" />
                                </div>
                                <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                                    {step.title}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Form Content */}
                <Card className="glass border-0 shadow-2xl overflow-hidden">
                    <CardContent className="p-6 sm:p-10">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3 text-secondary font-semibold border-b border-slate-100 pb-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">A</div>
                                                Sender Details
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="senderName">Full Name *</Label>
                                                <Input id="senderName" name="senderName" placeholder="John Doe" value={formData.senderName} onChange={handleChange} className="bg-white/50" required />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="senderEmail">Email</Label>
                                                <Input id="senderEmail" name="senderEmail" type="email" placeholder="john@example.com" value={formData.senderEmail} onChange={handleChange} className="bg-white/50" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="senderAddress">Address</Label>
                                                <Input id="senderAddress" name="senderAddress" placeholder="123 Sender St, NYC" value={formData.senderAddress} onChange={handleChange} className="bg-white/50" />
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3 text-secondary font-semibold border-b border-slate-100 pb-2">
                                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 text-sm">B</div>
                                                Receiver Details
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="receiverName">Full Name *</Label>
                                                <Input id="receiverName" name="receiverName" placeholder="Jane Smith" value={formData.receiverName} onChange={handleChange} className="bg-white/50" required />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="receiverEmail">Email</Label>
                                                <Input id="receiverEmail" name="receiverEmail" type="email" placeholder="jane@example.com" value={formData.receiverEmail} onChange={handleChange} className="bg-white/50" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="receiverAddress">Address</Label>
                                                <Input id="receiverAddress" name="receiverAddress" placeholder="456 Receiver Ave, LA" value={formData.receiverAddress} onChange={handleChange} className="bg-white/50" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 font-semibold text-secondary text-lg border-b border-slate-100 pb-2">
                                            <Package className="h-5 w-5 text-primary" />
                                            Parcel Information
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="weight">Weight (kg) *</Label>
                                                <Input id="weight" name="weight" type="number" placeholder="0.0" value={formData.weight} onChange={handleChange} className="bg-white/50" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="length">Length (cm)</Label>
                                                <Input id="length" name="length" type="number" placeholder="0" value={formData.length} onChange={handleChange} className="bg-white/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="width">Width (cm)</Label>
                                                <Input id="width" name="width" type="number" placeholder="0" value={formData.width} onChange={handleChange} className="bg-white/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="height">Height (cm)</Label>
                                                <Input id="height" name="height" type="number" placeholder="0" value={formData.height} onChange={handleChange} className="bg-white/50" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description of Contents</Label>
                                            <Input id="description" name="description" placeholder="Electronics, Clothes, etc." value={formData.description} onChange={handleChange} className="bg-white/50" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4 text-center">
                                        <div className="h-16 w-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center text-green-600 mb-4 ring-8 ring-green-500/5">
                                            <Check className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-secondary">Ready to Ship?</h3>
                                        <p className="text-slate-500 max-w-md mx-auto">
                                            Please review the details below. Once submitted, you will receive a tracking ID to monitor your package.
                                        </p>
                                    </div>

                                    <div className="bg-slate-50/50 rounded-xl p-6 space-y-4 text-sm border border-slate-200">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                            <span className="text-slate-500">From</span>
                                            <span className="font-medium text-secondary">{formData.senderName || 'Not specified'}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                            <span className="text-slate-500">To</span>
                                            <span className="font-medium text-secondary">{formData.receiverName || 'Not specified'}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                            <span className="text-slate-500">Package</span>
                                            <span className="font-medium text-secondary">
                                                {formData.weight}kg
                                                {formData.length && formData.width && formData.height &&
                                                    ` (${formData.length}x${formData.width}x${formData.height}cm)`
                                                }
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                            <span className="text-slate-500">Contents</span>
                                            <span className="font-medium text-secondary">{formData.description || 'Not specified'}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>

                    <CardFooter className="flex justify-between p-6 sm:p-10 pt-0 bg-transparent">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 1 || isPending}
                            className="text-slate-500 hover:text-secondary hover:bg-slate-100"
                        >
                            Back
                        </Button>

                        {currentStep < 3 ? (
                            <Button onClick={nextStep} className="bg-primary hover:bg-primary/90 text-white rounded-full px-8">
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending}
                                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 rounded-full px-8"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Shipment'
                                )}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </main>
        </div>
    )
}

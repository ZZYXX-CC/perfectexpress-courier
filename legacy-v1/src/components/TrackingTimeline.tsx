'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, MapPin, Truck, Clock, Package } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type HistoryEvent = {
    status: string
    location: string
    timestamp: string
    note?: string
}

interface TrackingTimelineProps {
    history: HistoryEvent[]
    currentStatus: string
}

export default function TrackingTimeline({ history }: TrackingTimelineProps) {
    // Sort history by timestamp descending (newest first)
    const sortedHistory = [...history].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return Package
            case 'out-for-delivery': return Truck
            case 'in-transit': return MapPin
            default: return Clock
        }
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {sortedHistory.map((item, index) => {
                    const isLatest = index === 0
                    const Icon = getStatusIcon(item.status)

                    return (
                        <motion.div
                            key={`${item.timestamp}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex items-center md:justify-between md:odd:flex-row-reverse group is-active"
                        >
                            {/* Icon Marker */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-slate-200 group-[.is-active]:bg-primary group-[.is-active]:text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-0 translate-x-0 z-10 transition-colors">
                                {isLatest ? (
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                ) : (
                                    <Circle className="w-4 h-4 text-slate-500 fill-slate-500" />
                                )}
                            </div>

                            {/* Content Card */}
                            <Card className={cn(
                                "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 ml-4 md:ml-0 shadow-md glass border-0",
                                isLatest && "border-primary/50 ring-1 ring-primary/20 bg-primary/5"
                            )}>
                                <CardHeader className="p-0 mb-2">
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-xs font-bold uppercase tracking-wider py-1 px-2 rounded-full",
                                            isLatest ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {item.status.replace('-', ' ')}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <p className="font-medium text-secondary flex items-center gap-2">
                                        <MapPin size={16} className="text-primary" />
                                        {item.location}
                                    </p>
                                    {item.note && (
                                        <p className="text-sm text-slate-500 mt-1">{item.note}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

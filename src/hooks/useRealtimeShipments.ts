'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Generic shipment type for realtime updates - uses Record for flexibility
type RealtimeShipment = Record<string, unknown> & {
    id: string
    tracking_number: string | null
    status: string | null
    current_location?: string | null
}

type RealtimeOptions<T = RealtimeShipment> = {
    onInsert?: (shipment: T) => void
    onUpdate?: (shipment: T) => void
    onDelete?: (oldShipment: T) => void
    showToasts?: boolean
    filter?: {
        column: string
        value: string
    }
}

/**
 * Hook for subscribing to real-time shipment updates via Supabase
 * @param options Configuration options for the subscription
 */
export function useRealtimeShipments<T extends RealtimeShipment = RealtimeShipment>(options: RealtimeOptions<T> = {}) {
    const { onInsert, onUpdate, onDelete, showToasts = true, filter } = options
    const supabase = createClient()

    const handleChanges = useCallback((payload: RealtimePostgresChangesPayload<RealtimeShipment>) => {
        const { eventType, new: newRecord, old: oldRecord } = payload

        switch (eventType) {
            case 'INSERT':
                if (newRecord && onInsert) {
                    onInsert(newRecord as T)
                    if (showToasts) {
                        toast.success('New shipment created', {
                            description: `Tracking: ${(newRecord as RealtimeShipment).tracking_number}`,
                        })
                    }
                }
                break

            case 'UPDATE':
                if (newRecord && onUpdate) {
                    onUpdate(newRecord as T)
                    if (showToasts) {
                        const shipment = newRecord as RealtimeShipment
                        toast.info('Shipment updated', {
                            description: `${shipment.tracking_number} - ${shipment.status}`,
                        })
                    }
                }
                break

            case 'DELETE':
                if (oldRecord && onDelete) {
                    onDelete(oldRecord as T)
                    if (showToasts) {
                        toast.warning('Shipment removed')
                    }
                }
                break
        }
    }, [onInsert, onUpdate, onDelete, showToasts])

    useEffect(() => {
        // Build the channel configuration
        const baseConfig = {
            event: '*' as const,
            schema: 'public' as const,
            table: 'shipments' as const,
        }

        // Add filter if provided (e.g., for user-specific shipments)
        const channelConfig = filter 
            ? { ...baseConfig, filter: `${filter.column}=eq.${filter.value}` }
            : baseConfig

        const channel = supabase
            .channel('shipments-realtime')
            .on(
                'postgres_changes',
                channelConfig,
                handleChanges
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Realtime subscription active for shipments')
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, handleChanges, filter])
}

/**
 * Hook for subscribing to a specific shipment by tracking number
 */
export function useRealtimeShipment<T extends RealtimeShipment = RealtimeShipment>(
    trackingNumber: string, 
    onUpdate: (shipment: T) => void
) {
    const supabase = createClient()

    useEffect(() => {
        if (!trackingNumber) return

        const channel = supabase
            .channel(`shipment-${trackingNumber}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'shipments',
                    filter: `tracking_number=eq.${trackingNumber}`,
                },
                (payload) => {
                    if (payload.new) {
                        onUpdate(payload.new as T)
                        toast.info('Shipment status updated!', {
                            description: `Status: ${(payload.new as RealtimeShipment).status}`,
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, trackingNumber, onUpdate])
}

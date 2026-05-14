-- Align the database status constraint with the shipment flow used by the Vite app.
-- Run this in Supabase SQL Editor if the deployed DB rejects statuses like "held".

ALTER TABLE IF EXISTS public.shipments
DROP CONSTRAINT IF EXISTS shipment_status_check;

UPDATE public.shipments
SET status = CASE
    WHEN status = 'accepted' THEN 'confirmed'
    WHEN status IN (
        'pending',
        'quoted',
        'confirmed',
        'in-transit',
        'out-for-delivery',
        'held',
        'cancelled',
        'delivered'
    ) THEN status
    ELSE 'pending'
END
WHERE status IS NULL
   OR status NOT IN (
        'pending',
        'quoted',
        'confirmed',
        'in-transit',
        'out-for-delivery',
        'held',
        'cancelled',
        'delivered'
   );

ALTER TABLE IF EXISTS public.shipments
ADD CONSTRAINT shipment_status_check
CHECK (
    status IN (
        'pending',
        'quoted',
        'confirmed',
        'in-transit',
        'out-for-delivery',
        'held',
        'cancelled',
        'delivered'
    )
);

import { Shipment, ShipmentEvent } from '../types';

export const TRACKING_PREFIX = 'PFX';

export const generateTrackingNumber = (): string => {
    const number = Math.floor(10000000 + Math.random() * 90000000);
    return `${TRACKING_PREFIX}-${number}`;
};

const normalizeAddress = (address?: string): string[] => {
    if (!address) return [];
    return address
        .replace(/\n+/g, ',')
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
};

const extractCityCountry = (address?: string): { city: string; country: string } => {
    const parts = normalizeAddress(address);
    if (parts.length === 0) return { city: '', country: '' };
    if (parts.length === 1) return { city: parts[0], country: '' };
    const country = parts[parts.length - 1];
    const city = parts[parts.length - 2];
    return { city, country };
};

const formatTimestamp = (timestamp?: string): { date: string; time: string } => {
    if (!timestamp) return { date: '', time: '' };
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return { date: '', time: '' };
    return {
        date: parsed.toLocaleDateString(),
        time: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
};

const formatStatusLabel = (status?: string): string => {
    if (!status) return 'Shipment update';
    return status.replace(/-/g, ' ');
};

export const mapShipmentHistory = (history?: unknown): ShipmentEvent[] => {
    if (!Array.isArray(history)) return [];
    return history.map((event: any) => {
        const status = event?.status ?? event?.state ?? '';
        const { date, time } = formatTimestamp(event?.timestamp);
        const resolvedDate = event?.date || date || '';
        const resolvedTime = event?.time || time || '';
        const location = event?.location || event?.city || event?.place || 'Unknown';
        const description =
            event?.description ||
            event?.note ||
            (status ? `Status updated to ${formatStatusLabel(status)}` : 'Shipment update');

        return {
            date: resolvedDate,
            time: resolvedTime,
            location,
            description,
            status,
            timestamp: event?.timestamp,
            note: event?.note
        };
    });
};

const formatWeight = (value?: string | number): string => {
    if (value === null || value === undefined) return '0 kg';
    const raw = String(value).trim();
    if (!raw) return '0 kg';
    if (/[a-zA-Z]/.test(raw)) return raw;
    return `${raw} kg`;
};

export const mapShipmentRow = (data: any): Shipment => {
    const senderInfo = data?.sender_info || {};
    const receiverInfo = data?.receiver_info || {};
    const parcelDetails = data?.parcel_details || {};

    const senderAddress = senderInfo.address || '';
    const receiverAddress = receiverInfo.address || '';

    const senderParts = extractCityCountry(senderAddress);
    const receiverParts = extractCityCountry(receiverAddress);

    const senderCity = senderInfo.city || senderParts.city;
    const senderCountry = senderInfo.country || senderParts.country;
    const receiverCity = receiverInfo.city || receiverParts.city;
    const receiverCountry = receiverInfo.country || receiverParts.country;

    const originFallback = [senderCity, senderCountry].filter(Boolean).join(', ');
    const destinationFallback = [receiverCity, receiverCountry].filter(Boolean).join(', ');

    const rawPrice = data?.price !== undefined && data?.price !== null ? Number(data.price) : undefined;
    const priceValue = Number.isFinite(rawPrice as number) ? (rawPrice as number) : undefined;

    // Parse embedded coordinates from current_location (format: "Address [@lat,lng]")
    const rawLocation = data?.current_location || 'Pending';
    const coordMatch = rawLocation.match(/\s*\[@(-?\d+\.?\d*),(-?\d+\.?\d*)\]\s*$/);
    const cleanLocation = coordMatch ? rawLocation.replace(coordMatch[0], '').trim() : rawLocation;
    const embeddedCoords = coordMatch
        ? { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) }
        : null;
    const locationDetail =
        parcelDetails.current_location_detail ||
        parcelDetails.location_detail ||
        data?.location_detail ||
        '';

    return {
        id: data?.tracking_number || data?.id,
        status: data?.status || 'pending',
        origin: senderAddress || originFallback || 'Unknown',
        destination: receiverAddress || destinationFallback || 'Unknown',
        estimatedArrival: data?.estimated_delivery ? new Date(data.estimated_delivery).toLocaleDateString() : 'TBD',
        estimatedDelivery: data?.estimated_delivery || '',
        currentLocation: cleanLocation,
        locationDetail,
        weight: formatWeight(parcelDetails.weight || data?.weight),
        dimensions: data?.dimensions || 'N/A',
        serviceType: data?.service_type || 'Standard',
        history: mapShipmentHistory(data?.history),
        items: data?.items || [
            {
                description: parcelDetails.description || 'Shipment Items',
                quantity: 1,
                value: priceValue !== undefined ? String(priceValue) : '0',
                sku: 'GENERIC'
            }
        ],
        sender: {
            name: senderInfo.name || 'Unknown',
            street: senderAddress || 'Unknown',
            city: senderCity || '',
            country: senderCountry || '',
            email: senderInfo.email || ''
        },
        recipient: {
            name: receiverInfo.name || 'Unknown',
            street: receiverAddress || 'Unknown',
            city: receiverCity || '',
            country: receiverCountry || '',
            email: receiverInfo.email || ''
        },
        price: priceValue,
        paymentStatus: data?.payment_status,
        coordinates: data?.coordinates || embeddedCoords,
        createdAt: data?.created_at
    };
};

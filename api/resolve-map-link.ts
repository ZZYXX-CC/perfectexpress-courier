import type { VercelRequest, VercelResponse } from '@vercel/node';

type Coordinates = { lat: number; lng: number };
type ResolvedLocation = {
    coordinates: Coordinates | null;
    provider?: 'direct' | 'google-geocoding' | 'google-link';
    accuracy?: string;
    formattedAddress?: string;
    error?: string;
};

const isUrl = (input: string) => /^https?:\/\//i.test(input);

const extractCoordinates = (input: string): Coordinates | null => {
    let decoded = input;
    try {
        decoded = decodeURIComponent(input);
    } catch {
        decoded = input;
    }

    const sources = [input, decoded];
    for (const source of sources) {
        const latLngPatterns = [
            /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
            /[?&](?:q|query|destination|center|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
            /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
            /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/
        ];

        for (const pattern of latLngPatterns) {
            const match = source.match(pattern);
            if (!match) continue;
            const lat = Number(match[1]);
            const lng = Number(match[2]);
            if (isValidCoordinate(lat, lng)) return { lat, lng };
        }

        const lngLatMatch = source.match(/!2d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/);
        if (lngLatMatch) {
            const lng = Number(lngLatMatch[1]);
            const lat = Number(lngLatMatch[2]);
            if (isValidCoordinate(lat, lng)) return { lat, lng };
        }
    }

    return null;
};

const isValidCoordinate = (lat: number, lng: number) =>
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const input = typeof req.body?.input === 'string'
        ? req.body.input.trim()
        : typeof req.body?.url === 'string'
            ? req.body.url.trim()
            : '';

    if (!input || input.length < 3) {
        return res.status(400).json({ error: 'A valid address or URL is required' });
    }

    const direct = extractCoordinates(input);
    if (direct) return res.status(200).json({ coordinates: direct, provider: 'direct' } satisfies ResolvedLocation);

    if (isUrl(input)) {
        try {
            const response = await fetch(input, {
                method: 'GET',
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 PerfectExpressBot/1.0 (+https://perfectexpress.co)'
                }
            });

            const finalUrlCoords = extractCoordinates(response.url);
            if (finalUrlCoords) return res.status(200).json({ coordinates: finalUrlCoords, provider: 'google-link' } satisfies ResolvedLocation);

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                const html = await response.text();
                const htmlCoords = extractCoordinates(html.slice(0, 250_000));
                if (htmlCoords) return res.status(200).json({ coordinates: htmlCoords, provider: 'google-link' } satisfies ResolvedLocation);
            }
        } catch {
            // Continue to Google Geocoding below when a URL cannot be expanded.
        }
    }

    const googleApiKey =
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_GEOCODING_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
        return res.status(200).json({
            coordinates: null,
            error: 'Google Maps geocoding is not configured'
        } satisfies ResolvedLocation);
    }

    try {
        const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        geocodeUrl.searchParams.set('address', input);
        geocodeUrl.searchParams.set('key', googleApiKey);

        const geocodeResponse = await fetch(geocodeUrl);
        const data = await geocodeResponse.json();

        if (!geocodeResponse.ok || data.status !== 'OK' || !data.results?.length) {
            return res.status(200).json({
                coordinates: null,
                provider: 'google-geocoding',
                error: data.error_message || data.status || 'No geocoding result'
            } satisfies ResolvedLocation);
        }

        const result = data.results[0];
        const location = result.geometry?.location;
        const accuracy = result.geometry?.location_type || 'UNKNOWN';
        const coords = location ? { lat: Number(location.lat), lng: Number(location.lng) } : null;

        if (!coords || !isValidCoordinate(coords.lat, coords.lng)) {
            return res.status(200).json({
                coordinates: null,
                provider: 'google-geocoding',
                accuracy,
                error: 'Invalid geocoding coordinates'
            } satisfies ResolvedLocation);
        }

        const acceptedAccuracy = new Set(['ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER']);
        if (!acceptedAccuracy.has(accuracy)) {
            return res.status(200).json({
                coordinates: null,
                provider: 'google-geocoding',
                accuracy,
                formattedAddress: result.formatted_address,
                error: 'Geocoding result is too approximate'
            } satisfies ResolvedLocation);
        }

        return res.status(200).json({
            coordinates: coords,
            provider: 'google-geocoding',
            accuracy,
            formattedAddress: result.formatted_address
        } satisfies ResolvedLocation);
    } catch (error) {
        return res.status(200).json({
            coordinates: null,
            provider: 'google-geocoding',
            error: error instanceof Error ? error.message : 'Unable to resolve location'
        } satisfies ResolvedLocation);
    }
}

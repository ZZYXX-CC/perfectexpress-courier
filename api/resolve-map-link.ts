import type { VercelRequest, VercelResponse } from '@vercel/node';

type Coordinates = { lat: number; lng: number };
type ResolvedLocation = {
    coordinates: Coordinates | null;
    provider?: 'direct' | 'google-geocoding' | 'google-link' | 'osm-nominatim';
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

const resolveWithNominatim = async (input: string): Promise<ResolvedLocation> => {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('q', input);
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('extratags', '1');

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'PerfectExpressCourier/1.0'
    };

    if (process.env.NOMINATIM_EMAIL) {
        url.searchParams.set('email', process.env.NOMINATIM_EMAIL);
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
        return {
            coordinates: null,
            provider: 'osm-nominatim',
            error: `OpenStreetMap geocoder failed (${response.status})`
        };
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
        return {
            coordinates: null,
            provider: 'osm-nominatim',
            error: 'OpenStreetMap found no matching address'
        };
    }

    const ranked = results
        .map((result: any) => ({
            result,
            importance: Number(result.importance || 0),
            lat: Number(result.lat),
            lng: Number(result.lon),
            type: String(result.type || result.addresstype || '').toLowerCase(),
            className: String(result.class || '').toLowerCase()
        }))
        .filter(item => isValidCoordinate(item.lat, item.lng))
        .sort((a, b) => b.importance - a.importance);

    const acceptableTypes = new Set([
        'house',
        'building',
        'residential',
        'road',
        'street',
        'secondary',
        'tertiary',
        'commercial',
        'industrial',
        'yes'
    ]);

    const accepted = ranked.find(item => {
        if (item.className === 'boundary' || item.type === 'administrative') return false;
        if (item.importance < 0.2) return false;
        return acceptableTypes.has(item.type) || ['highway', 'building', 'amenity', 'shop', 'office', 'place'].includes(item.className);
    });

    if (!accepted) {
        return {
            coordinates: null,
            provider: 'osm-nominatim',
            error: 'OpenStreetMap result was too broad to use as a precise pin'
        };
    }

    return {
        coordinates: { lat: accepted.lat, lng: accepted.lng },
        provider: 'osm-nominatim',
        accuracy: accepted.type || accepted.className || 'matched',
        formattedAddress: accepted.result.display_name
    };
};

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
        try {
            return res.status(200).json(await resolveWithNominatim(input));
        } catch (error) {
            return res.status(200).json({
                coordinates: null,
                provider: 'osm-nominatim',
                error: error instanceof Error ? error.message : 'OpenStreetMap geocoding failed'
            } satisfies ResolvedLocation);
        }
    }

    try {
        const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        geocodeUrl.searchParams.set('address', input);
        geocodeUrl.searchParams.set('key', googleApiKey);

        const geocodeResponse = await fetch(geocodeUrl);
        const data = await geocodeResponse.json();

        if (!geocodeResponse.ok || data.status !== 'OK' || !data.results?.length) {
            return res.status(200).json(await resolveWithNominatim(input));
        }

        const result = data.results[0];
        const location = result.geometry?.location;
        const accuracy = result.geometry?.location_type || 'UNKNOWN';
        const coords = location ? { lat: Number(location.lat), lng: Number(location.lng) } : null;

        if (!coords || !isValidCoordinate(coords.lat, coords.lng)) {
            return res.status(200).json(await resolveWithNominatim(input));
        }

        const acceptedAccuracy = new Set(['ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER']);
        if (!acceptedAccuracy.has(accuracy)) {
            return res.status(200).json(await resolveWithNominatim(input));
        }

        return res.status(200).json({
            coordinates: coords,
            provider: 'google-geocoding',
            accuracy,
            formattedAddress: result.formatted_address
        } satisfies ResolvedLocation);
    } catch (error) {
        try {
            return res.status(200).json(await resolveWithNominatim(input));
        } catch {
            return res.status(200).json({
                coordinates: null,
                provider: 'google-geocoding',
                error: error instanceof Error ? error.message : 'Unable to resolve location'
            } satisfies ResolvedLocation);
        }
    }
}

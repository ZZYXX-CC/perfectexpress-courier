import type { VercelRequest, VercelResponse } from '@vercel/node';

type Coordinates = { lat: number; lng: number };

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

    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!url || !/^https?:\/\//i.test(url)) {
        return res.status(400).json({ error: 'A valid URL is required' });
    }

    const direct = extractCoordinates(url);
    if (direct) return res.status(200).json({ coordinates: direct });

    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 PerfectExpressBot/1.0 (+https://perfectexpress.co)'
            }
        });

        const finalUrlCoords = extractCoordinates(response.url);
        if (finalUrlCoords) return res.status(200).json({ coordinates: finalUrlCoords });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            const html = await response.text();
            const htmlCoords = extractCoordinates(html.slice(0, 250_000));
            if (htmlCoords) return res.status(200).json({ coordinates: htmlCoords });
        }

        return res.status(200).json({ coordinates: null });
    } catch (error) {
        return res.status(200).json({
            coordinates: null,
            error: error instanceof Error ? error.message : 'Unable to resolve map link'
        });
    }
}

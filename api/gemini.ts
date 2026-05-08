// Vercel Serverless Function — proxies Gemini API calls server-side.
// The GEMINI_API_KEY env var is set in Vercel dashboard (NOT prefixed with VITE_).

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(200).json({
            text: "Your package is on its way and everything is looking good. We'll let you know as soon as it gets closer!"
        });
    }

    try {
        const { action, payload } = req.body;

        if (action === 'tracking-insight') {
            const { shipmentId, status } = payload;
            const prompt = `Provide a friendly shipping update for order ${shipmentId}. Current status is: ${status}. Use simple, reassuring language. Let the customer know their package is being handled with care.`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
                    })
                }
            );

            if (!response.ok) throw new Error('Gemini API error');

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Your package is on its way!';
            return res.status(200).json({ text });
        }

        if (action === 'chat') {
            const { message, history } = payload;

            const systemInstruction = 'You are the friendly Customer Support Assistant for PerfectExpress shipping. Be warm and helpful.';

            const contents = [
                ...(history || []).map((msg: { role: string; content: string }) => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                })),
                { role: 'user', parts: [{ text: message }] }
            ];

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        contents,
                        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
                    })
                }
            );

            if (!response.ok) throw new Error('Gemini API error');

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I'm having a little trouble connecting.";
            return res.status(200).json({ text });
        }

        return res.status(400).json({ error: 'Unknown action' });
    } catch {
        return res.status(200).json({
            text: "Your package is on its way and everything is looking good."
        });
    }
}

export default async function handler(_req: any, res: any) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ ok: false, error: 'Missing Supabase env vars' });
  }

  const healthUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`;

  try {
    const r = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    const text = await r.text();
    return res.status(200).json({
      ok: true,
      status: r.status,
      body: text.slice(0, 200),
      ts: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Keepalive ping failed',
      ts: new Date().toISOString(),
    });
  }
}

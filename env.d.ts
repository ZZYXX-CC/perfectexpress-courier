/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    // GEMINI_API_KEY is now server-side only (Vercel env vars, not VITE_ prefixed)
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

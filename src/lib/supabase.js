import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  document.body.innerHTML = `
    <div style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;flex-direction:column;gap:12px;padding:24px;text-align:center">
      <div style="font-size:32px">⚠️</div>
      <div style="font-size:18px;font-weight:600">Missing environment variables</div>
      <div style="font-size:13px;color:#888">VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in Vercel → Settings → Environment Variables</div>
    </div>`
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

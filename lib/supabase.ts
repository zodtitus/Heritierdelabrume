import { createClient } from '@supabase/supabase-js'

// Client server-side avec service role — ne jamais exposer côté client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

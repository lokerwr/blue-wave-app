import { createClient } from '@supabase/supabase-js'

// The anon key is safe to expose in client-side code — it only allows
// what your Row Level Security policies permit (see supabase/schema.sql).
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://pkfxhalniwzatdfjmkqz.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZnhoYWxuaXd6YXRkZmpta3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5Mjc4MDIsImV4cCI6MjEwMzUwMzgwMn0.zeQZsAqJeqnDHk30JgHSkyYEcxa0DCg_rf3CKg_nOPw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

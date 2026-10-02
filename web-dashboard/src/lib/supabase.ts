import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zoqzgirtrhpxodrutjvs.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcXpnaXJ0cmhweG9kcnV0anZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjI4MjksImV4cCI6MjEwNjUzODgyOX0.lLDg3wusxxumjEfEW2ny_60qJ8VdBwmlODwDLOxvPDc'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

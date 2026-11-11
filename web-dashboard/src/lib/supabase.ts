import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oopyelhldjyyoupetynq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcHllbGhsZGp5eW91cGV0eW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MzA0ODgsImV4cCI6MjEwOTMwNjQ4OH0.Nw2qW21GJs9MjkC_U6rcHt3uCS846K2oB8j4WkvcLdQ'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export { supabaseUrl }

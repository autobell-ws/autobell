import SecureStorage from '../utils/SecureStorage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://oopyelhldjyyoupetynq.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcHllbGhsZGp5eW91cGV0eW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MzA0ODgsImV4cCI6MjEwOTMwNjQ4OH0.Nw2qW21GJs9MjkC_U6rcHt3uCS846K2oB8j4WkvcLdQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

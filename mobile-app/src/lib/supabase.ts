import SecureStorage from '../utils/SecureStorage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zoqzgirtrhpxodrutjvs.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcXpnaXJ0cmhweG9kcnV0anZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjI4MjksImV4cCI6MjEwNjUzODgyOX0.lLDg3wusxxumjEfEW2ny_60qJ8VdBwmlODwDLOxvPDc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

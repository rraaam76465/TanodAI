import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://lywxkskwyyjtpjnvkqmk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d3hrc2t3eXlqdHBqbnZrcW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4MjQzNjEsImV4cCI6MjA1NDQwMDM2MX0.Xzlok81Vs8ZVysY96oG8Rcs_2bIy2DTsg64SckfMMCo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
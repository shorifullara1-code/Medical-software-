import { createClient } from '@supabase/supabase-js';

// Supabase Project Credentials provided for shorifullara1-code's Project
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://xgycqgklfduvxlkcyuyd.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWNxZ2tsZmR1dnhsa2N5dXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNTA0NTgsImV4cCI6MjEwNjkyNjQ1OH0.whfyPcdYZQ25DYJjpWLXe2-tipEWYoRtYOSz5pcvADE';

export const SUPABASE_PROJECT_ID = 'xgycqgklfduvxlkcyuyd';
export const SUPABASE_PROJECT_NAME = "shorifullara1-code's Project";

// Create Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Checks connection status to Supabase backend
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const { error: err1 } = await supabase.from('hospital_records').select('id').limit(1);
    if (!err1) {
      return {
        connected: true,
        message: 'Supabase Database Connected & Operational ✓ (hospital_records)',
      };
    }

    const { error: err2 } = await supabase.from('hospital_data_store').select('id').limit(1);
    if (!err2) {
      return {
        connected: true,
        message: 'Supabase Database Connected & Operational ✓ (hospital_data_store)',
      };
    }

    if (err1.code === 'PGRST301' || err1.message.includes('relation') || err1.code === '42P01') {
      return {
        connected: true,
        message: 'Connected to Supabase Project! Note: Please run the SQL script in Supabase SQL Editor if tables are missing.',
      };
    }

    return {
      connected: false,
      message: `Supabase Ping Note: ${err1.message}`,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Connection Error: ${err?.message || 'Unknown network error'}`,
    };
  }
}

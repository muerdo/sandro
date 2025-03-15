import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase.types'

const supabaseUrl = 'https://tgtxeiaisnyqjlebgcgn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndHhlaWFpc255cWpsZWJnY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTkwMDcsImV4cCI6MjA1NzAzNTAwN30.jf6TiZsuW_MF0ZD0ldiKXI8xvQQrha2XWWWOPuVEmrM'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
export async function getSupabaseAccessToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }
  
  export const edgeFunctionBaseUrl = "https://tgtxeiaisnyqjlebgcgn.functions.supabase.co/functions/v1";
  
  export async function callEdgeFunction(endpoint: string, data: any) {
    const accessToken = await getSupabaseAccessToken();
  
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
  
    const response = await fetch(`${edgeFunctionBaseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(data)
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to call edge function');
    }
  
    return response.json();
  }
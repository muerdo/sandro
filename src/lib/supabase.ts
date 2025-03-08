import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase.types'

const supabaseUrl = 'https://tgtxeiaisnyqjlebgcgn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndHhlaWFpc255cWpsZWJnY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTkwMDcsImV4cCI6MjA1NzAzNTAwN30.jf6TiZsuW_MF0ZD0ldiKXI8xvQQrha2XWWWOPuVEmrM'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
import { createClient } from '@supabase/supabase-js'

// Questi sono i tuoi "indirizzi" per parlare con il database
const supabaseUrl = 'https://vlcelarxcdpbxlbeyvqv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsY2VsYXJ4Y2RwYnhsYmV5dnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzIwNjQsImV4cCI6MjA5NTYwODA2NH0.TkHCBQmweaAIpTqDMwLAZvR2YmPA0EVtGstFdW7qvDc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
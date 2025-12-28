import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate environment variables
if (typeof window === 'undefined' && !process.env.NEXT_PHASE) {
  const missingVars: string[] = []
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
  }

  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing Supabase environment variables: ${missingVars.join(', ')}`)
    console.warn('Please check your .env.local file')
  } else {
    // Verify URL format
    if (!supabaseUrl.includes('.supabase.co')) {
      console.warn('⚠️  Supabase URL format may be incorrect. Expected: https://[project-ref].supabase.co')
    } else {
      console.log('✅ Supabase environment variables loaded')
      console.log(`   URL: ${supabaseUrl}`)
    }
  }
}

// Client for client-side operations (public)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    })
  : supabase

export default supabase


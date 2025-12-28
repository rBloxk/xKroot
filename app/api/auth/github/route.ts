import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Better error handling with specific missing variable
    if (!supabaseUrl) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Missing Supabase URL. Please restart your dev server after updating .env.local'), request.url)
      )
    }
    
    if (!supabaseAnonKey) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Missing Supabase Anon Key. Please restart your dev server after updating .env.local'), request.url)
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get the redirect URL from query params or use default
    // Use client-side callback page to handle hash-based tokens
    const { searchParams } = new URL(request.url)
    const redirectTo = searchParams.get('redirect_to') || `${request.nextUrl.origin}/auth/callback`

    // Initiate GitHub OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: redirectTo,
        scopes: 'user:email',
      },
    })

    if (error) {
      console.error('GitHub OAuth error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to initiate GitHub login' },
        { status: 400 }
      )
    }

    // Redirect to GitHub OAuth page
    if (data.url) {
      return NextResponse.redirect(data.url)
    }

    return NextResponse.json(
      { error: 'Failed to get OAuth URL' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('GitHub OAuth initiation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate GitHub login' },
      { status: 500 }
    )
  }
}


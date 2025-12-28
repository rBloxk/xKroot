import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Better error handling with specific missing variable
    if (!supabaseUrl) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Missing Supabase URL. Please check your environment variables.'), request.url)
      )
    }
    
    if (!supabaseAnonKey) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Missing Supabase Anon Key. Please check your environment variables.'), request.url)
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get the code from the query parameters
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Exchange code for session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (authError || !authData.session || !authData.user) {
      console.error('Session exchange error:', authError)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(authError?.message || 'authentication_failed')}`, request.url)
      )
    }

    // Get user profile if it exists
    let profile = null
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', authData.user.id)
        .single()
      
      profile = data
    } catch (error) {
      // Profiles table might not exist, that's okay
    }

    // Create user profile if it doesn't exist
    if (!profile && authData.user) {
      try {
        const fullName = authData.user.user_metadata?.full_name || 
                        authData.user.user_metadata?.name ||
                        authData.user.user_metadata?.preferred_username ||
                        null

        await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email || '',
            full_name: fullName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
      } catch (error) {
        // Profiles table might not exist, that's okay
        console.log('Profile creation skipped:', error)
      }
    }

    // Set session cookies
    const { access_token, refresh_token } = authData.session
    
    const response = NextResponse.redirect(new URL('/', request.url))
    
    response.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    response.cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('GitHub callback error:', error)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || 'callback_failed')}`, request.url)
    )
  }
}


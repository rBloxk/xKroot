import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase'
import { updateLastActive } from '@/lib/auth/activity'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const email = searchParams.get('email')

    // Supabase magic link uses token_hash in the URL
    if (!token || type !== 'magiclink') {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.redirect(new URL('/login?error=config_error', request.url))
    }

    // Create a client instance
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the token and get session
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email: email || undefined,
      token,
      type: 'magiclink',
    })

    if (authError || !authData.session || !authData.user) {
      console.error('Magic link verification error:', authError)
      return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
    }

    // Get or create user record in users table (preserve existing user_type)
    try {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, user_type, full_name, email')
        .eq('id', authData.user.id)
        .single()

      if (!existingUser) {
        // Create user record
        await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email || email || '',
            full_name: authData.user.user_metadata?.full_name || null,
            user_type: 'candidate', // Default, can be changed in onboarding
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          })
      } else {
        // User exists, update last_active and other fields, but preserve existing user_type
        await supabaseAdmin
          .from('users')
          .update({
            email: authData.user.email || email || existingUser.email || '',
            full_name: authData.user.user_metadata?.full_name || existingUser.full_name || null,
            updated_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
            // Note: user_type is NOT updated - it preserves the existing value
          })
          .eq('id', authData.user.id)
      }
    } catch (error) {
      console.error('Error creating/updating user record:', error)
      // Continue anyway - user might already exist
    }

    // Create/update profile if needed
    try {
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: authData.user.email || email || '',
          full_name: authData.user.user_metadata?.full_name || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        })
    } catch (error) {
      // Profiles table might not exist, that's okay
      console.log('Profile creation skipped:', error)
    }

    // Check if user needs onboarding (user_type not set)
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('user_type')
      .eq('id', authData.user.id)
      .single()

    // Only redirect to onboarding if user_type is not set (null or undefined)
    // If user_type is 'candidate' or 'company', they've already completed onboarding
    const needsOnboarding = !userData?.user_type

    // Set session cookies
    const response = NextResponse.redirect(
      new URL(needsOnboarding ? '/onboarding' : '/', request.url)
    )

    const { access_token, refresh_token } = authData.session

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
    console.error('Magic link callback error:', error)
    return NextResponse.redirect(new URL('/login?error=callback_error', request.url))
  }
}


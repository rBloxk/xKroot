import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { updateLastActive } from '@/lib/auth/activity'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, user: userData } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing tokens' },
        { status: 400 }
      )
    }

    // Get user info from the token
    let user = null
    if (userData) {
      user = userData
    } else {
      // Try to get user from token
      try {
        const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(access_token)
        user = tokenUser
      } catch (error) {
        console.log('Could not get user from token:', error)
      }
    }

    // Create/update user record in users table (preserve existing user_type)
    if (user) {
      try {
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('user_type, full_name')
          .eq('id', user.id)
          .single()

        if (!existingUser) {
          // User doesn't exist, create with default type
          await supabaseAdmin
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || 
                        user.user_metadata?.name ||
                        user.user_metadata?.preferred_username ||
                        null,
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
              email: user.email || existingUser.email || '',
              full_name: user.user_metadata?.full_name || 
                        user.user_metadata?.name ||
                        user.user_metadata?.preferred_username ||
                        existingUser.full_name || null,
              updated_at: new Date().toISOString(),
              last_active: new Date().toISOString(),
            })
            .eq('id', user.id)
        }
      } catch (error) {
        console.log('User record update skipped:', error)
      }
    }

    const response = NextResponse.json({ success: true })

    // Set session cookies
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
    console.error('Set session error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set session' },
      { status: 500 }
    )
  }
}

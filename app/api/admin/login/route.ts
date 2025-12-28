import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { username, password, email } = await request.json()

    // Support both username and email login
    let adminEmail = email

    // If username is provided, look up the email
    if (username && !email) {
      const { data: admin } = await supabaseAdmin
        .from('admins')
        .select('email')
        .eq('username', username)
        .single()

      if (!admin) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }
      adminEmail = admin.email
    }

    if (!adminEmail || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    // Sign in using Supabase Auth
    // Create a new client instance for this request to handle auth properly
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: adminEmail,
      password: password,
    })

    if (authError || !authData.session || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify the user is an admin
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('username, email')
      .eq('id', authData.user.id)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 403 }
      )
    }

    const response = NextResponse.json({
      message: 'Login successful',
      admin: {
        id: authData.user.id,
        username: admin.username,
        email: admin.email,
      },
    })

    // Set session cookies
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}

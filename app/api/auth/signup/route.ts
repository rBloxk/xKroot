import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, user_type } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate user_type if provided
    const validTypes = ['candidate', 'company']
    const userType = user_type && validTypes.includes(user_type) ? user_type : 'candidate'

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Create a new client instance for this request
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Sign up the user
    const { data: authData, error: authError } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    })

    if (authError) {
      // Handle specific Supabase errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: authError.message || 'Sign up failed' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user record in users table with user_type
    try {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email || email,
          full_name: fullName || null,
          user_type: userType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (userError && !userError.message.includes('does not exist')) {
        console.error('User creation error:', userError)
        // Don't fail if users table doesn't exist yet, but log it
      }
    } catch (error) {
      // Users table might not exist, that's okay
      console.log('Users table not found, skipping user creation')
    }

    // Create user profile in profiles table (if it exists)
    // This is optional - Supabase Auth already stores the user
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email || email,
          full_name: fullName || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      // Don't fail if profiles table doesn't exist yet
      if (profileError && !profileError.message.includes('does not exist')) {
        console.error('Profile creation error:', profileError)
      }
    } catch (error) {
      // Profiles table might not exist, that's okay
      console.log('Profiles table not found, skipping profile creation')
    }

    // If email confirmation is required, return a message
    if (!authData.session) {
      return NextResponse.json({
        message: 'Sign up successful! Please check your email to confirm your account.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        requiresConfirmation: true,
      })
    }

    // If session is available (email confirmation disabled), set cookies
    const response = NextResponse.json({
      message: 'Sign up successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
      },
    })

    if (authData.session) {
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
    }

    return response
  } catch (error: any) {
    console.error('Sign up error:', error)
    return NextResponse.json(
      { error: error.message || 'Sign up failed' },
      { status: 500 }
    )
  }
}


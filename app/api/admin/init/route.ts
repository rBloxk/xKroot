import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Initialize admin user (run once to create first admin)
// Creates a Supabase Auth user and links it to the admins table
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { 
          error: 'Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file' 
        },
        { status: 500 }
      )
    }

    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if admin already exists in database
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('*')
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle()

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email for admin users
      user_metadata: {
        username: username,
        role: 'admin',
      },
    })

    if (authError || !authData.user) {
      console.error('Supabase Auth error:', authError)
      return NextResponse.json(
        { 
          error: authError?.message || 'Failed to create auth user',
          details: authError?.status ? `Status: ${authError.status}` : undefined
        },
        { status: 500 }
      )
    }

    // Create admin record in admins table linked to auth user
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .insert([
        {
          id: authData.user.id, // Use the auth user ID
          username,
          email,
          // No password field needed - handled by Supabase Auth
        },
      ])
      .select()
      .single()

    if (adminError) {
      console.error('Database insert error:', adminError)
      // If admin record creation fails, try to clean up the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      
      // Provide more specific error message
      let errorMsg = adminError.message || 'Failed to create admin record'
      if (adminError.code === '23505') {
        errorMsg = 'Admin with this username or email already exists'
      } else if (adminError.code === '23503') {
        errorMsg = 'Foreign key constraint failed. Make sure the admins table schema is correct.'
      } else if (adminError.details) {
        errorMsg = `${errorMsg}: ${adminError.details}`
      }
      
      return NextResponse.json(
        { error: errorMsg, code: adminError.code },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Admin user created successfully',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    })
  } catch (error: any) {
    console.error('Admin init error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create admin user'
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.code) {
      errorMessage = `Database error: ${error.code} - ${error.message || error.details || 'Unknown error'}`
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    // Check if it's a Supabase connection error
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
      errorMessage = 'Cannot connect to Supabase. Please check your environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

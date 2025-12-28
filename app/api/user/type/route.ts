import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { user_type } = await request.json()

    // Validate user_type
    const validTypes = ['candidate', 'company', 'admin']
    if (!user_type || !validTypes.includes(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user_type. Must be one of: candidate, company, admin' },
        { status: 400 }
      )
    }

    // Check if user already has a user_type set
    let { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // If user doesn't exist in users table, create it
    if (fetchError && (fetchError.code === 'PGRST116' || fetchError.message?.includes('No rows') || fetchError.message?.includes('not found'))) {
      // User not found, create the user record with default type
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.full_name || null,
          user_type: 'candidate', // Default type
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('user_type')
        .single()

      if (createError) {
        console.error('Error creating user record:', createError)
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        )
      }

      existingUser = newUser
      fetchError = null
    }

    if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // If user_type is already set and not the default 'candidate', prevent change
    // (Allow change if it's still the default 'candidate' from initial creation)
    if (existingUser?.user_type && existingUser.user_type !== 'candidate') {
      return NextResponse.json(
        { error: 'User type cannot be changed once set' },
        { status: 400 }
      )
    }

    // Special check for admin - only allow if user is already an admin in admins table
    if (user_type === 'admin') {
      const { data: adminCheck } = await supabaseAdmin
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminCheck) {
        return NextResponse.json(
          { error: 'Admin access denied. You must be an admin to select this role.' },
          { status: 403 }
        )
      }
    }

    // Update user_type
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        user_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user_type:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user type' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user_type,
      message: `User type set to ${user_type}`,
    })
  } catch (error: any) {
    console.error('User type update error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch current user type
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let { data, error } = await supabaseAdmin
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // If user doesn't exist in users table, create it
    if (error && (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found'))) {
      // User not found, create the user record
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.full_name || null,
          user_type: 'candidate', // Default type
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('user_type')
        .single()

      if (createError) {
        console.error('Error creating user record:', createError)
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        user_type: newUser?.user_type || 'candidate',
      })
    }

    if (error) {
      console.error('Error fetching user type:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user type' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user_type: data?.user_type || null,
    })
  } catch (error: any) {
    console.error('Get user type error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


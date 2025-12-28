import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    // Fetch user_type from database
    let userType = null
    try {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()
      
      if (userData) {
        userType = userData.user_type
      }
    } catch (error) {
      // User might not exist in users table yet, that's okay
      console.log('User type fetch skipped:', error)
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: userType,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message || 'Verification failed' },
      { status: 401 }
    )
  }
}


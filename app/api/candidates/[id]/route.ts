import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET - Get a specific candidate profile (for companies)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get candidate profile
    const { data: candidateProfile, error: profileError } = await supabaseAdmin
      .from('candidate_profile')
      .select('*')
      .eq('id', params.id)
      .single()

    if (profileError || !candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      )
    }

    // Get user information
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .eq('id', candidateProfile.user_id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User information not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      candidate: {
        ...candidateProfile,
        users: userData,
      },
    })
  } catch (error: any) {
    console.error('Get candidate error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


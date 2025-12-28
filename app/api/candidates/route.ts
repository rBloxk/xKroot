import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET - Get list of available candidates (for companies)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const availabilityStatus = searchParams.get('availability_status')
    const location = searchParams.get('location')
    const workType = searchParams.get('work_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for available candidates
    // First get candidate profiles
    let query = supabaseAdmin
      .from('candidate_profile')
      .select(`
        id,
        bio,
        location,
        current_position,
        years_experience,
        education_level,
        availability_status,
        preferred_work_type,
        preferred_location,
        linkedin_url,
        github_url,
        portfolio_url,
        profile_completeness,
        avatar_url,
        user_id
      `)
      .in('availability_status', ['available', 'open'])
      .order('profile_completeness', { ascending: false })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by availability status
    if (availabilityStatus && ['available', 'open'].includes(availabilityStatus)) {
      query = query.eq('availability_status', availabilityStatus)
    }

    // Filter by location
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    // Filter by preferred work type
    if (workType) {
      query = query.eq('preferred_work_type', workType)
    }

    const { data: candidates, error } = await query

    if (error) {
      console.error('Error fetching candidates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch candidates' },
        { status: 500 }
      )
    }

    // Get user information for each candidate
    const candidatesWithUsers = await Promise.all(
      (candidates || []).map(async (candidate: any) => {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email')
          .eq('id', candidate.user_id)
          .single()

        return {
          ...candidate,
          users: userData || { id: candidate.user_id, full_name: null, email: '' },
        }
      })
    )

    return NextResponse.json({
      candidates: candidatesWithUsers || [],
      count: candidatesWithUsers?.length || 0,
    })
  } catch (error: any) {
    console.error('Get candidates error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


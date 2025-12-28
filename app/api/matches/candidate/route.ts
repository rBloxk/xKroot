import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Get all matches for a candidate
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
    const candidateId = searchParams.get('candidate_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const minScore = parseFloat(searchParams.get('min_score') || '0')

    // If candidate_id not provided, get from user's profile
    let finalCandidateId = candidateId

    if (!finalCandidateId) {
      const { data: candidateProfile } = await supabaseAdmin
        .from('candidate_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!candidateProfile) {
        return NextResponse.json(
          { error: 'Candidate profile not found' },
          { status: 404 }
        )
      }

      finalCandidateId = candidateProfile.id
    } else {
      // Verify ownership
      const { data: candidateProfile } = await supabaseAdmin
        .from('candidate_profile')
        .select('user_id')
        .eq('id', finalCandidateId)
        .single()

      if (!candidateProfile || candidateProfile.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }

    // Fetch matches
    const { data: matches, error } = await supabaseAdmin
      .from('match_result')
      .select(`
        *,
        role_requirement!inner(
          id,
          role_title,
          role_level,
          department,
          work_type,
          location,
          salary_min,
          salary_max,
          company_profile!inner(
            id,
            company_name,
            company_size,
            industry,
            startup_stage
          )
        ),
        match_factor(*)
      `)
      .eq('candidate_id', finalCandidateId)
      .gte('match_score', minScore)
      .order('match_score', { ascending: false })
      .range(offset, offset + limit - 1)

    // Fetch consensus results for matches (if available)
    // Look for consensus results with task_id matching match reasoning patterns
    if (matches && matches.length > 0) {
      const matchIds = matches.map(m => m.id)
      // Try to find consensus results related to these matches
      // For now, we'll enhance matches with confidence info from match_confidence
      // In future, we can link consensus results via task_id
    }

    if (error) {
      console.error('Error fetching matches:', error)
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      matches: matches || [],
      count: matches?.length || 0,
    })
  } catch (error: any) {
    console.error('Get candidate matches error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Get all matches for a company/job
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
    const jobId = searchParams.get('job_id')
    const companyId = searchParams.get('company_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const minScore = parseFloat(searchParams.get('min_score') || '0')

    if (!jobId && !companyId) {
      return NextResponse.json(
        { error: 'Either job_id or company_id is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('match_result')
      .select(`
        *,
        candidate_profile!inner(
          id,
          bio,
          location,
          current_position,
          years_experience,
          availability_status
        ),
        match_factor(*)
      `)
      .gte('match_score', minScore)
      .order('match_score', { ascending: false })
      .range(offset, offset + limit - 1)

    if (jobId) {
      // Verify job ownership
      const { data: job } = await supabaseAdmin
        .from('role_requirement')
        .select(`
          *,
          company_profile!inner(user_id)
        `)
        .eq('id', jobId)
        .single()

      if (!job || job.company_profile.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      query = query.eq('role_requirement_id', jobId)
    } else if (companyId) {
      // Verify company ownership
      const { data: company } = await supabaseAdmin
        .from('company_profile')
        .select('user_id')
        .eq('id', companyId)
        .single()

      if (!company || company.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      query = query.eq('company_id', companyId)
    }

    const { data: matches, error } = await query

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
    console.error('Get company matches error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


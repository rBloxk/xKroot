import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Get a specific match
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

    const { data: match, error } = await supabaseAdmin
      .from('match_result')
      .select(`
        *,
        candidate_profile!inner(user_id),
        role_requirement!inner(
          *,
          company_profile!inner(user_id)
        ),
        match_factor(*)
      `)
      .eq('id', params.id)
      .single()

    if (error || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Verify ownership (either candidate or company)
    const isCandidateOwner = match.candidate_profile.user_id === user.id
    const isCompanyOwner = match.role_requirement.company_profile.user_id === user.id

    if (!isCandidateOwner && !isCompanyOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ match })
  } catch (error: any) {
    console.error('Get match error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// PATCH - Update match status
export async function PATCH(
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

    const body = await request.json()
    const { match_status } = body

    // Get match and verify ownership
    const { data: match, error: fetchError } = await supabaseAdmin
      .from('match_result')
      .select(`
        *,
        candidate_profile!inner(user_id),
        role_requirement!inner(
          *,
          company_profile!inner(user_id)
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const isCandidateOwner = match.candidate_profile.user_id === user.id
    const isCompanyOwner = match.role_requirement.company_profile.user_id === user.id

    if (!isCandidateOwner && !isCompanyOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Validate status
    if (match_status) {
      const validStatuses = ['pending', 'presented', 'viewed', 'interested', 'applied', 'rejected', 'hired']
      if (!validStatuses.includes(match_status)) {
        return NextResponse.json(
          { error: 'Invalid match status' },
          { status: 400 }
        )
      }
    }

    // Update match
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (match_status !== undefined) {
      updateData.match_status = match_status
    }

    const { data: updatedMatch, error: updateError } = await supabaseAdmin
      .from('match_result')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating match:', updateError)
      return NextResponse.json(
        { error: 'Failed to update match' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: 'Match updated successfully',
    })
  } catch (error: any) {
    console.error('Update match error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


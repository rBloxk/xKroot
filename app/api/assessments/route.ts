import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST - Create a new assessment for a candidate
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { candidate_id, assessment_type, assessment_data } = body

    if (!candidate_id || !assessment_type || !assessment_data) {
      return NextResponse.json(
        { error: 'candidate_id, assessment_type, and assessment_data are required' },
        { status: 400 }
      )
    }

    // Verify candidate ownership
    const { data: candidateProfile, error: profileError } = await supabaseAdmin
      .from('candidate_profile')
      .select('user_id')
      .eq('id', candidate_id)
      .single()

    if (profileError || !candidateProfile || candidateProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Validate assessment_type
    const validTypes = ['technical', 'cultural_fit', 'communication', 'problem_solving', 'leadership']
    if (!validTypes.includes(assessment_type)) {
      return NextResponse.json(
        { error: 'Invalid assessment type' },
        { status: 400 }
      )
    }

    // Process assessment_data with scoring logic
    const { calculateAIAssessmentScore } = await import('@/lib/assessments/scoring')
    const answers = assessment_data?.answers || []
    
    // Calculate score using scoring logic
    const scoreResult = await calculateAIAssessmentScore(assessment_type as any, answers)
    
    const score = scoreResult.score
    const scoreBreakdown = scoreResult.scoreBreakdown
    const strengths = scoreResult.strengths
    const areasForImprovement = scoreResult.areasForImprovement
    const recommendations = scoreResult.recommendations

    // Create assessment
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from('candidate_assessment')
      .insert({
        candidate_id,
        assessment_type,
        assessment_data,
        score,
        score_breakdown: scoreBreakdown,
        strengths,
        areas_for_improvement: areasForImprovement,
        recommendations,
        ai_model_version: 'v1-deterministic', // Will be 'v2-mmi' when Phase 4 is complete
        assessment_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (assessmentError) {
      console.error('Error creating assessment:', assessmentError)
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assessment,
      message: 'Assessment created successfully',
    })
  } catch (error: any) {
    console.error('Create assessment error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get assessments for a candidate
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
    const candidateId = searchParams.get('candidate_id')
    const assessmentType = searchParams.get('assessment_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Build query
    let query = supabaseAdmin
      .from('candidate_assessment')
      .select('*')
      .eq('candidate_id', finalCandidateId)
      .order('assessment_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType)
    }

    const { data: assessments, error } = await query

    if (error) {
      console.error('Error fetching assessments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      assessments: assessments || [],
      count: assessments?.length || 0,
    })
  } catch (error: any) {
    console.error('Get assessments error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


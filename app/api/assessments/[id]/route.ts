import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET - Get a specific assessment by ID
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

    const assessmentId = params.id

    // Get assessment
    const { data: assessment, error } = await supabaseAdmin
      .from('candidate_assessment')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (error) {
      console.error('Error fetching assessment:', error)
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const { data: candidateProfile } = await supabaseAdmin
      .from('candidate_profile')
      .select('user_id')
      .eq('id', assessment.candidate_id)
      .single()

    if (!candidateProfile || candidateProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      assessment,
    })
  } catch (error: any) {
    console.error('Get assessment error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


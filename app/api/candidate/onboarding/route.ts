import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET endpoint to fetch all onboarding answers
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: candidateProfile } = await supabaseAdmin
      .from('candidate_profile')
      .select('onboarding_answers')
      .eq('user_id', user.id)
      .single()

    if (!candidateProfile) {
      return NextResponse.json({
        answers: null,
        completed: false,
      })
    }

    return NextResponse.json({
      answers: candidateProfile.onboarding_answers || {},
      completed: !!candidateProfile.onboarding_answers,
    })
  } catch (error: any) {
    console.error('Get onboarding error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


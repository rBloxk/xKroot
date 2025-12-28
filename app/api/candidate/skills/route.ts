import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - List all skills for a candidate
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

    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidate_id is required' },
        { status: 400 }
      )
    }

    // Verify the candidate profile belongs to the user
    const { data: candidateProfile } = await supabaseAdmin
      .from('candidate_profile')
      .select('id, user_id')
      .eq('id', candidateId)
      .single()

    if (!candidateProfile || candidateProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Fetch skills
    const { data: skills, error } = await supabaseAdmin
      .from('candidate_skill')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching skills:', error)
      return NextResponse.json(
        { error: 'Failed to fetch skills' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      skills: skills || [],
    })
  } catch (error: any) {
    console.error('Get skills error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// POST - Create a new skill
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
    const {
      candidate_id,
      skill_name,
      skill_category,
      proficiency_level,
      years_experience,
      source,
    } = body

    if (!candidate_id || !skill_name) {
      return NextResponse.json(
        { error: 'candidate_id and skill_name are required' },
        { status: 400 }
      )
    }

    // Verify the candidate profile belongs to the user
    const { data: candidateProfile } = await supabaseAdmin
      .from('candidate_profile')
      .select('id, user_id')
      .eq('id', candidate_id)
      .single()

    if (!candidateProfile || candidateProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Validate proficiency_level
    const validProficiency = ['beginner', 'intermediate', 'advanced', 'expert']
    if (proficiency_level && !validProficiency.includes(proficiency_level)) {
      return NextResponse.json(
        { error: 'Invalid proficiency level' },
        { status: 400 }
      )
    }

    // Validate source
    const validSources = ['self_reported', 'assessment', 'endorsement', 'ai_inferred']
    if (source && !validSources.includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source' },
        { status: 400 }
      )
    }

    // Check for duplicate skill
    const { data: existingSkill } = await supabaseAdmin
      .from('candidate_skill')
      .select('id')
      .eq('candidate_id', candidate_id)
      .ilike('skill_name', skill_name)
      .single()

    if (existingSkill) {
      return NextResponse.json(
        { error: 'Skill already exists' },
        { status: 409 }
      )
    }

    // Create skill
    const { data: skill, error: insertError } = await supabaseAdmin
      .from('candidate_skill')
      .insert({
        candidate_id,
        skill_name,
        skill_category: skill_category || null,
        proficiency_level: proficiency_level || 'intermediate',
        years_experience: years_experience ? parseFloat(years_experience) : null,
        source: source || 'self_reported',
        verified: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating skill:', insertError)
      return NextResponse.json(
        { error: 'Failed to create skill' },
        { status: 500 }
      )
    }

    // Trigger automatic re-run of matches (fire and forget)
    setTimeout(async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/auto-rerun`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_id,
            trigger_type: 'skill_added',
          }),
        })
      } catch (err) {
        console.error('Failed to trigger auto-rerun matches:', err)
      }
    }, 0)

    return NextResponse.json({
      success: true,
      skill,
      message: 'Skill added successfully',
    })
  } catch (error: any) {
    console.error('Create skill error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


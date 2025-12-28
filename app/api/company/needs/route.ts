import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - List all company needs
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
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    // Verify the company profile belongs to the user
    const { data: companyProfile } = await supabaseAdmin
      .from('company_profile')
      .select('id, user_id')
      .eq('id', companyId)
      .single()

    if (!companyProfile || companyProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Fetch company needs
    const { data: needs, error } = await supabaseAdmin
      .from('company_need')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching company needs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch company needs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      needs: needs || [],
    })
  } catch (error: any) {
    console.error('Get company needs error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// POST - Create a new company need
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
      company_id,
      need_type,
      priority_level,
      description,
      required_skills,
      preferred_skills,
      nice_to_have_skills,
      urgency_score,
      budget_range_min,
      budget_range_max,
      timeline,
      status,
    } = body

    if (!company_id || !need_type || !description) {
      return NextResponse.json(
        { error: 'company_id, need_type, and description are required' },
        { status: 400 }
      )
    }

    // Verify the company profile belongs to the user
    const { data: companyProfile } = await supabaseAdmin
      .from('company_profile')
      .select('id, user_id')
      .eq('id', company_id)
      .single()

    if (!companyProfile || companyProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Validate priority_level
    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (priority_level && !validPriorities.includes(priority_level)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['active', 'fulfilled', 'cancelled', 'on_hold']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Validate urgency_score
    if (urgency_score !== undefined) {
      const urgency = parseInt(urgency_score)
      if (isNaN(urgency) || urgency < 0 || urgency > 100) {
        return NextResponse.json(
          { error: 'Urgency score must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    // Parse array fields
    const requiredSkillsArray = Array.isArray(required_skills)
      ? required_skills
      : required_skills
        ? required_skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
    
    const preferredSkillsArray = Array.isArray(preferred_skills)
      ? preferred_skills
      : preferred_skills
        ? preferred_skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
    
    const niceToHaveSkillsArray = Array.isArray(nice_to_have_skills)
      ? nice_to_have_skills
      : nice_to_have_skills
        ? nice_to_have_skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []

    // Create company need
    const { data: need, error: insertError } = await supabaseAdmin
      .from('company_need')
      .insert({
        company_id,
        need_type,
        priority_level: priority_level || 'medium',
        description,
        required_skills: requiredSkillsArray,
        preferred_skills: preferredSkillsArray,
        nice_to_have_skills: niceToHaveSkillsArray,
        urgency_score: urgency_score ? parseInt(urgency_score) : 50,
        budget_range_min: budget_range_min ? parseFloat(budget_range_min) : null,
        budget_range_max: budget_range_max ? parseFloat(budget_range_max) : null,
        timeline: timeline || null,
        status: status || 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating company need:', insertError)
      return NextResponse.json(
        { error: 'Failed to create company need' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      need,
      message: 'Company need created successfully',
    })
  } catch (error: any) {
    console.error('Create company need error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


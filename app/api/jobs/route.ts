import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - List all jobs (public or filtered by company)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const status = searchParams.get('status') || 'open'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('role_requirement')
      .select(`
        *,
        company_profile!inner(
          id,
          company_name,
          company_size,
          industry,
          location,
          startup_stage,
          logo_url
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // If company_id provided, filter by company (requires auth)
    if (companyId) {
      const user = await verifyUserAuth(request)
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Verify company ownership
      const { data: companyProfile } = await supabaseAdmin
        .from('company_profile')
        .select('user_id')
        .eq('id', companyId)
        .single()

      if (!companyProfile || companyProfile.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      query = query.eq('company_id', companyId)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      jobs: jobs || [],
      count: jobs?.length || 0,
    })
  } catch (error: any) {
    console.error('Get jobs error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// POST - Create a new job posting
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
      company_need_id,
      role_title,
      role_level,
      department,
      job_description,
      required_skills,
      preferred_qualifications,
      responsibilities,
      work_type,
      location,
      salary_min,
      salary_max,
      equity_offered,
      benefits,
      application_deadline,
    } = body

    if (!company_id || !role_title || !job_description) {
      return NextResponse.json(
        { error: 'company_id, role_title, and job_description are required' },
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

    // Validate role_level
    const validLevels = ['intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive']
    if (role_level && !validLevels.includes(role_level)) {
      return NextResponse.json(
        { error: 'Invalid role level' },
        { status: 400 }
      )
    }

    // Validate work_type
    const validWorkTypes = ['remote', 'hybrid', 'onsite', 'flexible']
    if (work_type && !validWorkTypes.includes(work_type)) {
      return NextResponse.json(
        { error: 'Invalid work type' },
        { status: 400 }
      )
    }

    // Parse required_skills (should be JSONB)
    let requiredSkillsJson = null
    if (required_skills) {
      try {
        requiredSkillsJson = typeof required_skills === 'string'
          ? JSON.parse(required_skills)
          : required_skills
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid required_skills JSON format' },
          { status: 400 }
        )
      }
    } else {
      requiredSkillsJson = {} // Default empty object
    }

    // Parse array fields
    const preferredQualificationsArray = Array.isArray(preferred_qualifications)
      ? preferred_qualifications
      : preferred_qualifications
        ? preferred_qualifications.split(',').map((q: string) => q.trim()).filter(Boolean)
        : []
    
    const responsibilitiesArray = Array.isArray(responsibilities)
      ? responsibilities
      : responsibilities
        ? responsibilities.split('\n').map((r: string) => r.trim()).filter(Boolean)
        : []
    
    const benefitsArray = Array.isArray(benefits)
      ? benefits
      : benefits
        ? benefits.split(',').map((b: string) => b.trim()).filter(Boolean)
        : []

    // Create job posting
    const { data: job, error: insertError } = await supabaseAdmin
      .from('role_requirement')
      .insert({
        company_id,
        company_need_id: company_need_id || null,
        role_title,
        role_level: role_level || null,
        department: department || null,
        job_description,
        required_skills: requiredSkillsJson,
        preferred_qualifications: preferredQualificationsArray,
        responsibilities: responsibilitiesArray,
        work_type: work_type || null,
        location: location || null,
        salary_min: salary_min ? parseFloat(salary_min) : null,
        salary_max: salary_max ? parseFloat(salary_max) : null,
        equity_offered: equity_offered || false,
        benefits: benefitsArray,
        application_deadline: application_deadline || null,
        status: 'open',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating job:', insertError)
      return NextResponse.json(
        { error: 'Failed to create job posting' },
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
            job_id: job.id,
            trigger_type: 'job_created',
          }),
        })
      } catch (err) {
        console.error('Failed to trigger auto-rerun matches:', err)
      }
    }, 0)

    return NextResponse.json({
      success: true,
      job,
      message: 'Job posting created successfully',
    })
  } catch (error: any) {
    console.error('Create job error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


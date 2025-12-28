import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET - Get all saved jobs for a candidate
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

    // Get candidate profile
    const { data: candidateProfile, error: profileError } = await supabaseAdmin
      .from('candidate_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      )
    }

    // Get saved jobs
    const { data: savedJobs, error } = await supabaseAdmin
      .from('saved_job')
      .select(`
        id,
        saved_at,
        role_requirement(
          id,
          role_title,
          role_level,
          department,
          work_type,
          location,
          salary_min,
          salary_max,
          job_description,
          status,
          application_deadline,
          created_at,
          company_id,
          company_profile(
            id,
            company_name,
            company_size,
            industry,
            location,
            logo_url
          )
        )
      `)
      .eq('candidate_id', candidateProfile.id)
      .order('saved_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved jobs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch saved jobs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      savedJobs: savedJobs || [],
      count: savedJobs?.length || 0,
    })
  } catch (error: any) {
    console.error('Get saved jobs error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST - Save a job for a candidate
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
    const { job_id } = body

    if (!job_id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get candidate profile
    const { data: candidateProfile, error: profileError } = await supabaseAdmin
      .from('candidate_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      )
    }

    // Verify job exists
    const { data: job, error: jobError } = await supabaseAdmin
      .from('role_requirement')
      .select('id')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if already saved
    const { data: existingSavedJob } = await supabaseAdmin
      .from('saved_job')
      .select('id')
      .eq('candidate_id', candidateProfile.id)
      .eq('role_requirement_id', job_id)
      .single()

    if (existingSavedJob) {
      return NextResponse.json(
        { error: 'Job is already saved' },
        { status: 400 }
      )
    }

    // Save the job
    const { data: savedJob, error: saveError } = await supabaseAdmin
      .from('saved_job')
      .insert({
        candidate_id: candidateProfile.id,
        role_requirement_id: job_id,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving job:', saveError)
      return NextResponse.json(
        { error: 'Failed to save job' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      savedJob,
      message: 'Job saved successfully',
    })
  } catch (error: any) {
    console.error('Save job error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a saved job
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const job_id = searchParams.get('job_id')

    if (!job_id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get candidate profile
    const { data: candidateProfile, error: profileError } = await supabaseAdmin
      .from('candidate_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      )
    }

    // Delete the saved job
    const { error: deleteError } = await supabaseAdmin
      .from('saved_job')
      .delete()
      .eq('candidate_id', candidateProfile.id)
      .eq('role_requirement_id', job_id)

    if (deleteError) {
      console.error('Error deleting saved job:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove saved job' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Job removed from saved jobs',
    })
  } catch (error: any) {
    console.error('Delete saved job error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


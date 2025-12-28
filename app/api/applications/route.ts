import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyApplicationReceived } from '@/lib/notifications/createNotification'

export const dynamic = 'force-dynamic'

/**
 * POST - Create a new job application
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
    const { job_id, cover_letter, resume_url, portfolio_url } = body

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
        { error: 'Candidate profile not found. Please complete your profile first.' },
        { status: 404 }
      )
    }

    // Verify job exists and is open
    const { data: job, error: jobError } = await supabaseAdmin
      .from('role_requirement')
      .select('id, status, application_deadline')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'open') {
      return NextResponse.json(
        { error: 'This job is not currently accepting applications' },
        { status: 400 }
      )
    }

    // Check application deadline
    if (job.application_deadline) {
      const deadline = new Date(job.application_deadline)
      const now = new Date()
      if (now > deadline) {
        return NextResponse.json(
          { error: 'Application deadline has passed' },
          { status: 400 }
        )
      }
    }

    // Check if already applied
    const { data: existingApplication } = await supabaseAdmin
      .from('application')
      .select('id')
      .eq('candidate_id', candidateProfile.id)
      .eq('role_requirement_id', job_id)
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      )
    }

    // Create application
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('application')
      .insert({
        candidate_id: candidateProfile.id,
        role_requirement_id: job_id,
        cover_letter: cover_letter || null,
        resume_url: resume_url || null,
        portfolio_url: portfolio_url || null,
        application_status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Error creating application:', applicationError)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    // Update match status if match exists
    await supabaseAdmin
      .from('match_result')
      .update({ match_status: 'applied' })
      .eq('candidate_id', candidateProfile.id)
      .eq('role_requirement_id', job_id)

    // Send notification to company
    const { data: jobData } = await supabaseAdmin
      .from('role_requirement')
      .select(`
        role_title,
        company_profile!inner(user_id, company_name)
      `)
      .eq('id', job_id)
      .single()

    if (jobData && jobData.company_profile) {
      const candidateName = user.full_name || user.email
      await notifyApplicationReceived(
        jobData.company_profile.user_id,
        candidateName,
        jobData.role_title,
        application.id
      )
    }

    return NextResponse.json({
      success: true,
      application,
      message: 'Application submitted successfully',
    })
  } catch (error: any) {
    console.error('Create application error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get applications (for candidate or company)
 */
export async function GET(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:161',message:'GET applications entry',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  try {
    const user = await verifyUserAuth(request)
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:163',message:'User auth result',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!user) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:165',message:'No user, returning 401',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidate_id')
    const jobId = searchParams.get('job_id')
    const companyId = searchParams.get('company_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:178',message:'Query params extracted',data:{jobId,candidateId,companyId,status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // First, check if candidate profile exists (for candidates)
    let candidateProfileId: string | null = null
    
    if (candidateId) {
      // Verify candidate ownership
      const { data: candidateProfileCheck } = await supabaseAdmin
        .from('candidate_profile')
        .select('id, user_id')
        .eq('id', candidateId)
        .single()

      if (!candidateProfileCheck || candidateProfileCheck.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
      candidateProfileId = candidateId
    } else {
      // Check if user is a candidate
      const { data: candidateProfile } = await supabaseAdmin
        .from('candidate_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (candidateProfile) {
        candidateProfileId = candidateProfile.id
      }
    }

    // Build query - use regular joins, not !inner, to handle missing table gracefully
    let query = supabaseAdmin
      .from('application')
      .select(`
        *,
        candidate_profile(
          id,
          user_id,
          bio,
          location,
          current_position,
          years_experience
        ),
        role_requirement(
          id,
          role_title,
          role_level,
          department,
          work_type,
          location,
          company_id,
          company_profile(
            id,
            user_id,
            company_name
          )
        )
      `)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by candidate (candidate viewing their own applications)
    if (candidateProfileId) {
      query = query.eq('candidate_id', candidateProfileId)
    } else if (!jobId && !companyId) {
      // If user is not a candidate and not filtering by job/company, return empty
      return NextResponse.json({
        applications: [],
        count: 0,
      })
    }

    // Filter by job (company viewing applications for a job)
    if (jobId) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:268',message:'Fetching job for ownership verification',data:{jobId,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      // First, try without .single() to see what we get
      const { data: jobs, error: jobListError } = await supabaseAdmin
        .from('role_requirement')
        .select('id, company_id')
        .eq('id', jobId)

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:275',message:'Job query result (without single)',data:{jobCount:jobs?.length,hasError:!!jobListError,errorMessage:jobListError?.message,jobs:jobs},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (jobListError) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:279',message:'Job query error',data:{jobError:jobListError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('Error fetching job:', jobListError)
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }

      if (!jobs || jobs.length === 0) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:287',message:'Job not found (0 results)',data:{jobId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }

      if (jobs.length > 1) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:294',message:'Multiple jobs found with same ID',data:{jobId,jobCount:jobs.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('Multiple jobs found with same ID:', jobId)
        return NextResponse.json(
          { error: 'Database error: Multiple jobs with same ID' },
          { status: 500 }
        )
      }

      const job = jobs[0]

      // Now verify company ownership separately
      const { data: companyProfile, error: companyError } = await supabaseAdmin
        .from('company_profile')
        .select('user_id')
        .eq('id', job.company_id)
        .single()

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:275',message:'Company profile query result',data:{hasCompanyProfile:!!companyProfile,hasError:!!companyError,companyUserId:companyProfile?.user_id,currentUserId:user.id,matches:companyProfile?.user_id===user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (companyError || !companyProfile || companyProfile.user_id !== user.id) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:278',message:'Unauthorized access, returning 403',data:{jobId,userId:user.id,companyUserId:companyProfile?.user_id,hasCompanyProfile:!!companyProfile,companyError:companyError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('Unauthorized access attempt:', {
          jobId,
          userId: user.id,
          companyUserId: companyProfile?.user_id,
          companyError: companyError?.message,
        })
        return NextResponse.json(
          { error: 'Unauthorized - You do not have permission to view applications for this job' },
          { status: 403 }
        )
      }

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/applications/route.ts:290',message:'Job ownership verified, proceeding',data:{jobId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      query = query.eq('role_requirement_id', jobId)
    }

    // Filter by company (company viewing all applications)
    if (companyId) {
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

      // Get all role_requirement IDs for this company
      const { data: jobs } = await supabaseAdmin
        .from('role_requirement')
        .select('id')
        .eq('company_id', companyId)

      if (jobs && jobs.length > 0) {
        const jobIds = jobs.map(job => job.id)
        query = query.in('role_requirement_id', jobIds)
      } else {
        // No jobs for this company, return empty result
        return NextResponse.json({
          applications: [],
          count: 0,
        })
      }
    }

    // Filter by status
    if (status) {
      query = query.eq('application_status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Check if it's a table not found error
      if (error.message && (error.message.includes('schema cache') || error.message.includes('relation') || error.message.includes('does not exist'))) {
        return NextResponse.json(
          { 
            error: 'Application table not found. Please run the database migration: supabase/migrations/add_application_table.sql',
            details: error.message,
            migration_file: 'supabase/migrations/add_application_table.sql'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to fetch applications: ${error.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      applications: applications || [],
      count: applications?.length || 0,
    })
  } catch (error: any) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


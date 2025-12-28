import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Get a specific job (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: job, error } = await supabaseAdmin
      .from('role_requirement')
      .select(`
        *,
        company_profile!inner(
          id,
          company_name,
          company_size,
          industry,
          description,
          website_url,
          location,
          startup_stage,
          company_culture
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Only return if job is open (public access)
    if (job.status !== 'open') {
      // Check if user owns the company
      const user = await verifyUserAuth(request)
      if (user) {
        const { data: companyProfile } = await supabaseAdmin
          .from('company_profile')
          .select('user_id')
          .eq('id', job.company_id)
          .single()

        if (companyProfile && companyProfile.user_id === user.id) {
          // Owner can see all statuses
          return NextResponse.json({ job })
        }
      }
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ job })
  } catch (error: any) {
    console.error('Get job error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// PATCH - Update a job posting
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

    // Get job and verify ownership
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('role_requirement')
      .select(`
        *,
        company_profile!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.company_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    const allowedFields = [
      'role_title', 'role_level', 'department', 'job_description',
      'required_skills', 'preferred_qualifications', 'responsibilities',
      'work_type', 'location', 'salary_min', 'salary_max', 'equity_offered',
      'benefits', 'application_deadline', 'status'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'required_skills') {
          try {
            updateData[field] = typeof body[field] === 'string'
              ? JSON.parse(body[field])
              : body[field]
          } catch (e) {
            return NextResponse.json(
              { error: `Invalid ${field} JSON format` },
              { status: 400 }
            )
          }
        } else if (field === 'preferred_qualifications' || field === 'responsibilities' || field === 'benefits') {
          updateData[field] = Array.isArray(body[field])
            ? body[field]
            : body[field]
              ? body[field].split(field === 'responsibilities' ? '\n' : ',').map((s: string) => s.trim()).filter(Boolean)
              : []
        } else if (field === 'salary_min' || field === 'salary_max') {
          updateData[field] = body[field] ? parseFloat(body[field]) : null
        } else {
          updateData[field] = body[field]
        }
      }
    }

    // Validate enums if provided
    if (updateData.role_level) {
      const validLevels = ['intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive']
      if (!validLevels.includes(updateData.role_level)) {
        return NextResponse.json(
          { error: 'Invalid role level' },
          { status: 400 }
        )
      }
    }

    if (updateData.work_type) {
      const validWorkTypes = ['remote', 'hybrid', 'onsite', 'flexible']
      if (!validWorkTypes.includes(updateData.work_type)) {
        return NextResponse.json(
          { error: 'Invalid work type' },
          { status: 400 }
        )
      }
    }

    if (updateData.status) {
      const validStatuses = ['draft', 'open', 'closed', 'filled', 'cancelled']
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
    }

    // Update job
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('role_requirement')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating job:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job posting' },
        { status: 500 }
      )
    }

    // Trigger automatic re-run of matches if job is open (fire and forget)
    if (updateData.status === 'open' || !updateData.status) {
      setTimeout(async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/auto-rerun`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_id: params.id,
              trigger_type: 'job_updated',
            }),
          })
        } catch (err) {
          console.error('Failed to trigger auto-rerun matches:', err)
        }
      }, 0)
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: 'Job posting updated successfully',
    })
  } catch (error: any) {
    console.error('Update job error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a job posting
export async function DELETE(
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

    // Get job and verify ownership
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('role_requirement')
      .select(`
        *,
        company_profile!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.company_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete job (or mark as cancelled)
    const { error: deleteError } = await supabaseAdmin
      .from('role_requirement')
      .update({ status: 'cancelled' })
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting job:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete job posting' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job posting deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete job error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


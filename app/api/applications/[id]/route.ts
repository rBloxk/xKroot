import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyApplicationStatusChanged } from '@/lib/notifications/createNotification'

export const dynamic = 'force-dynamic'

/**
 * GET - Get a specific application
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

    const { data: application, error } = await supabaseAdmin
      .from('application')
      .select(`
        *,
        candidate_profile!inner(
          id,
          user_id,
          bio,
          location,
          current_position,
          years_experience,
          linkedin_url,
          github_url,
          portfolio_url
        ),
        role_requirement!inner(
          *,
          company_profile!inner(
            id,
            user_id,
            company_name
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Verify ownership (candidate or company)
    const isCandidateOwner = application.candidate_profile.user_id === user.id
    const isCompanyOwner = application.role_requirement.company_profile.user_id === user.id

    if (!isCandidateOwner && !isCompanyOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ application })
  } catch (error: any) {
    console.error('Get application error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update application status
 */
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
    const { application_status, notes } = body

    // Get application and verify company ownership
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('application')
      .select(`
        *,
        role_requirement!inner(
          *,
          company_profile!inner(user_id)
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Only company can update application status
    const isCompanyOwner = application.role_requirement.company_profile.user_id === user.id
    if (!isCompanyOwner) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the company can update application status.' },
        { status: 403 }
      )
    }

    // Validate status
    if (application_status) {
      const validStatuses = [
        'submitted',
        'under_review',
        'shortlisted',
        'interview_scheduled',
        'interview_completed',
        'offer_extended',
        'offer_accepted',
        'offer_declined',
        'rejected',
        'withdrawn',
      ]

      if (!validStatuses.includes(application_status)) {
        return NextResponse.json(
          { error: 'Invalid application status' },
          { status: 400 }
        )
      }
    }

    // Update application
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (application_status !== undefined) {
      updateData.application_status = application_status
      
      // Set status-specific timestamps
      if (application_status === 'shortlisted') {
        updateData.shortlisted_at = new Date().toISOString()
      } else if (application_status === 'interview_scheduled') {
        updateData.interview_scheduled_at = new Date().toISOString()
      } else if (application_status === 'offer_extended') {
        updateData.offer_extended_at = new Date().toISOString()
      } else if (application_status === 'rejected') {
        updateData.rejected_at = new Date().toISOString()
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('application')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    // Update match status if applicable
    if (application_status === 'offer_accepted' || application_status === 'rejected') {
      await supabaseAdmin
        .from('match_result')
        .update({ match_status: application_status === 'offer_accepted' ? 'hired' : 'rejected' })
        .eq('candidate_id', application.candidate_id)
        .eq('role_requirement_id', application.role_requirement_id)
    }

    // Send notification to candidate if status changed
    if (application_status && ['shortlisted', 'interview_scheduled', 'offer_extended', 'rejected'].includes(application_status)) {
      const { data: candidate } = await supabaseAdmin
        .from('candidate_profile')
        .select('user_id')
        .eq('id', application.candidate_id)
        .single()

      if (candidate) {
        await notifyApplicationStatusChanged(
          candidate.user_id,
          application.role_requirement.role_title,
          application.role_requirement.company_profile.company_name,
          application_status,
          application.role_requirement_id
        )
      }
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: 'Application updated successfully',
    })
  } catch (error: any) {
    console.error('Update application error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Withdraw application (candidate only)
 */
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

    // Get application and verify candidate ownership
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('application')
      .select(`
        *,
        candidate_profile!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Only candidate can withdraw
    if (application.candidate_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the candidate can withdraw their application.' },
        { status: 403 }
      )
    }

    // Update status to withdrawn instead of deleting
    const { error: updateError } = await supabaseAdmin
      .from('application')
      .update({
        application_status: 'withdrawn',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error withdrawing application:', updateError)
      return NextResponse.json(
        { error: 'Failed to withdraw application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Application withdrawn successfully',
    })
  } catch (error: any) {
    console.error('Withdraw application error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


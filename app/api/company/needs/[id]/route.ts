import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Get a specific company need
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

    const { data: need, error } = await supabaseAdmin
      .from('company_need')
      .select(`
        *,
        company_profile!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (error || !need) {
      return NextResponse.json(
        { error: 'Company need not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (need.company_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      need,
    })
  } catch (error: any) {
    console.error('Get company need error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// PATCH - Update a company need
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
    const {
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

    // Get need and verify ownership
    const { data: need, error: fetchError } = await supabaseAdmin
      .from('company_need')
      .select(`
        *,
        company_profile!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !need) {
      return NextResponse.json(
        { error: 'Company need not found' },
        { status: 404 }
      )
    }

    if (need.company_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (need_type !== undefined) updateData.need_type = need_type
    if (priority_level !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'critical']
      if (!validPriorities.includes(priority_level)) {
        return NextResponse.json(
          { error: 'Invalid priority level' },
          { status: 400 }
        )
      }
      updateData.priority_level = priority_level
    }
    if (description !== undefined) updateData.description = description
    if (required_skills !== undefined) {
      updateData.required_skills = Array.isArray(required_skills)
        ? required_skills
        : required_skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (preferred_skills !== undefined) {
      updateData.preferred_skills = Array.isArray(preferred_skills)
        ? preferred_skills
        : preferred_skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (nice_to_have_skills !== undefined) {
      updateData.nice_to_have_skills = Array.isArray(nice_to_have_skills)
        ? nice_to_have_skills
        : nice_to_have_skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (urgency_score !== undefined) {
      const urgency = parseInt(urgency_score)
      if (isNaN(urgency) || urgency < 0 || urgency > 100) {
        return NextResponse.json(
          { error: 'Urgency score must be between 0 and 100' },
          { status: 400 }
        )
      }
      updateData.urgency_score = urgency
    }
    if (budget_range_min !== undefined) {
      updateData.budget_range_min = budget_range_min ? parseFloat(budget_range_min) : null
    }
    if (budget_range_max !== undefined) {
      updateData.budget_range_max = budget_range_max ? parseFloat(budget_range_max) : null
    }
    if (timeline !== undefined) updateData.timeline = timeline
    if (status !== undefined) {
      const validStatuses = ['active', 'fulfilled', 'cancelled', 'on_hold']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    // Update need
    const { data: updatedNeed, error: updateError } = await supabaseAdmin
      .from('company_need')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating company need:', updateError)
      return NextResponse.json(
        { error: 'Failed to update company need' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      need: updatedNeed,
      message: 'Company need updated successfully',
    })
  } catch (error: any) {
    console.error('Update company need error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a company need
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

    // Get need and verify ownership
    const { data: need, error: fetchError } = await supabaseAdmin
      .from('company_need')
      .select(`
        *,
        company_profile!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !need) {
      return NextResponse.json(
        { error: 'Company need not found' },
        { status: 404 }
      )
    }

    if (need.company_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete need
    const { error: deleteError } = await supabaseAdmin
      .from('company_need')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting company need:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete company need' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Company need deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete company need error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


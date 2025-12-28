import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Get a specific skill
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

    const { data: skill, error } = await supabaseAdmin
      .from('candidate_skill')
      .select(`
        *,
        candidate_profile!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (error || !skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    // Verify ownership through candidate_profile
    if (skill.candidate_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      skill,
    })
  } catch (error: any) {
    console.error('Get skill error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// PATCH - Update a skill
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
      skill_name,
      skill_category,
      proficiency_level,
      years_experience,
      verified,
    } = body

    // Get skill and verify ownership
    const { data: skill, error: fetchError } = await supabaseAdmin
      .from('candidate_skill')
      .select(`
        *,
        candidate_profile!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    if (skill.candidate_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Validate proficiency_level if provided
    if (proficiency_level) {
      const validProficiency = ['beginner', 'intermediate', 'advanced', 'expert']
      if (!validProficiency.includes(proficiency_level)) {
        return NextResponse.json(
          { error: 'Invalid proficiency level' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (skill_name !== undefined) updateData.skill_name = skill_name
    if (skill_category !== undefined) updateData.skill_category = skill_category
    if (proficiency_level !== undefined) updateData.proficiency_level = proficiency_level
    if (years_experience !== undefined) {
      updateData.years_experience = years_experience ? parseFloat(years_experience) : null
    }
    if (verified !== undefined) updateData.verified = verified

    // Update skill
    const { data: updatedSkill, error: updateError } = await supabaseAdmin
      .from('candidate_skill')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating skill:', updateError)
      return NextResponse.json(
        { error: 'Failed to update skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      skill: updatedSkill,
      message: 'Skill updated successfully',
    })
  } catch (error: any) {
    console.error('Update skill error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a skill
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

    // Get skill and verify ownership
    const { data: skill, error: fetchError } = await supabaseAdmin
      .from('candidate_skill')
      .select(`
        *,
        candidate_profile!inner(user_id)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    if (skill.candidate_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete skill
    const { error: deleteError } = await supabaseAdmin
      .from('candidate_skill')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting skill:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Skill deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete skill error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


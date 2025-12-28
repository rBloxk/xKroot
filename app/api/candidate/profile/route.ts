import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Calculate profile completeness percentage
function calculateProfileCompleteness(profile: any): number {
  let score = 0
  const maxScore = 100

  // Basic info (30 points)
  if (profile.bio) score += 10
  if (profile.location) score += 10
  if (profile.current_position) score += 10

  // Experience (20 points)
  if (profile.years_experience !== null && profile.years_experience !== undefined) score += 10
  if (profile.education_level) score += 10

  // Preferences (20 points)
  if (profile.preferred_work_type) score += 10
  if (profile.salary_expectation_min || profile.salary_expectation_max) score += 10

  // Social links (15 points)
  if (profile.linkedin_url) score += 5
  if (profile.github_url) score += 5
  if (profile.portfolio_url) score += 5

  // Resume (15 points)
  if (profile.raw_resume_text || profile.resume_file_url) score += 15

  return Math.min(score, maxScore)
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error } = await supabaseAdmin
      .from('candidate_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile: profile || null,
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

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
      bio,
      location,
      current_position,
      years_experience,
      education_level,
      availability_status,
      salary_expectation_min,
      salary_expectation_max,
      preferred_work_type,
      preferred_location,
      linkedin_url,
      github_url,
      portfolio_url,
      raw_resume_text,
      resume_file_url,
      avatar_url,
      cover_image_url,
    } = body

    // Validate required fields
    if (!bio || !location || !current_position) {
      return NextResponse.json(
        { error: 'Bio, location, and current position are required' },
        { status: 400 }
      )
    }

    // Validate availability_status
    const validStatuses = ['available', 'open', 'not_looking', 'passive']
    if (availability_status && !validStatuses.includes(availability_status)) {
      return NextResponse.json(
        { error: 'Invalid availability status' },
        { status: 400 }
      )
    }

    // Validate preferred_work_type
    const validWorkTypes = ['remote', 'hybrid', 'onsite', 'flexible']
    if (preferred_work_type && !validWorkTypes.includes(preferred_work_type)) {
      return NextResponse.json(
        { error: 'Invalid preferred work type' },
        { status: 400 }
      )
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('candidate_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const profileData: any = {
      user_id: user.id,
      bio,
      location,
      current_position,
      years_experience: years_experience ? parseInt(years_experience) : null,
      education_level: education_level || null,
      availability_status: availability_status || 'available',
      salary_expectation_min: salary_expectation_min ? parseFloat(salary_expectation_min) : null,
      salary_expectation_max: salary_expectation_max ? parseFloat(salary_expectation_max) : null,
      preferred_work_type: preferred_work_type || null,
      preferred_location: preferred_location || null,
      linkedin_url: linkedin_url || null,
      github_url: github_url || null,
      portfolio_url: portfolio_url || null,
      raw_resume_text: raw_resume_text || null,
      resume_file_url: resume_file_url || null,
      avatar_url: avatar_url || null,
      cover_image_url: cover_image_url || null,
      updated_at: new Date().toISOString(),
    }

    // Calculate profile completeness
    profileData.profile_completeness = calculateProfileCompleteness(profileData)

    let result
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabaseAdmin
        .from('candidate_profile')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating candidate profile:', error)
        console.error('Profile data:', JSON.stringify(profileData, null, 2))
        console.error('User ID:', user.id)
        console.error('Profile ID:', existingProfile.id)
        return NextResponse.json(
          { 
            error: error.message || 'Failed to update profile',
            details: process.env.NODE_ENV === 'development' ? error : undefined,
            code: error.code,
          },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Create new profile
      const { data, error } = await supabaseAdmin
        .from('candidate_profile')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating candidate profile:', error)
        console.error('Profile data:', JSON.stringify(profileData, null, 2))
        console.error('User ID:', user.id)
        return NextResponse.json(
          { 
            error: error.message || 'Failed to create profile',
            details: process.env.NODE_ENV === 'development' ? error : undefined,
            code: error.code,
          },
          { status: 500 }
        )
      }

      result = data
    }

    // Trigger automatic re-run of matches (fire and forget)
    // Use setTimeout to make it non-blocking
    setTimeout(async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/auto-rerun`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_id: result.id,
            trigger_type: 'candidate_updated',
          }),
        })
      } catch (err) {
        console.error('Failed to trigger auto-rerun matches:', err)
      }
    }, 0)

    return NextResponse.json({
      success: true,
      profile: result,
      message: 'Profile saved successfully',
    })
  } catch (error: any) {
    console.error('Save profile error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


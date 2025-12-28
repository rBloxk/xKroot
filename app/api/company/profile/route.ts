import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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
      .from('company_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
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
    console.error('Get company profile error:', error)
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
      company_name,
      company_size,
      industry,
      description,
      website_url,
      location,
      headquarters_location,
      company_type,
      funding_stage,
      startup_stage,
      company_culture,
      benefits_offered,
      tech_stack,
      logo_url,
      cover_image_url,
    } = body

    // Validate required fields
    if (!company_name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Validate company_size
    const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise']
    if (company_size && !validSizes.includes(company_size)) {
      return NextResponse.json(
        { error: 'Invalid company size' },
        { status: 400 }
      )
    }

    // Validate company_type
    const validTypes = ['public', 'private', 'nonprofit', 'government']
    if (company_type && !validTypes.includes(company_type)) {
      return NextResponse.json(
        { error: 'Invalid company type' },
        { status: 400 }
      )
    }

    // Validate startup_stage
    const validStages = ['idea', 'mvp', 'scale']
    if (startup_stage && !validStages.includes(startup_stage)) {
      return NextResponse.json(
        { error: 'Invalid startup stage' },
        { status: 400 }
      )
    }

    // Parse JSONB fields
    let companyCultureJson = null
    if (company_culture) {
      try {
        companyCultureJson = typeof company_culture === 'string' 
          ? JSON.parse(company_culture) 
          : company_culture
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid company culture JSON' },
          { status: 400 }
        )
      }
    }

    // Parse array fields
    const benefitsArray = Array.isArray(benefits_offered) 
      ? benefits_offered 
      : benefits_offered 
        ? benefits_offered.split(',').map((b: string) => b.trim()).filter(Boolean)
        : []
    
    const techStackArray = Array.isArray(tech_stack)
      ? tech_stack
      : tech_stack
        ? tech_stack.split(',').map((t: string) => t.trim()).filter(Boolean)
        : []

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('company_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const profileData: any = {
      user_id: user.id,
      company_name,
      company_size: company_size || null,
      industry: industry || null,
      description: description || null,
      website_url: website_url || null,
      location: location || null,
      headquarters_location: headquarters_location || null,
      company_type: company_type || null,
      funding_stage: funding_stage || null,
      startup_stage: startup_stage || null,
      company_culture: companyCultureJson,
      benefits_offered: benefitsArray,
      tech_stack: techStackArray,
      logo_url: logo_url || null,
      cover_image_url: cover_image_url || null,
      updated_at: new Date().toISOString(),
    }

    let result
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabaseAdmin
        .from('company_profile')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating company profile:', error)
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
        .from('company_profile')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating company profile:', error)
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

    return NextResponse.json({
      success: true,
      profile: result,
      message: 'Profile saved successfully',
    })
  } catch (error: any) {
    console.error('Save company profile error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


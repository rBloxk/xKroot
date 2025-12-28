import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { orchestrateMultiModel } from '@/lib/ai/orchestration/consensus'
import { getSkillExtractionSystemPrompt, buildSkillExtractionPrompt } from '@/lib/ai/prompts/skillExtraction'

export const dynamic = 'force-dynamic'

/**
 * Extract skills from onboarding answers
 * This is a basic implementation that can be enhanced with AI later
 * For now, it extracts skills from the tech_stack and primary_role answers
 */
function extractSkillsFromAnswers(onboardingAnswers: Record<string, any>): Array<{
  skill_name: string
  category: string
  proficiency_level: string
  source: string
}> {
  const skills: Array<{
    skill_name: string
    category: string
    proficiency_level: string
    source: string
  }> = []

  // Extract from tech_stack answer
  if (onboardingAnswers.tech_stack?.answer) {
    const techStack = onboardingAnswers.tech_stack.answer
    const techList = typeof techStack === 'string' 
      ? techStack.split(',').map(t => t.trim()).filter(Boolean)
      : Array.isArray(techStack) 
        ? techStack 
        : []

    techList.forEach((tech: string) => {
      if (tech) {
        skills.push({
          skill_name: tech,
          category: 'technical',
          proficiency_level: 'intermediate', // Default, can be improved with AI
          source: 'ai_inferred',
        })
      }
    })
  }

  // Extract from primary_role answer
  if (onboardingAnswers.primary_role?.answer) {
    const role = onboardingAnswers.primary_role.answer
    if (role && typeof role === 'string') {
      // Add role as a skill
      skills.push({
        skill_name: role,
        category: 'role',
        proficiency_level: 'intermediate',
        source: 'ai_inferred',
      })
    }
  }

  // Extract from experience_level to set proficiency
  if (onboardingAnswers.experience_level?.answer) {
    const years = parseFloat(onboardingAnswers.experience_level.answer) || 0
    const proficiencyMap: Record<string, string> = {
      '< 1': 'beginner',
      '1-3': 'intermediate',
      '3-5': 'advanced',
      '5+': 'expert',
    }
    
    // Update proficiency levels based on experience
    const experienceKey = years < 1 ? '< 1' : years < 3 ? '1-3' : years < 5 ? '3-5' : '5+'
    const proficiency = proficiencyMap[experienceKey] || 'intermediate'
    
    // Update all skills with this proficiency
    skills.forEach(skill => {
      skill.proficiency_level = proficiency
    })
  }

  return skills
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

    const { candidate_id } = await request.json()

    if (!candidate_id) {
      return NextResponse.json(
        { error: 'candidate_id is required' },
        { status: 400 }
      )
    }

    // Verify the candidate profile belongs to the user
    const { data: candidateProfile, error: profileError } = await supabaseAdmin
      .from('candidate_profile')
      .select('id, user_id, onboarding_answers')
      .eq('id', candidate_id)
      .single()

    if (profileError || !candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      )
    }

    if (candidateProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if onboarding answers exist
    if (!candidateProfile.onboarding_answers) {
      return NextResponse.json(
        { error: 'No onboarding answers found. Please complete onboarding first.' },
        { status: 400 }
      )
    }

    // Extract skills using Multi-Model Intelligence
    let extractedSkills: Array<{
      skill_name: string
      category: string
      proficiency_level: string
      source: string
    }> = []

    let mmiConfidence: number | null = null
    try {
      // Try MMI extraction first
      const onboardingAnswers = candidateProfile.onboarding_answers as Record<string, any>
      const systemPrompt = getSkillExtractionSystemPrompt()
      const prompt = buildSkillExtractionPrompt(onboardingAnswers)

      const consensusResult = await orchestrateMultiModel(
        'skill_extraction',
        prompt,
        systemPrompt,
        {
          timeout: 30000,
          requireAll: false, // Don't require all models - use what works
          fallbackEnabled: true,
          jsonMode: true,
        }
      )

      // Store MMI confidence (Phase 10)
      mmiConfidence = consensusResult.confidence_score

      // Extract skills from consensus output
      if (consensusResult.consensus_output?.skills && Array.isArray(consensusResult.consensus_output.skills)) {
        extractedSkills = consensusResult.consensus_output.skills
          .filter((skill: any) => skill.skill_name && skill.category)
          .map((skill: any) => ({
            skill_name: skill.skill_name,
            category: skill.category || 'technical',
            proficiency_level: skill.proficiency_level || 'intermediate',
            source: 'mmi_extracted', // Mark as MMI-extracted
            confidence: skill.confidence || consensusResult.confidence_score, // Include confidence (Phase 10)
          }))
      }

      // If MMI didn't extract enough skills, fall back to deterministic extraction
      if (extractedSkills.length === 0) {
        console.warn('MMI extraction returned no skills, falling back to deterministic extraction')
        extractedSkills = extractSkillsFromAnswers(onboardingAnswers)
      }
    } catch (error: any) {
      console.error('MMI skill extraction error:', error)
      // Fall back to deterministic extraction
      extractedSkills = extractSkillsFromAnswers(candidateProfile.onboarding_answers as Record<string, any>)
    }

    if (extractedSkills.length === 0) {
      return NextResponse.json({
        success: true,
        skills: [],
        message: 'No skills could be extracted from onboarding answers',
      })
    }

    // Check for existing skills to avoid duplicates
    const { data: existingSkills } = await supabaseAdmin
      .from('candidate_skill')
      .select('skill_name')
      .eq('candidate_id', candidate_id)

    const existingSkillNames = new Set(
      (existingSkills || []).map(s => s.skill_name.toLowerCase())
    )

    // Filter out duplicates and insert new skills
    const newSkills = extractedSkills.filter(
      skill => !existingSkillNames.has(skill.skill_name.toLowerCase())
    )

    if (newSkills.length > 0) {
      const skillsToInsert = newSkills.map(skill => ({
        candidate_id,
        skill_name: skill.skill_name,
        skill_category: skill.category,
        proficiency_level: skill.proficiency_level,
        source: skill.source,
        verified: false,
      }))

      const { error: insertError } = await supabaseAdmin
        .from('candidate_skill')
        .insert(skillsToInsert)

      if (insertError) {
        console.error('Error inserting skills:', insertError)
        return NextResponse.json(
          { error: 'Failed to save extracted skills' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      skills: extractedSkills,
      new_skills_count: newSkills.length,
      skipped_duplicates: extractedSkills.length - newSkills.length,
      message: `Extracted ${newSkills.length} new skills from onboarding answers`,
      mmi_confidence: mmiConfidence, // Include MMI confidence (Phase 10)
    })
  } catch (error: any) {
    console.error('Extract skills error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


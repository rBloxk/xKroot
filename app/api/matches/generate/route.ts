import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateMatchScore } from '@/lib/matching/scoreCalculator'
import { CandidateData, JobData } from '@/lib/matching/deterministic'
import { notifyMatchFound } from '@/lib/notifications/createNotification'

export const dynamic = 'force-dynamic'

/**
 * Generate matches for a candidate or job
 * Can be triggered manually or automatically when data changes
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
    const { candidate_id, job_id, trigger } = body

    // Validate input
    if (!candidate_id && !job_id) {
      return NextResponse.json(
        { error: 'Either candidate_id or job_id is required' },
        { status: 400 }
      )
    }

    let matches: Array<{
      candidate_id: string
      job_id: string
      score: number
      match_result: any
    }> = []

    if (candidate_id) {
      // Generate matches for a specific candidate
      matches = await generateMatchesForCandidate(candidate_id, user.id)
    } else if (job_id) {
      // Generate matches for a specific job
      matches = await generateMatchesForJob(job_id, user.id)
    }

    return NextResponse.json({
      success: true,
      matches_generated: matches.length,
      matches,
      message: `Generated ${matches.length} matches`,
    })
  } catch (error: any) {
    console.error('Generate matches error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Generate matches for a candidate against all open jobs
 */
async function generateMatchesForCandidate(
  candidateId: string,
  userId: string
): Promise<Array<{ candidate_id: string; job_id: string; score: number; match_result: any }>> {
  // Verify candidate ownership
  const { data: candidateProfile } = await supabaseAdmin
    .from('candidate_profile')
    .select('user_id')
    .eq('id', candidateId)
    .single()

  if (!candidateProfile || candidateProfile.user_id !== userId) {
    throw new Error('Unauthorized')
  }

  // Get candidate data
  const candidateData = await getCandidateData(candidateId)
  if (!candidateData) {
    throw new Error('Candidate profile not found')
  }

  // Get all open jobs
  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('role_requirement')
    .select(`
      *,
      company_profile!inner(id, company_name)
    `)
    .eq('status', 'open')

  if (jobsError || !jobs) {
    throw new Error('Failed to fetch jobs')
  }

  // Calculate matches
  const matches = []
  for (const job of jobs) {
    const jobData: JobData = {
      id: job.id,
      required_skills: job.required_skills,
      role_level: job.role_level,
      work_type: job.work_type,
      location: job.location,
      salary_min: job.salary_min ? parseFloat(job.salary_min) : null,
      salary_max: job.salary_max ? parseFloat(job.salary_max) : null,
    }

    const scoreResult = await calculateMatchScore(candidateData, jobData)

    // Only store matches above threshold (e.g., 40%)
    if (scoreResult.finalScore >= 40) {
      const matchResult = await storeMatchResult(
        candidateId,
        job.id,
        job.company_id,
        scoreResult
      )

      matches.push({
        candidate_id: candidateId,
        job_id: job.id,
        score: scoreResult.finalScore,
        match_result: matchResult,
      })

      // Send notification to candidate
      await notifyMatchFound(
        candidateId,
        job.id,
        job.role_title,
        job.company_profile.company_name,
        scoreResult.finalScore
      )
    }
  }

  return matches
}

/**
 * Generate matches for a job against all candidates
 */
async function generateMatchesForJob(
  jobId: string,
  userId: string
): Promise<Array<{ candidate_id: string; job_id: string; score: number; match_result: any }>> {
  // Verify job ownership
  const { data: job } = await supabaseAdmin
    .from('role_requirement')
    .select(`
      *,
      company_profile!inner(user_id, id, company_name)
    `)
    .eq('id', jobId)
    .single()

  if (!job || job.company_profile.user_id !== userId) {
    throw new Error('Unauthorized')
  }

  const jobData: JobData = {
    id: job.id,
    required_skills: job.required_skills,
    role_level: job.role_level,
    work_type: job.work_type,
    location: job.location,
    salary_min: job.salary_min ? parseFloat(job.salary_min) : null,
    salary_max: job.salary_max ? parseFloat(job.salary_max) : null,
  }

  // Get all available candidates
  const { data: candidates, error: candidatesError } = await supabaseAdmin
    .from('candidate_profile')
    .select('id')
    .eq('availability_status', 'available')
    .or('availability_status.eq.open')

  if (candidatesError || !candidates) {
    throw new Error('Failed to fetch candidates')
  }

  // Calculate matches
  const matches = []
  for (const candidate of candidates) {
    const candidateData = await getCandidateData(candidate.id)
    if (!candidateData) continue

    const scoreResult = await calculateMatchScore(candidateData, jobData)

    // Only store matches above threshold
    if (scoreResult.finalScore >= 40) {
      const matchResult = await storeMatchResult(
        candidate.id,
        jobId,
        job.company_id,
        scoreResult
      )

      matches.push({
        candidate_id: candidate.id,
        job_id: jobId,
        score: scoreResult.finalScore,
        match_result: matchResult,
      })

      // Send notification to candidate
      await notifyMatchFound(
        candidate.id,
        jobId,
        job.role_title,
        job.company_profile.company_name || 'Company',
        scoreResult.finalScore
      )
    }
  }

  return matches
}

/**
 * Get candidate data for matching
 */
async function getCandidateData(candidateId: string): Promise<CandidateData | null> {
  // Get candidate profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('candidate_profile')
    .select('*')
    .eq('id', candidateId)
    .single()

  if (profileError || !profile) {
    return null
  }

  // Get candidate skills
  const { data: skills, error: skillsError } = await supabaseAdmin
    .from('candidate_skill')
    .select('skill_name, proficiency_level, verified')
    .eq('candidate_id', candidateId)

  if (skillsError) {
    console.error('Error fetching skills:', skillsError)
  }

  return {
    id: candidateId,
    skills: skills || [],
    years_experience: profile.years_experience,
    location: profile.location,
    preferred_work_type: profile.preferred_work_type,
    preferred_location: profile.preferred_location,
    salary_expectation_min: profile.salary_expectation_min ? parseFloat(profile.salary_expectation_min) : null,
    salary_expectation_max: profile.salary_expectation_max ? parseFloat(profile.salary_expectation_max) : null,
    availability_status: profile.availability_status,
  }
}

/**
 * Store match result in database
 */
async function storeMatchResult(
  candidateId: string,
  jobId: string,
  companyId: string,
  scoreResult: any
): Promise<any> {
  // Enhance score with assessment data
  const { getCandidateAssessmentScores, enhanceMatchScoreWithAssessments } = await import('@/lib/assessments/integration')
  const assessmentScores = await getCandidateAssessmentScores(candidateId)
  
  // Determine job requirements (simple heuristic - can be enhanced)
  const jobRequiresTechnical = true // Most tech jobs require technical skills
  const jobRequiresCommunication = true // Most jobs require communication
  const jobRequiresLeadership = false // Only for senior/lead roles (can be enhanced)
  
  const enhanced = enhanceMatchScoreWithAssessments(
    scoreResult.finalScore,
    assessmentScores,
    {
      requiresTechnical: jobRequiresTechnical,
      requiresCommunication: jobRequiresCommunication,
      requiresLeadership: jobRequiresLeadership,
    }
  )
  
  // Use enhanced score if assessments exist
  const finalMatchScore = enhanced.enhancedScore > scoreResult.finalScore 
    ? enhanced.enhancedScore 
    : scoreResult.finalScore

  // Check if match already exists
  const { data: existingMatch } = await supabaseAdmin
    .from('match_result')
    .select('id')
    .eq('candidate_id', candidateId)
    .eq('role_requirement_id', jobId)
    .single()

  const matchData: any = {
    candidate_id: candidateId,
    role_requirement_id: jobId,
    company_id: companyId,
    match_score: finalMatchScore,
    match_confidence: scoreResult.aiScore ? 0.8 : 0.6, // Higher confidence with AI
    match_reasoning: scoreResult.reasoning || null,
    skill_match_percentage: scoreResult.breakdown.skillMatch,
    cultural_fit_score: scoreResult.breakdown.culturalFit || null,
    overall_fit_score: finalMatchScore,
    match_status: 'pending',
  }

  let matchResult
  if (existingMatch) {
    // Update existing match
    const { data, error } = await supabaseAdmin
      .from('match_result')
      .update(matchData)
      .eq('id', existingMatch.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating match:', error)
      throw new Error('Failed to update match')
    }

    matchResult = data
  } else {
    // Create new match
    const { data, error } = await supabaseAdmin
      .from('match_result')
      .insert(matchData)
      .select()
      .single()

    if (error) {
      console.error('Error creating match:', error)
      throw new Error('Failed to create match')
    }

    matchResult = data
  }

  // Store match factors (include assessment data)
  const factorsData = {
    ...scoreResult,
    assessmentBoost: enhanced.assessmentBoost,
    assessmentFactors: enhanced.assessmentFactors,
  }
  await storeMatchFactors(matchResult.id, factorsData)

  return matchResult
}

/**
 * Store match factors (why the match happened)
 */
async function storeMatchFactors(matchResultId: string, scoreResult: any) {
  // Delete existing factors
  await supabaseAdmin
    .from('match_factor')
    .delete()
    .eq('match_result_id', matchResultId)

  const factors = [
    {
      match_result_id: matchResultId,
      factor_type: 'skill_match',
      factor_name: 'Skill Compatibility',
      factor_score: scoreResult.breakdown.skillMatch,
      factor_weight: 0.4,
      factor_explanation: `Matched ${scoreResult.skillMatchDetails.matched.length} of ${scoreResult.skillMatchDetails.matched.length + scoreResult.skillMatchDetails.missing.length} required skills. ${scoreResult.skillMatchDetails.matched.length > 0 ? `Strong in: ${scoreResult.skillMatchDetails.matched.slice(0, 3).join(', ')}${scoreResult.skillMatchDetails.matched.length > 3 ? '...' : ''}` : ''}`,
      evidence: {
        matched: scoreResult.skillMatchDetails.matched,
        missing: scoreResult.skillMatchDetails.missing,
      },
    },
    {
      match_result_id: matchResultId,
      factor_type: 'experience_match',
      factor_name: 'Experience Level',
      factor_score: scoreResult.breakdown.experienceMatch,
      factor_weight: 0.25,
      factor_explanation: 'Experience level alignment',
    },
    {
      match_result_id: matchResultId,
      factor_type: 'location',
      factor_name: 'Location Compatibility',
      factor_score: scoreResult.breakdown.locationMatch,
      factor_weight: 0.2,
      factor_explanation: scoreResult.breakdown.locationMatch >= 80
        ? 'Perfect location match! Work arrangement aligns with preferences'
        : scoreResult.breakdown.locationMatch >= 60
        ? 'Good location compatibility with some considerations'
        : 'Location or work type may not fully align with preferences',
    },
    {
      match_result_id: matchResultId,
      factor_type: 'salary',
      factor_name: 'Salary Alignment',
      factor_score: scoreResult.breakdown.salaryMatch,
      factor_weight: 0.15,
      factor_explanation: scoreResult.breakdown.salaryMatch >= 80
        ? 'Salary expectations align well with the role'
        : scoreResult.breakdown.salaryMatch >= 60
        ? 'Salary expectations are close but may need discussion'
        : 'Salary expectations may not align with the role',
    },
  ]

  // Add AI factors if available
  if (scoreResult.breakdown.culturalFit) {
    factors.push({
      match_result_id: matchResultId,
      factor_type: 'cultural_fit',
      factor_name: 'Cultural Fit',
      factor_score: scoreResult.breakdown.culturalFit,
      factor_weight: 0.15,
      factor_explanation: scoreResult.reasoning || 'AI-assessed cultural fit',
    })
  }

  if (scoreResult.breakdown.softSkills) {
    factors.push({
      match_result_id: matchResultId,
      factor_type: 'soft_skills',
      factor_name: 'Soft Skills',
      factor_score: scoreResult.breakdown.softSkills,
      factor_weight: 0.1,
      factor_explanation: 'AI-assessed soft skills compatibility',
    })
  }

  // Add assessment factors if available
  if (scoreResult.assessmentBoost && scoreResult.assessmentBoost > 0) {
    factors.push({
      match_result_id: matchResultId,
      factor_type: 'assessment',
      factor_name: 'Assessment Performance',
      factor_score: Math.min(scoreResult.assessmentBoost * 10, 100), // Convert to 0-100 scale
      factor_weight: 0.1,
      factor_explanation: `Assessment boost: +${scoreResult.assessmentBoost.toFixed(1)} points. ${(scoreResult.assessmentFactors || []).join(', ')}`,
      evidence: {
        factors: scoreResult.assessmentFactors || [],
        boost: scoreResult.assessmentBoost,
      },
    })
  }

  // Insert factors
  const { error } = await supabaseAdmin
    .from('match_factor')
    .insert(factors)

  if (error) {
    console.error('Error storing match factors:', error)
    // Don't throw - factors are supplementary
  }
}


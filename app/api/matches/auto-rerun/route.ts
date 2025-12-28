import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateMatchScore } from '@/lib/matching/scoreCalculator'
import { CandidateData, JobData } from '@/lib/matching/deterministic'

export const dynamic = 'force-dynamic'

/**
 * Auto-rerun matching when data changes
 * This endpoint can be called by database triggers or webhooks
 * It's also called internally when profiles/jobs are updated
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      candidate_id, 
      job_id, 
      company_id,
      trigger_type // 'candidate_updated', 'job_updated', 'skill_added', etc.
    } = body

    if (!candidate_id && !job_id && !company_id) {
      return NextResponse.json(
        { error: 'At least one of candidate_id, job_id, or company_id is required' },
        { status: 400 }
      )
    }

    let matchesRegenerated = 0

    if (candidate_id) {
      // Re-run matches for this candidate against all open jobs
      matchesRegenerated = await rerunMatchesForCandidate(candidate_id)
    } else if (job_id) {
      // Re-run matches for this job against all available candidates
      matchesRegenerated = await rerunMatchesForJob(job_id)
    } else if (company_id) {
      // Re-run matches for all jobs of this company
      const { data: jobs } = await supabaseAdmin
        .from('role_requirement')
        .select('id')
        .eq('company_id', company_id)
        .eq('status', 'open')

      if (jobs) {
        for (const job of jobs) {
          matchesRegenerated += await rerunMatchesForJob(job.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      matches_regenerated: matchesRegenerated,
      message: `Regenerated ${matchesRegenerated} matches`,
    })
  } catch (error: any) {
    console.error('Auto-rerun matches error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Re-run matches for a candidate
 */
async function rerunMatchesForCandidate(candidateId: string): Promise<number> {
  // Get candidate data
  const candidateData = await getCandidateData(candidateId)
  if (!candidateData) {
    return 0
  }

  // Get all open jobs
  const { data: jobs } = await supabaseAdmin
    .from('role_requirement')
    .select('*')
    .eq('status', 'open')

  if (!jobs) {
    return 0
  }

  let matchesCount = 0

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

    // Only update if score is above threshold
    if (scoreResult.finalScore >= 40) {
      await updateOrCreateMatch(
        candidateId,
        job.id,
        job.company_id,
        scoreResult
      )
      matchesCount++
    } else {
      // Delete match if score dropped below threshold
      await supabaseAdmin
        .from('match_result')
        .delete()
        .eq('candidate_id', candidateId)
        .eq('role_requirement_id', job.id)
    }
  }

  return matchesCount
}

/**
 * Re-run matches for a job
 */
async function rerunMatchesForJob(jobId: string): Promise<number> {
  // Get job data
  const { data: job } = await supabaseAdmin
    .from('role_requirement')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!job) {
    return 0
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
  const { data: candidates } = await supabaseAdmin
    .from('candidate_profile')
    .select('id')
    .in('availability_status', ['available', 'open'])

  if (!candidates) {
    return 0
  }

  let matchesCount = 0

  for (const candidate of candidates) {
    const candidateData = await getCandidateData(candidate.id)
    if (!candidateData) continue

    const scoreResult = await calculateMatchScore(candidateData, jobData)

    if (scoreResult.finalScore >= 40) {
      await updateOrCreateMatch(
        candidate.id,
        jobId,
        job.company_id,
        scoreResult
      )
      matchesCount++
    } else {
      // Delete match if score dropped below threshold
      await supabaseAdmin
        .from('match_result')
        .delete()
        .eq('candidate_id', candidate.id)
        .eq('role_requirement_id', jobId)
    }
  }

  return matchesCount
}

/**
 * Get candidate data for matching
 */
async function getCandidateData(candidateId: string): Promise<CandidateData | null> {
  const { data: profile } = await supabaseAdmin
    .from('candidate_profile')
    .select('*')
    .eq('id', candidateId)
    .single()

  if (!profile) {
    return null
  }

  const { data: skills } = await supabaseAdmin
    .from('candidate_skill')
    .select('skill_name, proficiency_level, verified')
    .eq('candidate_id', candidateId)

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
 * Update or create match result
 */
async function updateOrCreateMatch(
  candidateId: string,
  jobId: string,
  companyId: string,
  scoreResult: any
) {
  // Check if match exists
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
    match_score: scoreResult.finalScore,
    match_confidence: scoreResult.aiScore ? 0.8 : 0.6,
    match_reasoning: scoreResult.reasoning || null,
    skill_match_percentage: scoreResult.breakdown.skillMatch,
    cultural_fit_score: scoreResult.breakdown.culturalFit || null,
    overall_fit_score: scoreResult.finalScore,
    updated_at: new Date().toISOString(),
  }

  if (existingMatch) {
    await supabaseAdmin
      .from('match_result')
      .update(matchData)
      .eq('id', existingMatch.id)

    // Update factors
    await updateMatchFactors(existingMatch.id, scoreResult)
  } else {
    matchData.match_status = 'pending'
    const { data: newMatch } = await supabaseAdmin
      .from('match_result')
      .insert(matchData)
      .select()
      .single()

    if (newMatch) {
      await updateMatchFactors(newMatch.id, scoreResult)
    }
  }
}

/**
 * Update match factors
 */
async function updateMatchFactors(matchResultId: string, scoreResult: any) {
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
      factor_explanation: `Matched ${scoreResult.skillMatchDetails.matched.length} of ${scoreResult.skillMatchDetails.matched.length + scoreResult.skillMatchDetails.missing.length} required skills`,
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
      factor_explanation: 'Location and work type compatibility',
    },
    {
      match_result_id: matchResultId,
      factor_type: 'salary',
      factor_name: 'Salary Alignment',
      factor_score: scoreResult.breakdown.salaryMatch,
      factor_weight: 0.15,
      factor_explanation: 'Salary expectations alignment',
    },
  ]

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

  await supabaseAdmin
    .from('match_factor')
    .insert(factors)
}


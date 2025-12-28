/**
 * Hiring Recommendation API
 * Uses Multi-Model Intelligence to provide final hiring recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { orchestrateMultiModel } from '@/lib/ai/orchestration/consensus'
import { getHiringRecommendationSystemPrompt, buildHiringRecommendationPrompt } from '@/lib/ai/prompts/hiringRecommendation'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/hiring-recommendation
 * Get hiring recommendation for a candidate-job match
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

    const { candidate_id, job_id } = await request.json()

    if (!candidate_id || !job_id) {
      return NextResponse.json(
        { error: 'candidate_id and job_id are required' },
        { status: 400 }
      )
    }

    // Get candidate data
    const { data: candidateProfile } = await supabaseAdmin
      .from('candidate_profile')
      .select('*')
      .eq('id', candidate_id)
      .single()

    if (!candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Get candidate skills
    const { data: skills } = await supabaseAdmin
      .from('candidate_skill')
      .select('*')
      .eq('candidate_id', candidate_id)

    // Get job data
    const { data: job } = await supabaseAdmin
      .from('role_requirement')
      .select('*')
      .eq('id', job_id)
      .single()

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get match data if exists
    const { data: matchData } = await supabaseAdmin
      .from('match_result')
      .select('*')
      .eq('candidate_id', candidate_id)
      .eq('role_requirement_id', job_id)
      .single()

    // Get assessment data if available
    const { data: assessments } = await supabaseAdmin
      .from('candidate_assessment')
      .select('*')
      .eq('candidate_id', candidate_id)
      .order('assessment_date', { ascending: false })
      .limit(5)

    const candidateData = {
      skills: (skills || []).map(s => s.skill_name),
      experience_level: candidateProfile.years_experience,
      location: candidateProfile.location,
      salary_min: candidateProfile.salary_expectation_min,
      salary_max: candidateProfile.salary_expectation_max,
      bio: candidateProfile.bio,
    }

    const jobData = {
      role_title: job.role_title,
      required_skills: job.required_skills,
      role_level: job.role_level,
      location: job.location,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      work_type: job.work_type,
      job_description: job.job_description,
    }

    const matchDataForPrompt = matchData ? {
      match_score: matchData.match_score,
      skill_match_percentage: matchData.skill_match_percentage,
      cultural_fit_score: matchData.cultural_fit_score,
      match_reasoning: matchData.match_reasoning,
    } : null

    const assessmentData = assessments && assessments.length > 0 ? {
      assessments: assessments.map(a => ({
        type: a.assessment_type,
        score: a.score,
        strengths: a.strengths,
        areas_for_improvement: a.areas_for_improvement,
      })),
    } : undefined

    // Get hiring recommendation using MMI
    const systemPrompt = getHiringRecommendationSystemPrompt()
    const prompt = buildHiringRecommendationPrompt(
      candidateData,
      jobData,
      matchDataForPrompt || {},
      assessmentData
    )

    const consensusResult = await orchestrateMultiModel(
      'hiring_recommendation',
      prompt,
      systemPrompt,
      {
        timeout: 30000,
        requireAll: false,
        fallbackEnabled: true,
        jsonMode: true,
      }
    )

    if (!consensusResult.consensus_output) {
      return NextResponse.json(
        { error: 'Failed to generate hiring recommendation' },
        { status: 500 }
      )
    }

    const recommendation = consensusResult.consensus_output

    return NextResponse.json({
      success: true,
      recommendation: {
        decision: recommendation.recommendation,
        confidence: recommendation.confidence,
        score: recommendation.score,
        reasoning: recommendation.reasoning,
        key_factors: recommendation.key_factors,
        next_steps: recommendation.next_steps,
        alternative_recommendations: recommendation.alternative_recommendations,
      },
      mmi_confidence: consensusResult.confidence_score,
      mmi_explanation: consensusResult.explanation,
    })
  } catch (error: any) {
    console.error('Hiring recommendation error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


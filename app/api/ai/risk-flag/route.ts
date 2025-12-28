/**
 * Risk Flagging API
 * Uses Multi-Model Intelligence to identify potential risks in candidates or job postings
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { orchestrateMultiModel } from '@/lib/ai/orchestration/consensus'
import { getRiskFlaggingSystemPrompt, buildCandidateRiskPrompt, buildJobRiskPrompt } from '@/lib/ai/prompts/riskFlagging'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/risk-flag
 * Flag risks for a candidate-job match or a job posting
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

    const { type, candidate_id, job_id, job_data } = await request.json()

    if (!type || (type !== 'candidate' && type !== 'job')) {
      return NextResponse.json(
        { error: 'type must be "candidate" or "job"' },
        { status: 400 }
      )
    }

    let riskAnalysis: any = null
    let mmiConfidence: number | null = null
    let mmiExplanation: string | null = null

    if (type === 'candidate') {
      if (!candidate_id || !job_id) {
        return NextResponse.json(
          { error: 'candidate_id and job_id are required for candidate risk analysis' },
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

      const candidateData = {
        skills: (skills || []).map(s => s.skill_name),
        experience_level: candidateProfile.years_experience,
        location: candidateProfile.location,
        salary_min: candidateProfile.salary_expectation_min,
        salary_max: candidateProfile.salary_expectation_max,
        work_type_preference: candidateProfile.preferred_work_type,
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

      // Analyze risks using MMI
      const systemPrompt = getRiskFlaggingSystemPrompt()
      const prompt = buildCandidateRiskPrompt(candidateData, jobData)

      const consensusResult = await orchestrateMultiModel(
        'risk_flagging',
        prompt,
        systemPrompt,
        {
          timeout: 30000,
          requireAll: false,
          fallbackEnabled: true,
          jsonMode: true,
        }
      )

      if (consensusResult.consensus_output) {
        riskAnalysis = consensusResult.consensus_output
        mmiConfidence = consensusResult.confidence_score
        mmiExplanation = consensusResult.explanation
      }

    } else if (type === 'job') {
      if (!job_data && !job_id) {
        return NextResponse.json(
          { error: 'job_data or job_id is required for job risk analysis' },
          { status: 400 }
        )
      }

      let jobData: any

      if (job_id) {
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

        jobData = {
          role_title: job.role_title,
          required_skills: job.required_skills,
          role_level: job.role_level,
          location: job.location,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          work_type: job.work_type,
          job_description: job.job_description,
        }
      } else {
        jobData = job_data
      }

      // Analyze risks using MMI
      const systemPrompt = getRiskFlaggingSystemPrompt()
      const prompt = buildJobRiskPrompt(jobData)

      const consensusResult = await orchestrateMultiModel(
        'risk_flagging',
        prompt,
        systemPrompt,
        {
          timeout: 30000,
          requireAll: false,
          fallbackEnabled: true,
          jsonMode: true,
        }
      )

      if (consensusResult.consensus_output) {
        riskAnalysis = consensusResult.consensus_output
        mmiConfidence = consensusResult.confidence_score
        mmiExplanation = consensusResult.explanation
      }
    }

    if (!riskAnalysis) {
      return NextResponse.json(
        { error: 'Failed to analyze risks' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      type,
      risk_analysis: riskAnalysis,
      mmi_confidence: mmiConfidence,
      mmi_explanation: mmiExplanation,
    })
  } catch (error: any) {
    console.error('Risk flagging error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


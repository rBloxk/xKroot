/**
 * Assessment Integration with Matching System
 * Provides functions to get assessment scores for candidates
 */

import { supabaseAdmin } from '@/lib/supabase'
import { AssessmentType } from './types'

export interface CandidateAssessmentScores {
  technical?: number
  cultural_fit?: number
  communication?: number
  problem_solving?: number
  leadership?: number
  overall?: number // Average of all assessment scores
}

/**
 * Get latest assessment scores for a candidate
 */
export async function getCandidateAssessmentScores(
  candidateId: string
): Promise<CandidateAssessmentScores> {
  try {
    // Get latest assessment of each type
    const { data: assessments, error } = await supabaseAdmin
      .from('candidate_assessment')
      .select('assessment_type, score')
      .eq('candidate_id', candidateId)
      .not('score', 'is', null)
      .order('assessment_date', { ascending: false })

    if (error) {
      console.error('Error fetching assessment scores:', error)
      return {}
    }

    if (!assessments || assessments.length === 0) {
      return {}
    }

    // Get the latest score for each assessment type
    const scores: CandidateAssessmentScores = {}
    const seenTypes = new Set<string>()

    for (const assessment of assessments) {
      if (!seenTypes.has(assessment.assessment_type) && assessment.score !== null) {
        scores[assessment.assessment_type as AssessmentType] = parseFloat(assessment.score.toString())
        seenTypes.add(assessment.assessment_type)
      }
    }

    // Calculate overall average
    const scoreValues = Object.values(scores).filter(s => s !== undefined) as number[]
    if (scoreValues.length > 0) {
      scores.overall = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
    }

    return scores
  } catch (error) {
    console.error('Error in getCandidateAssessmentScores:', error)
    return {}
  }
}

/**
 * Get assessment score for a specific type
 */
export async function getAssessmentScore(
  candidateId: string,
  assessmentType: AssessmentType
): Promise<number | null> {
  try {
    const { data: assessment, error } = await supabaseAdmin
      .from('candidate_assessment')
      .select('score')
      .eq('candidate_id', candidateId)
      .eq('assessment_type', assessmentType)
      .not('score', 'is', null)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !assessment) {
      return null
    }

    return parseFloat(assessment.score.toString())
  } catch (error) {
    console.error('Error in getAssessmentScore:', error)
    return null
  }
}

/**
 * Enhance match score with assessment data
 * Assessments can boost or adjust match scores
 */
export function enhanceMatchScoreWithAssessments(
  baseScore: number,
  assessmentScores: CandidateAssessmentScores,
  jobRequirements?: {
    requiresTechnical?: boolean
    requiresCommunication?: boolean
    requiresLeadership?: boolean
  }
): {
  enhancedScore: number
  assessmentBoost: number
  assessmentFactors: string[]
} {
  let assessmentBoost = 0
  const assessmentFactors: string[] = []

  // Technical assessment boost (if job requires technical skills)
  if (jobRequirements?.requiresTechnical && assessmentScores.technical) {
    const boost = (assessmentScores.technical - 50) * 0.1 // Up to 5 points boost
    assessmentBoost += boost
    if (boost > 0) {
      assessmentFactors.push(`Technical assessment: ${assessmentScores.technical.toFixed(0)}%`)
    }
  }

  // Communication assessment boost
  if (jobRequirements?.requiresCommunication && assessmentScores.communication) {
    const boost = (assessmentScores.communication - 50) * 0.08 // Up to 4 points boost
    assessmentBoost += boost
    if (boost > 0) {
      assessmentFactors.push(`Communication assessment: ${assessmentScores.communication.toFixed(0)}%`)
    }
  }

  // Leadership assessment boost (if job requires leadership)
  if (jobRequirements?.requiresLeadership && assessmentScores.leadership) {
    const boost = (assessmentScores.leadership - 50) * 0.1 // Up to 5 points boost
    assessmentBoost += boost
    if (boost > 0) {
      assessmentFactors.push(`Leadership assessment: ${assessmentScores.leadership.toFixed(0)}%`)
    }
  }

  // Overall assessment boost (smaller, applies to all matches)
  if (assessmentScores.overall && assessmentScores.overall >= 70) {
    const boost = (assessmentScores.overall - 70) * 0.05 // Up to 1.5 points boost
    assessmentBoost += boost
    if (boost > 0) {
      assessmentFactors.push(`Overall assessment average: ${assessmentScores.overall.toFixed(0)}%`)
    }
  }

  // Cap the boost at 10 points
  assessmentBoost = Math.min(assessmentBoost, 10)

  const enhancedScore = Math.min(baseScore + assessmentBoost, 100)

  return {
    enhancedScore: Math.round(enhancedScore * 100) / 100,
    assessmentBoost: Math.round(assessmentBoost * 100) / 100,
    assessmentFactors,
  }
}


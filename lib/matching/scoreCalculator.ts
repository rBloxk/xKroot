/**
 * Hybrid Match Scoring Calculator
 * Combines deterministic and AI scoring with fail-safe fallback
 */

import { calculateDeterministicScore, CandidateData, JobData } from './deterministic'
import { calculateAIScore, combineScores } from './aiScoring'

export interface MatchScoreResult {
  finalScore: number // 0-100
  deterministicScore: number
  aiScore: number | null
  breakdown: {
    skillMatch: number
    experienceMatch: number
    locationMatch: number
    salaryMatch: number
    culturalFit?: number
    softSkills?: number
  }
  reasoning?: string
  strengths?: string[]
  concerns?: string[]
  skillMatchDetails: {
    matched: string[]
    missing: string[]
    extra: string[]
  }
}

/**
 * Calculate complete match score (deterministic + AI)
 * Always has deterministic fallback
 */
export async function calculateMatchScore(
  candidate: CandidateData,
  job: JobData
): Promise<MatchScoreResult> {
  // Step 1: Always calculate deterministic score (fail-safe)
  const deterministicResult = calculateDeterministicScore(candidate, job)

  // Step 2: Try to get AI enhancement (non-blocking)
  const aiResult = await calculateAIScore(candidate, job, deterministicResult)

  // Step 3: Combine scores
  const combined = combineScores(deterministicResult.totalScore, aiResult)

  // Build result
  const result: MatchScoreResult = {
    finalScore: combined.finalScore,
    deterministicScore: deterministicResult.totalScore,
    aiScore: aiResult.success ? combined.breakdown.aiEnhancement : null,
    breakdown: {
      skillMatch: deterministicResult.skillMatch,
      experienceMatch: deterministicResult.experienceMatch,
      locationMatch: deterministicResult.locationMatch,
      salaryMatch: deterministicResult.salaryMatch,
    },
    skillMatchDetails: deterministicResult.breakdown.skillMatchDetails,
  }

  // Add AI insights if available
  if (aiResult.success) {
    result.breakdown.culturalFit = combined.breakdown.culturalFit || undefined
    result.breakdown.softSkills = combined.breakdown.softSkills || undefined
    result.reasoning = aiResult.reasoning
    result.strengths = aiResult.strengths
    result.concerns = aiResult.concerns
  }

  return result
}


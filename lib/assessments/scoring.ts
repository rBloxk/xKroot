/**
 * Assessment Scoring Logic
 * Calculates scores, breakdowns, strengths, and recommendations
 */

import { AssessmentDefinition, AssessmentAnswer, AssessmentType, getAssessmentDefinition } from './types'

export interface AssessmentScoreResult {
  score: number // 0-100
  scoreBreakdown: Record<string, number>
  strengths: string[]
  areasForImprovement: string[]
  recommendations: string[]
}

/**
 * Score a single question answer
 */
function scoreQuestion(
  questionId: string,
  answer: string | number | string[],
  definition: AssessmentDefinition
): number {
  const question = definition.questions.find(q => q.id === questionId)
  if (!question) return 0

  // Rating questions: direct score (1-5 scale, convert to 0-100)
  if (question.type === 'rating' && typeof answer === 'number') {
    const max = question.max || 5
    const min = question.min || 1
    return ((answer - min) / (max - min)) * 100
  }

  // Multiple choice: score based on selections
  if (question.type === 'multiple_choice' && Array.isArray(answer)) {
    // More selections = higher score (up to a point)
    const maxSelections = question.options?.length || 10
    const score = Math.min((answer.length / Math.min(maxSelections, 5)) * 100, 100)
    return score
  }

  // Text/Textarea: score based on length and quality indicators
  if ((question.type === 'text' || question.type === 'textarea') && typeof answer === 'string') {
    const text = answer.trim()
    if (text.length === 0) return 0
    
    // Base score on length (50-200 words is ideal)
    const wordCount = text.split(/\s+/).length
    let lengthScore = 0
    if (wordCount < 10) lengthScore = 20
    else if (wordCount < 50) lengthScore = 50
    else if (wordCount <= 200) lengthScore = 90
    else lengthScore = 70 // Too long can be negative

    // Quality indicators (simple heuristics)
    const hasStructure = text.includes('.') || text.includes('\n')
    const hasDetails = wordCount > 20
    const qualityBonus = (hasStructure ? 5 : 0) + (hasDetails ? 5 : 0)

    return Math.min(lengthScore + qualityBonus, 100)
  }

  return 0
}

/**
 * Calculate overall assessment score
 */
export function calculateAssessmentScore(
  assessmentType: AssessmentType,
  answers: AssessmentAnswer[]
): AssessmentScoreResult {
  const definition = getAssessmentDefinition(assessmentType)
  const scoreBreakdown: Record<string, number> = {}
  const strengths: string[] = []
  const areasForImprovement: string[] = []
  const recommendations: string[] = []

  // Score each question
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const answer of answers) {
    const question = definition.questions.find(q => q.id === answer.questionId)
    if (!question) continue

    const questionScore = scoreQuestion(answer.questionId, answer.answer, definition)
    const weight = definition.scoringWeights?.[answer.questionId] || (1 / definition.questions.length)
    
    scoreBreakdown[answer.questionId] = questionScore
    totalWeightedScore += questionScore * weight
    totalWeight += weight

    // Generate insights based on scores
    if (questionScore >= 80) {
      strengths.push(`Strong performance in ${question.question.toLowerCase()}`)
    } else if (questionScore < 50) {
      areasForImprovement.push(`Consider improving ${question.question.toLowerCase()}`)
    }
  }

  // Calculate overall score
  const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0
  const finalScore = Math.round(overallScore * 100) / 100

  // Generate recommendations based on overall score
  if (finalScore >= 80) {
    recommendations.push('Excellent performance! Continue building on your strengths.')
    recommendations.push('Consider taking on more challenging projects to further develop your skills.')
  } else if (finalScore >= 60) {
    recommendations.push('Good performance with room for improvement.')
    recommendations.push('Focus on the areas identified for improvement.')
    recommendations.push('Consider seeking mentorship or additional training.')
  } else {
    recommendations.push('Focus on fundamental skills development.')
    recommendations.push('Consider structured learning programs or courses.')
    recommendations.push('Practice regularly to improve your performance.')
  }

  // Add type-specific recommendations
  if (assessmentType === 'technical') {
    if (finalScore < 60) {
      recommendations.push('Practice coding regularly on platforms like LeetCode or HackerRank.')
      recommendations.push('Build personal projects to demonstrate your skills.')
    }
  } else if (assessmentType === 'communication') {
    if (finalScore < 60) {
      recommendations.push('Practice public speaking and presentation skills.')
      recommendations.push('Join communities or groups focused on communication.')
    }
  } else if (assessmentType === 'leadership') {
    if (finalScore < 60) {
      recommendations.push('Seek opportunities to lead small projects or initiatives.')
      recommendations.push('Find a mentor with leadership experience.')
    }
  }

  return {
    score: finalScore,
    scoreBreakdown,
    strengths,
    areasForImprovement,
    recommendations,
  }
}

/**
 * Generate AI-enhanced scoring (placeholder for future MMI integration)
 * For now, uses deterministic scoring with AI-like insights
 */
export async function calculateAIAssessmentScore(
  assessmentType: AssessmentType,
  answers: AssessmentAnswer[]
): Promise<AssessmentScoreResult> {
  // For Phase 3, use deterministic scoring
  // In Phase 4+, this will use Multi-Model Intelligence
  const baseResult = calculateAssessmentScore(assessmentType, answers)

  // Enhance with AI-like insights (simulated for now)
  // In future, this will call the MMI system
  const enhancedStrengths = [...baseResult.strengths]
  const enhancedRecommendations = [...baseResult.recommendations]

  // Add contextual insights based on answer patterns
  const textAnswers = answers.filter(a => typeof a.answer === 'string' && a.answer.length > 50)
  if (textAnswers.length >= 3) {
    enhancedStrengths.push('Demonstrates strong communication through detailed responses')
  }

  return {
    ...baseResult,
    strengths: enhancedStrengths,
    recommendations: enhancedRecommendations,
  }
}


/**
 * Explainability Engine
 * Generates human-readable explanations for AI decisions
 */

import { ConsensusResult, ModelName } from '../types'
import { JudgeScores } from '../types'

export interface Explanation {
  summary: string
  confidence: {
    level: 'high' | 'medium' | 'low'
    score: number
    reasoning: string
  }
  modelContributions: Array<{
    model: ModelName
    score?: number
    insight: string
    contribution: string
  }>
  decision: {
    method: string
    reasoning: string
    recommendation: string
  }
  details: string[]
}

/**
 * Generate explanation from consensus result
 */
export function generateExplanation(consensus: ConsensusResult): Explanation {
  const confidence = {
    level: consensus.confidence_level,
    score: consensus.confidence_score,
    reasoning: getConfidenceReasoning(consensus),
  }

  const modelContributions = generateModelContributions(consensus)
  const decision = generateDecisionExplanation(consensus)
  const summary = generateSummary(consensus, confidence, decision)

  return {
    summary,
    confidence,
    modelContributions,
    decision,
    details: generateDetails(consensus),
  }
}

/**
 * Generate summary explanation
 */
function generateSummary(
  consensus: ConsensusResult,
  confidence: { level: string; score: number; reasoning: string },
  decision: { method: string; reasoning: string; recommendation: string }
): string {
  const taskTypeLabel = getTaskTypeLabel(consensus.task_type)
  
  return `${taskTypeLabel} completed with ${confidence.level} confidence (${(confidence.score * 100).toFixed(0)}%). ${decision.recommendation}`
}

/**
 * Get confidence reasoning
 */
function getConfidenceReasoning(consensus: ConsensusResult): string {
  const agreement = consensus.model_agreement || 0
  const confidence = consensus.confidence_score

  if (confidence >= 0.8) {
    if (agreement >= 0.8) {
      return 'Models are in strong agreement, indicating high reliability'
    } else {
      return 'High confidence despite some model disagreement, indicating robust consensus'
    }
  } else if (confidence >= 0.6) {
    if (agreement >= 0.6) {
      return 'Models show moderate agreement, providing reasonable confidence'
    } else {
      return 'Moderate confidence with some model disagreement, suggesting careful consideration'
    }
  } else {
    if (agreement < 0.5) {
      return 'Models show significant disagreement, indicating uncertainty'
    } else {
      return 'Low confidence due to model uncertainty or quality concerns'
    }
  }
}

/**
 * Generate model contributions
 */
function generateModelContributions(consensus: ConsensusResult): Array<{
  model: ModelName
  score?: number
  insight: string
  contribution: string
}> {
  const contributions: Array<{
    model: ModelName
    score?: number
    insight: string
    contribution: string
  }> = []

  // Get judge scores if available
  const judgeScores = consensus.judge_scores || {}

  // For each model run, generate contribution
  // Note: We'd need to fetch model runs to get individual outputs
  // For now, use judge scores if available
  Object.entries(judgeScores).forEach(([modelName, score]) => {
    const model = modelName as ModelName
    contributions.push({
      model,
      score: typeof score === 'number' ? score : undefined,
      insight: getModelInsight(model, score),
      contribution: getModelContribution(model, score),
    })
  })

  // If no judge scores, provide generic contributions
  if (contributions.length === 0) {
    const modelNames: ModelName[] = ['gpt-4', 'claude-3', 'gemini-pro']
    modelNames.forEach(model => {
      contributions.push({
        model,
        insight: getModelInsight(model),
        contribution: getModelContribution(model),
      })
    })
  }

  return contributions
}

/**
 * Get model-specific insight
 */
function getModelInsight(model: ModelName, score?: number): string {
  const scoreText = score !== undefined ? ` (score: ${score.toFixed(0)})` : ''
  
  switch (model) {
    case 'gpt-4':
      return `GPT-4${scoreText} - Strong technical reasoning and structured analysis`
    case 'claude-3':
      return `Claude${scoreText} - Deep analysis with safety and nuance considerations`
    case 'gemini-pro':
      return `Gemini${scoreText} - Broad system thinking and pattern recognition`
    default:
      return `${model}${scoreText} - AI model analysis`
  }
}

/**
 * Get model-specific contribution
 */
function getModelContribution(model: ModelName, score?: number): string {
  if (score !== undefined) {
    if (score >= 80) {
      return 'Provided high-quality analysis with strong confidence'
    } else if (score >= 60) {
      return 'Provided good analysis with reasonable confidence'
    } else {
      return 'Provided analysis but with some limitations'
    }
  }

  switch (model) {
    case 'gpt-4':
      return 'Contributed structured reasoning and logical analysis'
    case 'claude-3':
      return 'Contributed nuanced insights with risk awareness'
    case 'gemini-pro':
      return 'Contributed broad perspective and system-level thinking'
    default:
      return 'Contributed to consensus analysis'
  }
}

/**
 * Generate decision explanation
 */
function generateDecisionExplanation(consensus: ConsensusResult): {
  method: string
  reasoning: string
  recommendation: string
} {
  const method = getConsensusMethodLabel(consensus.consensus_method)
  const reasoning = consensus.explanation || 'Consensus reached through multi-model analysis'
  
  let recommendation = ''
  if (consensus.confidence_level === 'high') {
    recommendation = 'High confidence in this result. Proceed with confidence.'
  } else if (consensus.confidence_level === 'medium') {
    recommendation = 'Moderate confidence. Consider additional verification if critical.'
  } else {
    recommendation = 'Low confidence. Review carefully and consider manual verification.'
  }

  return {
    method,
    reasoning,
    recommendation,
  }
}

/**
 * Generate detailed explanation points
 */
function generateDetails(consensus: ConsensusResult): string[] {
  const details: string[] = []

  // Agreement details
  if (consensus.model_agreement !== undefined) {
    const agreementPercent = (consensus.model_agreement * 100).toFixed(0)
    if (consensus.model_agreement >= 0.8) {
      details.push(`Models agreed ${agreementPercent}% - Strong consensus`)
    } else if (consensus.model_agreement >= 0.6) {
      details.push(`Models agreed ${agreementPercent}% - Moderate consensus`)
    } else {
      details.push(`Models agreed ${agreementPercent}% - Some disagreement`)
    }
  }

  // Method details
  details.push(`Consensus method: ${getConsensusMethodLabel(consensus.consensus_method)}`)

  // Fallback details
  if (consensus.fallback_used) {
    details.push('Some models failed and were excluded from consensus')
  }

  // Judge scores details
  if (consensus.judge_scores && Object.keys(consensus.judge_scores).length > 0) {
    const scores = Object.values(consensus.judge_scores) as number[]
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    details.push(`Average model quality: ${avgScore.toFixed(0)}/100`)
  }

  return details
}

/**
 * Get task type label
 */
function getTaskTypeLabel(taskType: string): string {
  const labels: Record<string, string> = {
    skill_extraction: 'Skill extraction',
    role_clarity: 'Role clarity analysis',
    match_reasoning: 'Match reasoning',
    assessment_scoring: 'Assessment scoring',
    cultural_fit: 'Cultural fit analysis',
  }
  return labels[taskType] || taskType.replace(/_/g, ' ')
}

/**
 * Get consensus method label
 */
function getConsensusMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    highest_score: 'Best Model Selection',
    merge: 'Intelligent Merge',
    weighted_average: 'Weighted Average',
    judge_selection: 'Judge-Selected Best',
  }
  return labels[method] || method.replace(/_/g, ' ')
}

/**
 * Format explanation for display
 */
export function formatExplanationForDisplay(explanation: Explanation): string {
  let formatted = `${explanation.summary}\n\n`
  
  formatted += `Confidence: ${explanation.confidence.level.toUpperCase()} (${(explanation.confidence.score * 100).toFixed(0)}%)\n`
  formatted += `${explanation.confidence.reasoning}\n\n`
  
  if (explanation.modelContributions.length > 0) {
    formatted += `Model Contributions:\n`
    explanation.modelContributions.forEach(contrib => {
      formatted += `- ${contrib.insight}\n`
      formatted += `  ${contrib.contribution}\n`
    })
    formatted += `\n`
  }
  
  formatted += `Decision: ${explanation.decision.method}\n`
  formatted += `${explanation.decision.reasoning}\n`
  formatted += `Recommendation: ${explanation.decision.recommendation}\n`
  
  if (explanation.details.length > 0) {
    formatted += `\nDetails:\n`
    explanation.details.forEach(detail => {
      formatted += `- ${detail}\n`
    })
  }
  
  return formatted
}


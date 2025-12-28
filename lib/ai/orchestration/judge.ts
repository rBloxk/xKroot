/**
 * AI Judge / Arbitration Layer
 * Scores model outputs and determines the best result
 * This is xKroot's "brain" - deterministic, not AI-based
 */

import { ModelResponse, JudgeScores, ModelName } from '../types'

export interface JudgeResult {
  scores: Record<string, JudgeScores> // Model name -> scores
  bestModel?: string // Model with highest overall score
  recommendation: 'use_best' | 'merge' | 'reject_all'
  reasoning: string
}

/**
 * Judge model outputs
 * Scores each output on multiple criteria
 */
export function judgeModelOutputs(
  modelOutputs: Array<{ modelName: ModelName; output: any; response: ModelResponse }>
): JudgeResult {
  if (modelOutputs.length === 0) {
    return {
      scores: {},
      recommendation: 'reject_all',
      reasoning: 'No model outputs to judge',
    }
  }

  if (modelOutputs.length === 1) {
    const single = modelOutputs[0]
    const scores = scoreOutput(single.output, single.response)
    return {
      scores: { [single.modelName]: scores },
      bestModel: single.modelName,
      recommendation: 'use_best',
      reasoning: 'Only one model output available',
    }
  }

  // Score all outputs
  const allScores: Record<string, JudgeScores> = {}
  for (const modelOutput of modelOutputs) {
    allScores[modelOutput.modelName] = scoreOutput(modelOutput.output, modelOutput.response)
  }

  // Find best model
  const bestModel = Object.entries(allScores)
    .sort(([, a], [, b]) => b.overall - a.overall)[0]?.[0]

  // Determine recommendation
  const bestScore = allScores[bestModel!]?.overall || 0
  const averageScore = Object.values(allScores).reduce((sum, s) => sum + s.overall, 0) / modelOutputs.length
  const scoreVariance = calculateVariance(Object.values(allScores).map(s => s.overall))

  let recommendation: 'use_best' | 'merge' | 'reject_all'
  let reasoning: string

  if (bestScore < 50) {
    // All outputs are poor quality
    recommendation = 'reject_all'
    reasoning = 'All model outputs scored below acceptable threshold (50)'
  } else if (scoreVariance < 10 && bestScore >= 70) {
    // Models agree and are confident
    recommendation = 'use_best'
    reasoning = `Models are in strong agreement (variance: ${scoreVariance.toFixed(1)}). Best model: ${bestModel}`
  } else if (scoreVariance < 20 && bestScore >= 60) {
    // Models mostly agree
    recommendation = 'use_best'
    reasoning = `Models are in good agreement (variance: ${scoreVariance.toFixed(1)}). Best model: ${bestModel}`
  } else if (bestScore >= 60) {
    // Models disagree but best is good
    recommendation = 'merge'
    reasoning = `Models disagree (variance: ${scoreVariance.toFixed(1)}), but best model is strong. Recommend merging.`
  } else {
    // Low scores or high variance
    recommendation = 'merge'
    reasoning = `Models show disagreement (variance: ${scoreVariance.toFixed(1)}). Merging outputs for consensus.`
  }

  return {
    scores: allScores,
    bestModel,
    recommendation,
    reasoning,
  }
}

/**
 * Score a single model output
 */
function scoreOutput(output: any, response: ModelResponse): JudgeScores {
  const logicalConsistency = scoreLogicalConsistency(output)
  const completeness = scoreCompleteness(output)
  const riskAwareness = scoreRiskAwareness(output)
  const overconfidence = scoreOverconfidence(output, response)

  // Overall score: weighted average
  // Logical consistency: 30%, Completeness: 25%, Risk awareness: 25%, Overconfidence: 20% (inverted)
  const overall = (
    logicalConsistency * 0.3 +
    completeness * 0.25 +
    riskAwareness * 0.25 +
    (100 - overconfidence) * 0.2
  )

  return {
    logicalConsistency,
    completeness,
    riskAwareness,
    overconfidence,
    overall: Math.round(overall * 100) / 100,
  }
}

/**
 * Score logical consistency
 * Checks if output is internally consistent and makes logical sense
 */
function scoreLogicalConsistency(output: any): number {
  if (!output || typeof output !== 'object') {
    return 0
  }

  let score = 50 // Base score

  // Check for contradictions
  const contradictions = detectContradictions(output)
  score -= contradictions * 10

  // Check for logical structure
  if (Array.isArray(output)) {
    // Arrays should have consistent structure
    const hasConsistentStructure = output.every(item => 
      typeof item === typeof output[0]
    )
    if (hasConsistentStructure) score += 20
  } else if (typeof output === 'object') {
    // Objects should have required fields
    const hasRequiredFields = checkRequiredFields(output)
    if (hasRequiredFields) score += 20

    // Check for type consistency
    const typeConsistency = checkTypeConsistency(output)
    score += typeConsistency * 10
  }

  // Check for null/undefined values (reduces consistency)
  const nullCount = countNullValues(output)
  score -= nullCount * 5

  return Math.min(Math.max(score, 0), 100)
}

/**
 * Score completeness
 * Checks if output contains all expected information
 */
function scoreCompleteness(output: any): number {
  if (!output || typeof output !== 'object') {
    return 0
  }

  let score = 50 // Base score

  if (Array.isArray(output)) {
    // Arrays should have items
    if (output.length > 0) score += 30
    if (output.length >= 3) score += 20 // More items = more complete
  } else if (typeof output === 'object') {
    // Objects should have multiple fields
    const fieldCount = Object.keys(output).length
    if (fieldCount > 0) score += 20
    if (fieldCount >= 3) score += 20
    if (fieldCount >= 5) score += 10

    // Check for nested data (indicates depth)
    const hasNestedData = Object.values(output).some(v => 
      typeof v === 'object' && v !== null
    )
    if (hasNestedData) score += 10
  }

  // Check for empty strings or null values (reduces completeness)
  const emptyCount = countEmptyValues(output)
  score -= emptyCount * 5

  return Math.min(Math.max(score, 0), 100)
}

/**
 * Score risk awareness
 * Checks if output acknowledges risks, uncertainties, or edge cases
 */
function scoreRiskAwareness(output: any): number {
  if (!output || typeof output !== 'object') {
    return 30 // Low score for invalid output
  }

  let score = 50 // Base score

  // Check for risk-related keywords in string values
  const riskKeywords = ['risk', 'uncertain', 'may', 'might', 'consider', 'caution', 'warning', 'edge case', 'limitation']
  const outputString = JSON.stringify(output).toLowerCase()
  
  const riskKeywordCount = riskKeywords.filter(keyword => 
    outputString.includes(keyword)
  ).length

  score += riskKeywordCount * 5

  // Check for confidence scores or uncertainty indicators
  if (typeof output === 'object') {
    const hasConfidenceField = 'confidence' in output || 'uncertainty' in output || 'risk' in output
    if (hasConfidenceField) score += 20

    // Check if confidence values are reasonable (not overconfident)
    if ('confidence' in output) {
      const confidence = output.confidence
      if (typeof confidence === 'number') {
        if (confidence >= 50 && confidence <= 90) {
          score += 10 // Reasonable confidence
        } else if (confidence > 95) {
          score -= 10 // Overconfident
        }
      }
    }
  }

  return Math.min(Math.max(score, 0), 100)
}

/**
 * Score overconfidence
 * Lower is better - checks if output is overconfident
 */
function scoreOverconfidence(output: any, response: ModelResponse): number {
  let score = 50 // Base score (neutral)

  // Check model's own confidence if provided
  if (response.confidenceScore !== undefined) {
    if (response.confidenceScore > 0.95) {
      score += 30 // Overconfident
    } else if (response.confidenceScore > 0.85) {
      score += 15 // Somewhat overconfident
    } else if (response.confidenceScore < 0.5) {
      score -= 10 // Underconfident (also not ideal)
    }
  }

  // Check output for overconfident language
  const outputString = JSON.stringify(output).toLowerCase()
  const overconfidentPhrases = ['definitely', 'certainly', 'always', 'never', 'guaranteed', '100%', 'perfect']
  const phraseCount = overconfidentPhrases.filter(phrase => 
    outputString.includes(phrase)
  ).length

  score += phraseCount * 5

  // Check for absolute statements without qualifiers
  if (typeof output === 'object' && !Array.isArray(output)) {
    const hasQualifiers = outputString.includes('may') || 
                         outputString.includes('might') || 
                         outputString.includes('could') ||
                         outputString.includes('likely')
    if (!hasQualifiers && Object.keys(output).length > 0) {
      score += 10 // No qualifiers = potentially overconfident
    }
  }

  return Math.min(Math.max(score, 0), 100)
}

/**
 * Detect contradictions in output
 */
function detectContradictions(output: any): number {
  if (!output || typeof output !== 'object') return 0

  let contradictions = 0

  // Check for conflicting boolean values
  if (typeof output === 'object' && !Array.isArray(output)) {
    const keys = Object.keys(output)
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const key1 = keys[i].toLowerCase()
        const key2 = keys[j].toLowerCase()
        
        // Check for common contradictions
        if ((key1.includes('yes') && key2.includes('no')) ||
            (key1.includes('no') && key2.includes('yes')) ||
            (key1.includes('true') && key2.includes('false')) ||
            (key1.includes('false') && key2.includes('true'))) {
          contradictions++
        }
      }
    }
  }

  return contradictions
}

/**
 * Check if output has required fields (for structured outputs)
 */
function checkRequiredFields(output: any): boolean {
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return false
  }

  // Common required fields for different task types
  const commonFields = ['skills', 'results', 'output', 'data', 'items']
  return commonFields.some(field => field in output)
}

/**
 * Check type consistency in output
 */
function checkTypeConsistency(output: any): number {
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return 0
  }

  const values = Object.values(output)
  if (values.length === 0) return 0

  // Check if all values are the same type
  const firstType = typeof values[0]
  const sameTypeCount = values.filter(v => typeof v === firstType).length
  return sameTypeCount / values.length
}

/**
 * Count null/undefined values
 */
function countNullValues(output: any): number {
  if (!output) return 1

  if (Array.isArray(output)) {
    return output.filter(item => item === null || item === undefined).length
  }

  if (typeof output === 'object') {
    return Object.values(output).filter(v => v === null || v === undefined).length
  }

  return 0
}

/**
 * Count empty values
 */
function countEmptyValues(output: any): number {
  if (!output) return 1

  if (Array.isArray(output)) {
    return output.filter(item => 
      item === null || 
      item === undefined || 
      item === '' ||
      (typeof item === 'object' && Object.keys(item).length === 0)
    ).length
  }

  if (typeof output === 'object') {
    return Object.values(output).filter(v => 
      v === null || 
      v === undefined || 
      v === '' ||
      (typeof v === 'object' && Object.keys(v).length === 0)
    ).length
  }

  return 0
}

/**
 * Calculate variance of scores
 */
function calculateVariance(scores: number[]): number {
  if (scores.length === 0) return 0

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length

  return variance
}


/**
 * Consensus Scoring Logic
 * Calculates confidence scores and agreement metrics
 */

import { ModelResponse } from '../types'
import { JudgeScores } from '../types'

export interface ConsensusScore {
  agreement: number // 0.0 to 1.0 - how much models agree
  confidence: number // 0.0 to 1.0 - overall confidence
  quality: number // 0-100 - average quality of outputs
  reliability: number // 0.0 to 1.0 - how reliable the consensus is
}

/**
 * Calculate consensus score from model outputs and judge scores
 */
export function calculateConsensusScore(
  outputs: any[],
  judgeScores: Record<string, JudgeScores>,
  successfulCount: number,
  totalCount: number
): ConsensusScore {
  // Calculate agreement
  const agreement = calculateAgreement(outputs)

  // Calculate average quality from judge scores
  const qualityScores = Object.values(judgeScores).map(s => s.overall)
  const quality = qualityScores.length > 0
    ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
    : 50

  // Calculate reliability (based on success rate and quality)
  const successRate = successfulCount / totalCount
  const reliability = (successRate * 0.4) + (quality / 100 * 0.6)

  // Calculate confidence (combination of agreement and quality)
  const confidence = (agreement * 0.6) + (quality / 100 * 0.4)

  return {
    agreement: Math.round(agreement * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
    quality: Math.round(quality * 100) / 100,
    reliability: Math.round(reliability * 1000) / 1000,
  }
}

/**
 * Calculate agreement between model outputs
 */
export function calculateAgreement(outputs: any[]): number {
  if (outputs.length < 2) return 1.0

  // Compare outputs for similarity
  const similarities: number[] = []

  for (let i = 0; i < outputs.length; i++) {
    for (let j = i + 1; j < outputs.length; j++) {
      const similarity = calculateSimilarity(outputs[i], outputs[j])
      similarities.push(similarity)
    }
  }

  if (similarities.length === 0) return 0.5

  // Average similarity
  const averageSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length
  return averageSimilarity
}

/**
 * Calculate similarity between two outputs
 */
function calculateSimilarity(output1: any, output2: any): number {
  // Exact match
  if (JSON.stringify(output1) === JSON.stringify(output2)) {
    return 1.0
  }

  // Type mismatch
  if (typeof output1 !== typeof output2) {
    return 0.0
  }

  // Numeric similarity
  if (typeof output1 === 'number' && typeof output2 === 'number') {
    const diff = Math.abs(output1 - output2)
    const max = Math.max(Math.abs(output1), Math.abs(output2), 1)
    return Math.max(0, 1 - (diff / max))
  }

  // String similarity
  if (typeof output1 === 'string' && typeof output2 === 'string') {
    return stringSimilarity(output1, output2)
  }

  // Array similarity
  if (Array.isArray(output1) && Array.isArray(output2)) {
    return arraySimilarity(output1, output2)
  }

  // Object similarity
  if (typeof output1 === 'object' && typeof output2 === 'object') {
    return objectSimilarity(output1, output2)
  }

  // Boolean similarity
  if (typeof output1 === 'boolean' && typeof output2 === 'boolean') {
    return output1 === output2 ? 1.0 : 0.0
  }

  return 0.5 // Default similarity for unknown types
}

/**
 * Calculate string similarity (simple Jaccard-like)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0
  if (str1.length === 0 || str2.length === 0) return 0.0

  // Simple word-based similarity
  const words1 = new Set(str1.toLowerCase().split(/\s+/))
  const words2 = new Set(str2.toLowerCase().split(/\s+/))

  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])

  return union.size > 0 ? intersection.size / union.size : 0.0
}

/**
 * Calculate array similarity
 */
function arraySimilarity(arr1: any[], arr2: any[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1.0
  if (arr1.length === 0 || arr2.length === 0) return 0.0

  // Compare items
  const similarities: number[] = []
  const maxLen = Math.max(arr1.length, arr2.length)

  for (let i = 0; i < maxLen; i++) {
    const item1 = arr1[i]
    const item2 = arr2[i]

    if (item1 === undefined || item2 === undefined) {
      similarities.push(0.0)
    } else {
      similarities.push(calculateSimilarity(item1, item2))
    }
  }

  return similarities.reduce((a, b) => a + b, 0) / similarities.length
}

/**
 * Calculate object similarity
 */
function objectSimilarity(obj1: any, obj2: any): number {
  const keys1 = new Set(Object.keys(obj1))
  const keys2 = new Set(Object.keys(obj2))

  if (keys1.size === 0 && keys2.size === 0) return 1.0
  if (keys1.size === 0 || keys2.size === 0) return 0.0

  // Key overlap
  const keyIntersection = new Set([...keys1].filter(k => keys2.has(k)))
  const keyUnion = new Set([...keys1, ...keys2])
  const keySimilarity = keyUnion.size > 0 ? keyIntersection.size / keyUnion.size : 0.0

  // Value similarity for common keys
  const valueSimilarities: number[] = []
  keyIntersection.forEach(key => {
    valueSimilarities.push(calculateSimilarity(obj1[key], obj2[key]))
  })

  const valueSimilarity = valueSimilarities.length > 0
    ? valueSimilarities.reduce((a, b) => a + b, 0) / valueSimilarities.length
    : 0.0

  // Combined: 40% key similarity, 60% value similarity
  return (keySimilarity * 0.4) + (valueSimilarity * 0.6)
}

/**
 * Get confidence level from confidence score
 */
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}


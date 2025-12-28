/**
 * Merge Logic for Combining Model Outputs
 * Intelligently merges outputs from multiple models
 */

import { ModelName } from '../types'
import { JudgeScores } from '../types'

export interface MergeOptions {
  judgeScores?: Record<string, JudgeScores>
  weights?: Record<string, number> // Model name -> weight
  strategy?: 'weighted_average' | 'best_model' | 'selective_merge' | 'union'
}

/**
 * Merge model outputs into consensus
 */
export function mergeModelOutputs(
  outputs: Array<{ modelName: ModelName; output: any }>,
  options: MergeOptions = {}
): any {
  if (outputs.length === 0) return {}
  if (outputs.length === 1) return outputs[0].output

  const strategy = options.strategy || 'selective_merge'

  switch (strategy) {
    case 'best_model':
      return mergeBestModel(outputs, options)
    case 'weighted_average':
      return mergeWeightedAverage(outputs, options)
    case 'selective_merge':
      return mergeSelective(outputs, options)
    case 'union':
      return mergeUnion(outputs, options)
    default:
      return mergeSelective(outputs, options)
  }
}

/**
 * Merge using best model (highest judge score)
 */
function mergeBestModel(
  outputs: Array<{ modelName: ModelName; output: any }>,
  options: MergeOptions
): any {
  if (!options.judgeScores || Object.keys(options.judgeScores).length === 0) {
    // No judge scores, use first output
    return outputs[0].output
  }

  // Find model with highest overall score
  const bestModel = Object.entries(options.judgeScores)
    .sort(([, a], [, b]) => b.overall - a.overall)[0]?.[0]

  const bestOutput = outputs.find(o => o.modelName === bestModel)
  return bestOutput?.output || outputs[0].output
}

/**
 * Merge using weighted average (for numeric outputs)
 */
function mergeWeightedAverage(
  outputs: Array<{ modelName: ModelName; output: any }>,
  options: MergeOptions
): any {
  // Calculate weights from judge scores or use provided weights
  const weights = calculateWeights(outputs, options)

  // Only works for numeric outputs or objects with numeric values
  if (typeof outputs[0].output === 'number') {
    return weightedAverageNumbers(
      outputs.map(o => o.output),
      Object.values(weights)
    )
  }

  if (typeof outputs[0].output === 'object' && !Array.isArray(outputs[0].output)) {
    return weightedAverageObject(outputs, weights)
  }

  // Fallback to selective merge for non-numeric
  return mergeSelective(outputs, options)
}

/**
 * Merge selectively - take best parts from each model
 */
function mergeSelective(
  outputs: Array<{ modelName: ModelName; output: any }>,
  options: MergeOptions
): any {
  const weights = calculateWeights(outputs, options)

  if (Array.isArray(outputs[0].output)) {
    return mergeArrays(outputs, weights)
  }

  if (typeof outputs[0].output === 'object') {
    return mergeObjects(outputs, weights)
  }

  // For primitives, use weighted average if numeric
  if (typeof outputs[0].output === 'number') {
    return weightedAverageNumbers(
      outputs.map(o => o.output),
      Object.values(weights)
    )
  }

  // For strings or other types, use best model
  return mergeBestModel(outputs, options)
}

/**
 * Merge using union (combine all unique items)
 */
function mergeUnion(
  outputs: Array<{ modelName: ModelName; output: any }>,
  options: MergeOptions
): any {
  if (Array.isArray(outputs[0].output)) {
    // Union of arrays
    const union = new Set<string>()
    outputs.forEach(({ output }) => {
      if (Array.isArray(output)) {
        output.forEach(item => union.add(JSON.stringify(item)))
      }
    })
    return Array.from(union).map(item => JSON.parse(item))
  }

  if (typeof outputs[0].output === 'object') {
    // Union of object keys
    const merged: any = {}
    outputs.forEach(({ output }) => {
      if (typeof output === 'object') {
        Object.assign(merged, output)
      }
    })
    return merged
  }

  // Fallback
  return outputs[0].output
}

/**
 * Merge arrays intelligently
 */
function mergeArrays(
  outputs: Array<{ modelName: ModelName; output: any }>,
  weights: Record<string, number>
): any[] {
  // Collect all items with their source weights
  const itemMap = new Map<string, { item: any; weight: number }>()

  outputs.forEach(({ modelName, output }) => {
    if (Array.isArray(output)) {
      const weight = weights[modelName] || 1
      output.forEach(item => {
        const key = JSON.stringify(item)
        const existing = itemMap.get(key)
        if (!existing || weight > existing.weight) {
          itemMap.set(key, { item, weight })
        }
      })
    }
  })

  // Sort by weight and return items
  return Array.from(itemMap.values())
    .sort((a, b) => b.weight - a.weight)
    .map(({ item }) => item)
}

/**
 * Merge objects intelligently
 */
function mergeObjects(
  outputs: Array<{ modelName: ModelName; output: any }>,
  weights: Record<string, number>
): any {
  const merged: any = {}
  const allKeys = new Set<string>()

  // Collect all keys
  outputs.forEach(({ output }) => {
    if (typeof output === 'object' && !Array.isArray(output)) {
      Object.keys(output).forEach(key => allKeys.add(key))
    }
  })

  // For each key, choose best value based on weights
  allKeys.forEach(key => {
    const candidates: Array<{ value: any; weight: number }> = []

    outputs.forEach(({ modelName, output }) => {
      if (typeof output === 'object' && !Array.isArray(output) && key in output) {
        const weight = weights[modelName] || 1
        candidates.push({ value: output[key], weight })
      }
    })

    if (candidates.length > 0) {
      // If all values are the same, use that
      const firstValue = JSON.stringify(candidates[0].value)
      if (candidates.every(c => JSON.stringify(c.value) === firstValue)) {
        merged[key] = candidates[0].value
      } else {
        // Use value from highest-weighted model
        const best = candidates.sort((a, b) => b.weight - a.weight)[0]
        merged[key] = best.value

        // For numeric values, use weighted average
        if (typeof candidates[0].value === 'number') {
          const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
          const weightedSum = candidates.reduce((sum, c) => sum + (c.value * c.weight), 0)
          merged[key] = totalWeight > 0 ? weightedSum / totalWeight : candidates[0].value
        }
      }
    }
  })

  return merged
}

/**
 * Calculate weights from judge scores or use provided weights
 */
function calculateWeights(
  outputs: Array<{ modelName: ModelName; output: any }>,
  options: MergeOptions
): Record<string, number> {
  // Use provided weights if available
  if (options.weights) {
    return options.weights
  }

  // Calculate from judge scores
  if (options.judgeScores && Object.keys(options.judgeScores).length > 0) {
    const weights: Record<string, number> = {}
    const totalScore = Object.values(options.judgeScores).reduce(
      (sum, scores) => sum + scores.overall,
      0
    )

    if (totalScore > 0) {
      Object.entries(options.judgeScores).forEach(([modelName, scores]) => {
        weights[modelName] = scores.overall / totalScore
      })
    } else {
      // Equal weights if all scores are 0
      outputs.forEach(({ modelName }) => {
        weights[modelName] = 1 / outputs.length
      })
    }

    return weights
  }

  // Default: equal weights
  const equalWeight = 1 / outputs.length
  const weights: Record<string, number> = {}
  outputs.forEach(({ modelName }) => {
    weights[modelName] = equalWeight
  })

  return weights
}

/**
 * Weighted average of numbers
 */
function weightedAverageNumbers(numbers: number[], weights: number[]): number {
  if (numbers.length !== weights.length) {
    // Use equal weights if mismatch
    const sum = numbers.reduce((a, b) => a + b, 0)
    return sum / numbers.length
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (totalWeight === 0) {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
  }

  const weightedSum = numbers.reduce((sum, num, i) => sum + (num * weights[i]), 0)
  return weightedSum / totalWeight
}

/**
 * Weighted average of object values
 */
function weightedAverageObject(
  outputs: Array<{ modelName: ModelName; output: any }>,
  weights: Record<string, number>
): any {
  const merged: any = {}
  const allKeys = new Set<string>()

  outputs.forEach(({ output }) => {
    if (typeof output === 'object' && !Array.isArray(output)) {
      Object.keys(output).forEach(key => allKeys.add(key))
    }
  })

  allKeys.forEach(key => {
    const values: Array<{ value: any; weight: number }> = []

    outputs.forEach(({ modelName, output }) => {
      if (typeof output === 'object' && !Array.isArray(output) && key in output) {
        const weight = weights[modelName] || 1
        values.push({ value: output[key], weight })
      }
    })

    if (values.length > 0) {
      if (typeof values[0].value === 'number') {
        merged[key] = weightedAverageNumbers(
          values.map(v => v.value),
          values.map(v => v.weight)
        )
      } else {
        // For non-numeric, use value from highest-weighted model
        const best = values.sort((a, b) => b.weight - a.weight)[0]
        merged[key] = best.value
      }
    }
  })

  return merged
}


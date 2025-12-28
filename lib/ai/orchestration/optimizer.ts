/**
 * AI Orchestration Optimizer
 * Optimizes cost, performance, and quality
 */

import { ModelName, TaskType } from '../types'
import { ModelResponse } from '../types'

export interface OptimizationMetrics {
  costUsd: number
  totalTokens: number
  avgLatencyMs: number
  successRate: number
  qualityScore: number
}

export interface OptimizationResult {
  optimized: boolean
  metrics: OptimizationMetrics
  recommendations: string[]
  estimatedSavings?: {
    costUsd: number
    latencyMs: number
  }
}

/**
 * Optimize model selection based on cost and performance
 */
export function optimizeModelSelection(
  taskType: TaskType,
  currentModels: ModelName[],
  historicalMetrics?: OptimizationMetrics
): {
  recommendedModels: ModelName[]
  reason: string
  estimatedSavings?: { costUsd: number; latencyMs: number }
} {
  // Model cost estimates (per 1K tokens, approximate)
  const modelCosts: Record<ModelName, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 }, // $0.03/$0.06 per 1K tokens
    'claude-3': { input: 0.015, output: 0.075 }, // $0.015/$0.075 per 1K tokens
    'gemini-pro': { input: 0.0005, output: 0.0015 }, // $0.0005/$0.0015 per 1K tokens (cheapest)
  }

  // Model latency estimates (ms, approximate)
  const modelLatencies: Record<ModelName, number> = {
    'gpt-4': 2000, // ~2s
    'claude-3': 2500, // ~2.5s
    'gemini-pro': 1500, // ~1.5s (fastest)
  }

  // If using all models, suggest optimization
  if (currentModels.length === 3) {
    // Find cheapest model for this task type
    const cheapestModel = getCheapestModel(taskType, modelCosts)
    const fastestModel = getFastestModel(modelLatencies)

    // Estimate savings
    const avgTokens = 2000 // Assume 2K tokens average
    const currentCost = currentModels.reduce((sum, model) => {
      const cost = modelCosts[model]
      return sum + (cost.input * avgTokens / 1000) + (cost.output * avgTokens / 1000)
    }, 0)

    const optimizedCost = (modelCosts[cheapestModel].input * avgTokens / 1000) +
                          (modelCosts[cheapestModel].output * avgTokens / 1000)

    const currentLatency = Math.max(...currentModels.map(m => modelLatencies[m]))
    const optimizedLatency = modelLatencies[fastestModel]

    return {
      recommendedModels: [cheapestModel],
      reason: `Cost optimization: Using ${cheapestModel} (cheapest) saves ~$${(currentCost - optimizedCost).toFixed(4)} per request`,
      estimatedSavings: {
        costUsd: currentCost - optimizedCost,
        latencyMs: currentLatency - optimizedLatency,
      },
    }
  }

  // If using single model, check if we can optimize further
  if (currentModels.length === 1) {
    const currentModel = currentModels[0]
    const cheapestModel = getCheapestModel(taskType, modelCosts)
    const fastestModel = getFastestModel(modelLatencies)

    if (currentModel !== cheapestModel && currentModel !== fastestModel) {
      return {
        recommendedModels: [cheapestModel],
        reason: `Cost optimization: ${cheapestModel} is cheaper than ${currentModel}`,
      }
    }
  }

  return {
    recommendedModels: currentModels,
    reason: 'Current model selection is already optimized',
  }
}

/**
 * Get cheapest model for task type
 */
function getCheapestModel(
  taskType: TaskType,
  costs: Record<ModelName, { input: number; output: number }>
): ModelName {
  // Gemini is generally cheapest
  // But consider task-specific needs
  const avgCost = (model: ModelName) => {
    const cost = costs[model]
    return (cost.input + cost.output) / 2
  }

  const models: ModelName[] = ['gpt-4', 'claude-3', 'gemini-pro']
  return models.reduce((cheapest, model) => {
    return avgCost(model) < avgCost(cheapest) ? model : cheapest
  }, 'gemini-pro' as ModelName)
}

/**
 * Get fastest model
 */
function getFastestModel(latencies: Record<ModelName, number>): ModelName {
  const models: ModelName[] = ['gpt-4', 'claude-3', 'gemini-pro']
  return models.reduce((fastest, model) => {
    return latencies[model] < latencies[fastest] ? model : fastest
  }, 'gemini-pro' as ModelName)
}

/**
 * Calculate optimization metrics from model responses
 */
export function calculateOptimizationMetrics(
  responses: Array<{ model: ModelName; response: ModelResponse }>
): OptimizationMetrics {
  const totalCost = responses.reduce((sum, r) => sum + (r.response.costUsd || 0), 0)
  const totalTokens = responses.reduce((sum, r) => sum + (r.response.tokensUsed || 0), 0)
  const totalLatency = responses.reduce((sum, r) => sum + (r.response.processingTimeMs || 0), 0)
  const successful = responses.filter(r => r.response.success).length
  const successRate = responses.length > 0 ? successful / responses.length : 0

  // Quality score based on success rate and average confidence
  const avgConfidence = responses
    .filter(r => r.response.confidenceScore !== undefined)
    .reduce((sum, r) => sum + (r.response.confidenceScore || 0), 0) / responses.length || 0.5

  const qualityScore = (successRate * 0.7) + (avgConfidence * 0.3)

  return {
    costUsd: totalCost,
    totalTokens,
    avgLatencyMs: responses.length > 0 ? totalLatency / responses.length : 0,
    successRate,
    qualityScore,
  }
}

/**
 * Get optimization recommendations
 */
export function getOptimizationRecommendations(
  metrics: OptimizationMetrics,
  taskType: TaskType
): string[] {
  const recommendations: string[] = []

  // Cost recommendations
  if (metrics.costUsd > 0.1) {
    recommendations.push(`High cost detected ($${metrics.costUsd.toFixed(4)}). Consider using single model for ${taskType}.`)
  }

  // Performance recommendations
  if (metrics.avgLatencyMs > 3000) {
    recommendations.push(`High latency detected (${metrics.avgLatencyMs.toFixed(0)}ms). Consider using faster model or caching.`)
  }

  // Quality recommendations
  if (metrics.successRate < 0.9) {
    recommendations.push(`Low success rate (${(metrics.successRate * 100).toFixed(0)}%). Check model availability and error handling.`)
  }

  if (metrics.qualityScore < 0.7) {
    recommendations.push(`Low quality score (${(metrics.qualityScore * 100).toFixed(0)}%). Consider using multiple models for consensus.`)
  }

  // Token usage recommendations
  if (metrics.totalTokens > 10000) {
    recommendations.push(`High token usage (${metrics.totalTokens}). Consider optimizing prompts or using smaller models.`)
  }

  return recommendations
}

/**
 * Determine if caching should be used
 */
export function shouldUseCache(
  taskType: TaskType,
  inputHash?: string
): boolean {
  // Cache-friendly task types
  const cacheableTasks: TaskType[] = [
    'skill_extraction',
    'role_clarity',
    'assessment_scoring',
  ]

  return cacheableTasks.includes(taskType) && inputHash !== undefined
}


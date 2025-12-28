/**
 * Fallback Handler
 * Comprehensive fallback logic for handling model failures and degraded performance
 */

import { ModelName, TaskType, ModelResponse, ConsensusResult } from '../types'
import { logError, logWarn, logInfo, ErrorContext } from '@/lib/errors/logger'
import { performSafetyCheck } from './safety'

export interface FallbackStrategy {
  type: 'retry' | 'alternative_model' | 'cached_result' | 'degraded_mode' | 'fail_gracefully'
  priority: number // Lower = higher priority
  description: string
}

export interface FallbackResult {
  success: boolean
  strategy: FallbackStrategy | null
  result?: ConsensusResult | ModelResponse
  error?: string
  attempts: number
}

/**
 * Available fallback strategies in order of priority
 */
const FALLBACK_STRATEGIES: FallbackStrategy[] = [
  {
    type: 'retry',
    priority: 1,
    description: 'Retry the same model with exponential backoff',
  },
  {
    type: 'alternative_model',
    priority: 2,
    description: 'Try an alternative model',
  },
  {
    type: 'cached_result',
    priority: 3,
    description: 'Use cached result if available',
  },
  {
    type: 'degraded_mode',
    priority: 4,
    description: 'Continue with reduced functionality',
  },
  {
    type: 'fail_gracefully',
    priority: 5,
    description: 'Fail gracefully with error message',
  },
]

/**
 * Model fallback order (if primary model fails, try these in order)
 */
const MODEL_FALLBACK_ORDER: Record<ModelName, ModelName[]> = {
  'gpt-4': ['claude-3', 'gemini-pro'],
  'claude-3': ['gpt-4', 'gemini-pro'],
  'gemini-pro': ['claude-3', 'gpt-4'],
}

/**
 * Handle model failure with fallback strategies
 */
export async function handleModelFailure(
  failedModel: ModelName,
  taskType: TaskType,
  prompt: string,
  systemPrompt: string,
  originalError: Error,
  context?: ErrorContext
): Promise<FallbackResult> {
  logError(
    `Model failure: ${failedModel} for ${taskType}`,
    originalError,
    {
      ...context,
      modelName: failedModel,
      taskType,
    }
  )

  // Try fallback strategies in order
  for (const strategy of FALLBACK_STRATEGIES) {
    logInfo(`Attempting fallback strategy: ${strategy.type}`, {
      taskType,
      failedModel,
      strategy: strategy.type,
    })

    try {
      const result = await executeFallbackStrategy(
        strategy,
        failedModel,
        taskType,
        prompt,
        systemPrompt,
        originalError
      )

      if (result.success) {
        logInfo(`Fallback strategy succeeded: ${strategy.type}`, {
          taskType,
          failedModel,
          strategy: strategy.type,
        })
        return {
          success: true,
          strategy,
          result: result.result,
          attempts: result.attempts,
        }
      }
    } catch (error: any) {
      logWarn(`Fallback strategy failed: ${strategy.type}`, {
        taskType,
        failedModel,
        strategy: strategy.type,
        error: error.message,
      })
      // Continue to next strategy
    }
  }

  // All fallback strategies failed
  logError('All fallback strategies failed', undefined, {
    taskType,
    failedModel,
  })

  return {
    success: false,
    strategy: FALLBACK_STRATEGIES[FALLBACK_STRATEGIES.length - 1], // fail_gracefully
    error: 'All fallback strategies exhausted',
    attempts: FALLBACK_STRATEGIES.length,
  }
}

/**
 * Execute a specific fallback strategy
 */
async function executeFallbackStrategy(
  strategy: FallbackStrategy,
  failedModel: ModelName,
  taskType: TaskType,
  prompt: string,
  systemPrompt: string,
  originalError: Error
): Promise<{ success: boolean; result?: any; attempts: number }> {
  switch (strategy.type) {
    case 'retry':
      return await retryModel(failedModel, taskType, prompt, systemPrompt, 3)

    case 'alternative_model':
      return await tryAlternativeModel(failedModel, taskType, prompt, systemPrompt)

    case 'cached_result':
      return await useCachedResult(taskType, prompt, systemPrompt)

    case 'degraded_mode':
      return await degradedMode(taskType, prompt, systemPrompt)

    case 'fail_gracefully':
      return {
        success: false,
        attempts: 1,
      }

    default:
      return {
        success: false,
        attempts: 0,
      }
  }
}

/**
 * Retry model with exponential backoff
 */
async function retryModel(
  modelName: ModelName,
  taskType: TaskType,
  prompt: string,
  systemPrompt: string,
  maxRetries: number
): Promise<{ success: boolean; result?: ModelResponse; attempts: number }> {
  const { callOpenAI } = await import('../models/openai')
  const { callAnthropic } = await import('../models/anthropic')
  const { callGoogle } = await import('../models/google')

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Exponential backoff, max 10s

    if (attempt > 1) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    try {
      let response: ModelResponse

      switch (modelName) {
        case 'gpt-4':
          response = await callOpenAI(prompt, systemPrompt)
          break
        case 'claude-3':
          response = await callAnthropic(prompt, systemPrompt)
          break
        case 'gemini-pro':
          response = await callGoogle(prompt, systemPrompt)
          break
        default:
          return { success: false, attempts: attempt }
      }

      if (response.success) {
        return { success: true, result: response, attempts: attempt }
      }
    } catch (error) {
      // Continue to next retry
      if (attempt === maxRetries) {
        return { success: false, attempts: attempt }
      }
    }
  }

  return { success: false, attempts: maxRetries }
}

/**
 * Try alternative model
 */
async function tryAlternativeModel(
  failedModel: ModelName,
  taskType: TaskType,
  prompt: string,
  systemPrompt: string
): Promise<{ success: boolean; result?: ModelResponse; attempts: number }> {
  const alternatives = MODEL_FALLBACK_ORDER[failedModel] || []
  const { callOpenAI } = await import('../models/openai')
  const { callAnthropic } = await import('../models/anthropic')
  const { callGoogle } = await import('../models/google')

  for (const alternativeModel of alternatives) {
    try {
      let response: ModelResponse

      switch (alternativeModel) {
        case 'gpt-4':
          response = await callOpenAI(prompt, systemPrompt)
          break
        case 'claude-3':
          response = await callAnthropic(prompt, systemPrompt)
          break
        case 'gemini-pro':
          response = await callGoogle(prompt, systemPrompt)
          break
        default:
          continue
      }

      if (response.success) {
        // Validate response with safety checks
        const safetyCheck = performSafetyCheck(
          prompt,
          systemPrompt,
          response.output,
          response,
          taskType,
          alternativeModel
        )

        if (safetyCheck.passed) {
          return { success: true, result: response, attempts: 1 }
        } else {
          logWarn(`Alternative model ${alternativeModel} passed but failed safety check`, {
            taskType,
            warnings: safetyCheck.warnings,
            errors: safetyCheck.errors,
          })
        }
      }
    } catch (error) {
      // Try next alternative
      continue
    }
  }

  return { success: false, attempts: alternatives.length }
}

/**
 * Use cached result if available
 */
async function useCachedResult(
  taskType: TaskType,
  prompt: string,
  systemPrompt: string
): Promise<{ success: boolean; result?: any; attempts: number }> {
  try {
    const { getCachedResponse } = await import('@/lib/cache/aiCache')
    const cacheKey = { taskType, prompt, systemPrompt }
    const cached = getCachedResponse(taskType, cacheKey)

    if (cached) {
      logInfo('Using cached result as fallback', { taskType })
      return { success: true, result: cached, attempts: 1 }
    }
  } catch (error) {
    // Cache not available or error
  }

  return { success: false, attempts: 1 }
}

/**
 * Degraded mode - continue with reduced functionality
 */
async function degradedMode(
  taskType: TaskType,
  prompt: string,
  systemPrompt: string
): Promise<{ success: boolean; result?: any; attempts: number }> {
  // Return a minimal response indicating degraded mode
  logWarn('Operating in degraded mode', { taskType })

  return {
    success: true,
    result: {
      success: true,
      output: {
        degraded_mode: true,
        message: 'System is operating in degraded mode due to model failures',
        task_type: taskType,
      },
      processingTimeMs: 0,
      costUsd: 0,
    },
    attempts: 1,
  }
}

/**
 * Check if we should use fallback based on failure rate
 */
export function shouldUseFallback(
  recentFailures: number,
  totalAttempts: number,
  threshold: number = 0.5
): boolean {
  if (totalAttempts === 0) return false
  const failureRate = recentFailures / totalAttempts
  return failureRate >= threshold
}

/**
 * Get recommended fallback strategy based on error type
 */
export function getRecommendedStrategy(error: Error): FallbackStrategy {
  const errorMessage = error.message.toLowerCase()

  // Network/timeout errors - retry
  if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return FALLBACK_STRATEGIES[0] // retry
  }

  // API key/auth errors - try alternative model
  if (errorMessage.includes('api key') || errorMessage.includes('unauthorized') || errorMessage.includes('auth')) {
    return FALLBACK_STRATEGIES[1] // alternative_model
  }

  // Rate limit errors - retry with backoff
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return FALLBACK_STRATEGIES[0] // retry
  }

  // Default to alternative model
  return FALLBACK_STRATEGIES[1] // alternative_model
}

/**
 * Handle consensus failure (when all models fail)
 */
export async function handleConsensusFailure(
  taskType: TaskType,
  prompt: string,
  systemPrompt: string,
  failedModels: ModelName[],
  errors: Error[]
): Promise<FallbackResult> {
  logError('Consensus failure: All models failed', undefined, {
    taskType,
    failedModels,
    errorCount: errors.length,
  })

  // Try to get cached result first
  const cachedResult = await useCachedResult(taskType, prompt, systemPrompt)
  if (cachedResult.success) {
    return {
      success: true,
      strategy: FALLBACK_STRATEGIES[2], // cached_result
      result: cachedResult.result,
      attempts: 1,
    }
  }

  // Try degraded mode
  const degradedResult = await degradedMode(taskType, prompt, systemPrompt)
  if (degradedResult.success) {
    return {
      success: true,
      strategy: FALLBACK_STRATEGIES[3], // degraded_mode
      result: degradedResult.result,
      attempts: 1,
    }
  }

  // All fallbacks exhausted
  return {
    success: false,
    strategy: FALLBACK_STRATEGIES[4], // fail_gracefully
    error: `All models failed: ${errors.map(e => e.message).join('; ')}`,
    attempts: failedModels.length,
  }
}


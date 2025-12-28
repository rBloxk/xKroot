/**
 * Multi-Model Consensus Engine
 * Orchestrates multiple AI models and creates consensus results
 */

import { ModelName, TaskType, ModelRun, ConsensusResult, ModelResponse, OrchestrationOptions, ConsensusMethod, ConfidenceLevel } from '../types'
import { callOpenAI } from '../models/openai'
import { callAnthropic } from '../models/anthropic'
import { callGoogle } from '../models/google'
import { supabaseAdmin } from '@/lib/supabase'
import { judgeModelOutputs, JudgeResult } from './judge'
import { mergeModelOutputs } from './merger'
import { calculateConsensusScore, getConfidenceLevel, calculateAgreement } from './scorer'
import { routeTask, RoutingOptions, shouldFallbackToAll } from './router'
import { getCachedResponse, cacheResponse, isCached } from '@/lib/cache/aiCache'
import { detectDrift } from '../memory/driftDetection'
import { performSafetyCheck } from '../fallback/safety'
import { handleModelFailure, handleConsensusFailure } from '../fallback/handler'
import { logger, logModelCall, logConsensus } from '@/lib/errors/logger'

/**
 * Generate UUID (using crypto.randomUUID if available, otherwise fallback)
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate unique task ID
 */
function generateTaskId(taskType: TaskType, contextId?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const context = contextId ? `_${contextId}` : ''
  return `${taskType}${context}_${timestamp}_${random}`
}

/**
 * Store model run in database
 */
async function storeModelRun(modelRun: Omit<ModelRun, 'id'>): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_model_run')
      .insert({
        task_id: modelRun.task_id,
        task_type: modelRun.task_type,
        model_name: modelRun.model_name,
        model_version: modelRun.model_version,
        input_data: modelRun.input_data,
        output_data: modelRun.output_data,
        raw_response: modelRun.raw_response,
        tokens_used: modelRun.tokens_used,
        processing_time_ms: modelRun.processing_time_ms,
        cost_usd: modelRun.cost_usd,
        success: modelRun.success,
        error_message: modelRun.error_message,
        confidence_score: modelRun.confidence_score,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Error storing model run:', error)
      return generateUUID() // Return a UUID if storage fails (for tracking)
    }

    return data.id
  } catch (error) {
    console.error('Exception storing model run:', error)
    return generateUUID()
  }
}

/**
 * Store consensus result in database
 */
async function storeConsensusResult(consensus: Omit<ConsensusResult, 'id'>): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_consensus_result')
      .insert({
        task_id: consensus.task_id,
        task_type: consensus.task_type,
        model_runs: consensus.model_runs,
        consensus_output: consensus.consensus_output,
        consensus_method: consensus.consensus_method,
        confidence_level: consensus.confidence_level,
        confidence_score: consensus.confidence_score,
        judge_scores: consensus.judge_scores,
        explanation: consensus.explanation,
        model_agreement: consensus.model_agreement,
        fallback_used: consensus.fallback_used || false,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Error storing consensus result:', error)
      return generateUUID()
    }

    return data.id
  } catch (error) {
    console.error('Exception storing consensus result:', error)
    return generateUUID()
  }
}

/**
 * Call a single model
 */
async function callModel(
  modelName: ModelName,
  prompt: string,
  systemPrompt: string,
  taskId: string,
  taskType: TaskType,
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<{ modelRun: ModelRun; response: ModelResponse }> {
  const startTime = Date.now()
  let response: ModelResponse

  // Call appropriate model
  switch (modelName) {
    case 'gpt-4':
      response = await callOpenAI(prompt, systemPrompt, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        jsonMode: options?.jsonMode,
      })
      break
    case 'claude-3':
      response = await callAnthropic(prompt, systemPrompt, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      })
      break
    case 'gemini-pro':
      response = await callGoogle(prompt, systemPrompt, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      })
      break
    default:
      response = {
        success: false,
        error: `Unknown model: ${modelName}`,
      }
  }

  const processingTimeMs = Date.now() - startTime

  // Perform safety check (Phase 9)
  if (response.success && response.output) {
    const safetyCheck = performSafetyCheck(
      prompt,
      systemPrompt,
      response.output,
      response,
      taskType,
      modelName
    )

    if (!safetyCheck.passed) {
      // Log safety check failure but don't fail the model call
      logger.warn('Safety check failed for model output', {
        taskType,
        taskId,
        modelName,
        warnings: safetyCheck.warnings,
        errors: safetyCheck.errors,
      })

      // If critical errors, mark response as failed
      if (safetyCheck.errors.length > 0) {
        response.success = false
        response.error = `Safety check failed: ${safetyCheck.errors.join('; ')}`
      }
    }
  }

  // Log model call (Phase 9)
  logModelCall(
    modelName,
    taskType,
    taskId,
    response.success,
    response.error,
    {
      tokensUsed: response.tokensUsed,
      costUsd: response.costUsd,
      processingTimeMs,
    }
  )

  // Create model run record
  const modelRun: Omit<ModelRun, 'id'> = {
    task_id: taskId,
    task_type: taskType,
    model_name: modelName,
    model_version: undefined, // Can be enhanced to track versions
    input_data: {
      prompt,
      systemPrompt,
      options,
    },
    output_data: response.output || {},
    raw_response: response.rawResponse,
    tokens_used: response.tokensUsed,
    processing_time_ms: processingTimeMs,
    cost_usd: response.costUsd,
    success: response.success,
    error_message: response.error,
    confidence_score: response.confidenceScore,
  }

  // Store in database
  const runId = await storeModelRun(modelRun)

  return {
    modelRun: { ...modelRun, id: runId },
    response,
  }
}

/**
 * Orchestrate multi-model task execution
 */
export async function orchestrateMultiModel(
  taskType: TaskType,
  prompt: string,
  systemPrompt: string,
  options?: OrchestrationOptions
): Promise<ConsensusResult> {
  const taskId = generateTaskId(taskType)
  const {
    models: requestedModels,
    timeout = 30000,
    requireAll = false,
    fallbackEnabled = true,
    routingMode = 'auto',
    costOptimized = false,
    performanceOptimized = false,
    useCache = true,
  } = options || {}

  // Check cache first (Phase 7)
  if (useCache) {
    const cacheKey = { taskType, prompt, systemPrompt }
    const cached = getCachedResponse(taskType, cacheKey)
    if (cached) {
      // Return cached result if available
      // Note: Would need to reconstruct ConsensusResult from cache
    }
  }

  // Route task to best models (Phase 7)
  let modelsToUse: ModelName[]
  if (requestedModels) {
    // Use explicitly requested models
    modelsToUse = requestedModels
  } else if (routingMode !== 'all') {
    // Use routing
    const routing = routeTask(taskType, {
      mode: routingMode,
      costOptimized,
      performanceOptimized,
    })
    modelsToUse = routing.models
  } else {
    // Use all models
    modelsToUse = ['gpt-4', 'claude-3', 'gemini-pro']
  }

  // Call all models in parallel with enhanced error handling (Phase 9)
  const modelPromises = modelsToUse.map(modelName =>
    Promise.race([
      callModel(modelName, prompt, systemPrompt, taskId, taskType),
      new Promise<{ modelRun: ModelRun; response: ModelResponse }>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout for ${modelName}`)), timeout)
      ),
    ]).catch(async (error) => {
      // Try fallback for individual model failure (Phase 9)
      if (fallbackEnabled) {
        try {
          const fallbackResult = await handleModelFailure(
            modelName,
            taskType,
            prompt,
            systemPrompt,
            error,
            { taskId }
          )

          if (fallbackResult.success && fallbackResult.result) {
            // Use fallback result
            return {
              modelRun: {
                task_id: taskId,
                task_type: taskType,
                model_name: modelName,
                input_data: { prompt, systemPrompt },
                output_data: (fallbackResult.result as ModelResponse).output || {},
                success: true,
                error_message: `Original failed, used fallback: ${fallbackResult.strategy?.type}`,
              } as ModelRun,
              response: fallbackResult.result as ModelResponse,
            }
          }
        } catch (fallbackError) {
          // Fallback also failed, continue with error
          logger.error('Fallback also failed', fallbackError as Error, { taskId, modelName })
        }
      }

      // Return error response
      return {
        modelRun: {
          task_id: taskId,
          task_type: taskType,
          model_name: modelName,
          input_data: { prompt, systemPrompt },
          output_data: {},
          success: false,
          error_message: error.message,
        } as ModelRun,
        response: {
          success: false,
          error: error.message,
        } as ModelResponse,
      }
    })
  )

  const results = await Promise.all(modelPromises)

  // Filter successful runs
  const successfulRuns = results.filter(r => r.response.success)
  const failedRuns = results.filter(r => !r.response.success)

  // Check if we have enough successful runs
  if (requireAll && successfulRuns.length < modelsToUse.length) {
    if (fallbackEnabled) {
      // Try consensus-level fallback (Phase 9)
      const consensusFallback = await handleConsensusFailure(
        taskType,
        prompt,
        systemPrompt,
        failedRuns.map(r => r.modelRun.model_name),
        failedRuns.map(r => new Error(r.response.error || 'Unknown error'))
      )

      if (consensusFallback.success && consensusFallback.result) {
        // Return fallback result as consensus
        logger.warn('Using consensus fallback result', {
          taskType,
          taskId,
          strategy: consensusFallback.strategy?.type,
        })

        // Create a minimal consensus result from fallback
        const fallbackConsensus: Omit<ConsensusResult, 'id'> = {
          task_id: taskId,
          task_type: taskType,
          model_runs: [],
          consensus_output: (consensusFallback.result as ModelResponse).output || {},
          consensus_method: 'weighted_average',
          confidence_level: 'low',
          confidence_score: 0.3,
          explanation: `Fallback result: ${consensusFallback.strategy?.description}`,
          fallback_used: true,
        }

        const fallbackId = await storeConsensusResult(fallbackConsensus)
        return {
          ...fallbackConsensus,
          id: fallbackId,
        }
      }
    }

    throw new Error(`Required all models to succeed, but ${failedRuns.length} failed`)
  }

  if (successfulRuns.length === 0) {
    // All models failed - try consensus fallback (Phase 9)
    if (fallbackEnabled) {
      const consensusFallback = await handleConsensusFailure(
        taskType,
        prompt,
        systemPrompt,
        failedRuns.map(r => r.modelRun.model_name),
        failedRuns.map(r => new Error(r.response.error || 'Unknown error'))
      )

      if (consensusFallback.success && consensusFallback.result) {
        logger.warn('Using consensus fallback result (all models failed)', {
          taskType,
          taskId,
          strategy: consensusFallback.strategy?.type,
        })

        const fallbackConsensus: Omit<ConsensusResult, 'id'> = {
          task_id: taskId,
          task_type: taskType,
          model_runs: [],
          consensus_output: (consensusFallback.result as ModelResponse).output || {},
          consensus_method: 'weighted_average',
          confidence_level: 'low',
          confidence_score: 0.2,
          explanation: `Fallback result: ${consensusFallback.strategy?.description}`,
          fallback_used: true,
        }

        const fallbackId = await storeConsensusResult(fallbackConsensus)
        return {
          ...fallbackConsensus,
          id: fallbackId,
        }
      }
    }

    throw new Error('All models failed')
  }

  // Store all model runs
  const modelRunIds: string[] = []
  for (const result of results) {
    if (result.modelRun.id) {
      modelRunIds.push(result.modelRun.id)
    }
  }

  // Judge model outputs (Phase 5)
  const judgeResult = judgeModelOutputs(
    successfulRuns.map(r => ({
      modelName: r.modelRun.model_name,
      output: r.response.output,
      response: r.response,
    }))
  )

  // Merge outputs based on judge recommendation
  let consensusOutput: any
  let consensusMethod: ConsensusMethod

  if (judgeResult.recommendation === 'use_best' && judgeResult.bestModel) {
    // Use best model's output
    const bestOutput = successfulRuns.find(r => r.modelRun.model_name === judgeResult.bestModel)
    consensusOutput = bestOutput?.response.output || {}
    consensusMethod = 'judge_selection'
  } else if (judgeResult.recommendation === 'merge') {
    // Merge outputs intelligently
    consensusOutput = mergeModelOutputs(
      successfulRuns.map(r => ({
        modelName: r.modelRun.model_name,
        output: r.response.output,
      })),
      {
        judgeScores: judgeResult.scores,
        strategy: 'selective_merge',
      }
    )
    consensusMethod = 'merge'
  } else {
    // Reject all or fallback to basic consensus
    consensusOutput = createBasicConsensus(successfulRuns.map(r => r.response.output))
    consensusMethod = 'weighted_average'
  }

  // Calculate consensus score (Phase 5)
  const consensusScore = calculateConsensusScore(
    successfulRuns.map(r => r.response.output),
    judgeResult.scores,
    successfulRuns.length,
    modelsToUse.length
  )

  const confidenceLevel = getConfidenceLevel(consensusScore.confidence)
  const modelAgreement = consensusScore.agreement

  // Convert judge scores to record format for storage
  const judgeScoresRecord: Record<string, number> = {}
  Object.entries(judgeResult.scores).forEach(([modelName, scores]) => {
    judgeScoresRecord[modelName] = scores.overall
  })

  const consensus: Omit<ConsensusResult, 'id'> = {
    task_id: taskId,
    task_type: taskType,
    model_runs: modelRunIds,
    consensus_output: consensusOutput,
    consensus_method: consensusMethod,
    confidence_level: confidenceLevel,
    confidence_score: consensusScore.confidence,
    judge_scores: judgeScoresRecord,
    model_agreement: modelAgreement,
    fallback_used: failedRuns.length > 0 && fallbackEnabled,
    explanation: generateEnhancedExplanation(successfulRuns, failedRuns, judgeResult, consensusScore),
  }

  // Store consensus result
  const consensusId = await storeConsensusResult(consensus)

  // Log consensus result (Phase 9)
  logConsensus(
    taskType,
    taskId,
    consensusScore.confidence,
    modelsToUse.length,
    successfulRuns.length,
    {
      consensusMethod: consensusMethod,
      modelAgreement: modelAgreement,
      fallbackUsed: consensus.fallback_used,
    }
  )

  // Detect drift (Phase 8) - run asynchronously to not block response
  detectDrift(taskType, { ...consensus, id: consensusId }, 30).catch(error => {
    logger.error('Error detecting drift', error, { taskType, taskId })
    // Don't throw - drift detection is non-blocking
  })

  // Cache result if enabled (Phase 7)
  if (useCache) {
    const cacheKey = { taskType, prompt, systemPrompt }
    cacheResponse(taskType, cacheKey, consensus, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    })
  }

  // Check if we should fallback to all models (Phase 7)
  if (fallbackEnabled && shouldFallbackToAll(modelsToUse, confidenceLevel, {
    costOptimized,
    performanceOptimized,
    requireHighConfidence: requireAll,
  })) {
    // Note: In a real implementation, we might want to re-run with all models
    // For now, we just log this decision
    console.log(`Low confidence (${confidenceLevel}), consider using all models for ${taskType}`)
  }

  return {
    ...consensus,
    id: consensusId,
  }
}

/**
 * Create basic consensus from model outputs
 * Phase 4: Simple merge - will be enhanced in Phase 5 with judge
 */
function createBasicConsensus(outputs: any[]): any {
  if (outputs.length === 0) return {}
  if (outputs.length === 1) return outputs[0]

  // For Phase 4: Simple merge strategy
  // If outputs are objects, merge them
  if (typeof outputs[0] === 'object' && !Array.isArray(outputs[0])) {
    const merged: any = {}
    const allKeys = new Set<string>()
    
    outputs.forEach(output => {
      if (typeof output === 'object') {
        Object.keys(output).forEach(key => allKeys.add(key))
      }
    })

    allKeys.forEach(key => {
      const values = outputs
        .map(o => o?.[key])
        .filter(v => v !== undefined && v !== null)
      
      if (values.length > 0) {
        // If all values are the same, use that value
        if (values.every(v => JSON.stringify(v) === JSON.stringify(values[0]))) {
          merged[key] = values[0]
        } else if (typeof values[0] === 'number') {
          // Average numbers
          merged[key] = values.reduce((a, b) => a + b, 0) / values.length
        } else if (Array.isArray(values[0])) {
          // Merge arrays (unique)
          const unique = new Set()
          values.forEach(arr => {
            if (Array.isArray(arr)) {
              arr.forEach(item => unique.add(JSON.stringify(item)))
            }
          })
          merged[key] = Array.from(unique).map(item => JSON.parse(item as string))
        } else {
          // Use first value if different
          merged[key] = values[0]
        }
      }
    })

    return merged
  }

  // For arrays or primitives, return first successful output
  return outputs[0]
}

/**
 * Create basic consensus (fallback when judge recommends reject_all)
 * This is kept as a fallback for edge cases
 */

/**
 * Generate enhanced explanation (Phase 5)
 */
function generateEnhancedExplanation(
  successfulRuns: Array<{ modelRun: ModelRun; response: ModelResponse }>,
  failedRuns: Array<{ modelRun: ModelRun; response: ModelResponse }>,
  judgeResult: JudgeResult,
  consensusScore: any
): string {
  const modelNames = successfulRuns.map(r => r.modelRun.model_name).join(', ')
  const failedNames = failedRuns.map(r => r.modelRun.model_name).join(', ')
  
  let explanation = `Consensus from ${successfulRuns.length} model(s): ${modelNames}. `
  
  if (failedRuns.length > 0) {
    explanation += `Failed models: ${failedNames}. `
  }
  
  explanation += `Judge recommendation: ${judgeResult.recommendation}. `
  explanation += `${judgeResult.reasoning} `
  
  if (judgeResult.bestModel) {
    const bestScore = judgeResult.scores[judgeResult.bestModel]?.overall || 0
    explanation += `Best model: ${judgeResult.bestModel} (score: ${bestScore.toFixed(1)}). `
  }
  
  explanation += `Confidence: ${consensusScore.confidence.toFixed(2)} (${consensusScore.confidence >= 0.8 ? 'high' : consensusScore.confidence >= 0.6 ? 'medium' : 'low'}), `
  explanation += `Agreement: ${(consensusScore.agreement * 100).toFixed(1)}%, `
  explanation += `Quality: ${consensusScore.quality.toFixed(1)}/100.`
  
  return explanation
}


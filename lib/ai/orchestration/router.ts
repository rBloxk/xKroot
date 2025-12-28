/**
 * Model Router
 * Routes tasks to the best models based on task type and requirements
 */

import { ModelName, TaskType } from '../types'

export interface RoutingStrategy {
  models: ModelName[]
  reason: string
  confidence: 'high' | 'medium' | 'low'
}

export interface RoutingOptions {
  mode?: 'auto' | 'all' | 'best' | 'custom'
  customModels?: ModelName[]
  requireHighConfidence?: boolean
  costOptimized?: boolean
  performanceOptimized?: boolean
}

/**
 * Route task to best models based on task type
 */
export function routeTask(
  taskType: TaskType,
  options: RoutingOptions = {}
): RoutingStrategy {
  const mode = options.mode || 'auto'

  switch (mode) {
    case 'auto':
      return routeAuto(taskType, options)
    case 'all':
      return routeAll(taskType)
    case 'best':
      return routeBest(taskType, options)
    case 'custom':
      return routeCustom(options.customModels || [])
    default:
      return routeAuto(taskType, options)
  }
}

/**
 * AUTO mode: Route to best model(s) based on task type
 */
function routeAuto(taskType: TaskType, options: RoutingOptions): RoutingStrategy {
  // Get best models for this task type
  const bestModels = getBestModelsForTask(taskType)

  // If high confidence required, use all models
  if (options.requireHighConfidence) {
    return {
      models: ['gpt-4', 'claude-3', 'gemini-pro'],
      reason: 'High confidence required - using all models',
      confidence: 'high',
    }
  }

  // If cost optimized, use single best model
  if (options.costOptimized) {
    return {
      models: [bestModels[0]],
      reason: `Cost optimized - using best model for ${taskType}: ${bestModels[0]}`,
      confidence: 'medium',
    }
  }

  // If performance optimized, use single best model
  if (options.performanceOptimized) {
    return {
      models: [bestModels[0]],
      reason: `Performance optimized - using best model for ${taskType}: ${bestModels[0]}`,
      confidence: 'medium',
    }
  }

  // Default: Use top 2 models for balance
  return {
    models: bestModels.slice(0, 2),
    reason: `AUTO mode - using top models for ${taskType}: ${bestModels.slice(0, 2).join(', ')}`,
    confidence: 'high',
  }
}

/**
 * Route to all models
 */
function routeAll(taskType: TaskType): RoutingStrategy {
  return {
    models: ['gpt-4', 'claude-3', 'gemini-pro'],
    reason: 'Using all models for maximum consensus',
    confidence: 'high',
  }
}

/**
 * Route to best single model
 */
function routeBest(taskType: TaskType, options: RoutingOptions): RoutingStrategy {
  const bestModels = getBestModelsForTask(taskType)
  const model = bestModels[0]

  return {
    models: [model],
    reason: `Best model for ${taskType}: ${model}`,
    confidence: 'medium',
  }
}

/**
 * Route to custom models
 */
function routeCustom(models: ModelName[]): RoutingStrategy {
  if (models.length === 0) {
    return {
      models: ['gpt-4'],
      reason: 'No custom models specified, defaulting to GPT-4',
      confidence: 'low',
    }
  }

  return {
    models,
    reason: `Using custom models: ${models.join(', ')}`,
    confidence: models.length >= 2 ? 'high' : 'medium',
  }
}

/**
 * Get best models for a task type (ordered by strength)
 */
function getBestModelsForTask(taskType: TaskType): ModelName[] {
  const modelStrengths: Record<TaskType, ModelName[]> = {
    // Technical reasoning - GPT-4 excels at structure and logic
    skill_extraction: ['gpt-4', 'claude-3', 'gemini-pro'],
    
    // Safety-critical - Claude excels at safety and nuance
    role_clarity: ['claude-3', 'gpt-4', 'gemini-pro'],
    
    // System thinking - Gemini excels at breadth and patterns
    match_reasoning: ['gemini-pro', 'gpt-4', 'claude-3'],
    
    // Technical reasoning - GPT-4 for structured scoring
    assessment_scoring: ['gpt-4', 'claude-3', 'gemini-pro'],
    
    // Safety-critical - Claude for nuanced cultural fit
    cultural_fit: ['claude-3', 'gpt-4', 'gemini-pro'],
  }

  return modelStrengths[taskType] || ['gpt-4', 'claude-3', 'gemini-pro']
}

/**
 * Get model strengths for documentation
 */
export function getModelStrengths(): Record<ModelName, string[]> {
  return {
    'gpt-4': [
      'Technical reasoning',
      'Structured analysis',
      'Logical consistency',
      'Code understanding',
      'Mathematical reasoning',
    ],
    'claude-3': [
      'Safety-critical tasks',
      'Nuanced analysis',
      'Risk awareness',
      'Creative tasks',
      'Ethical considerations',
    ],
    'gemini-pro': [
      'System thinking',
      'Pattern recognition',
      'Data analysis',
      'Multimodal tasks',
      'Broad perspective',
    ],
  }
}

/**
 * Determine if we should fallback to all models
 */
export function shouldFallbackToAll(
  currentModels: ModelName[],
  confidence: 'high' | 'medium' | 'low',
  options: RoutingOptions
): boolean {
  // If already using all models, no fallback needed
  if (currentModels.length === 3) {
    return false
  }

  // If low confidence and not cost/performance optimized, fallback
  if (confidence === 'low' && !options.costOptimized && !options.performanceOptimized) {
    return true
  }

  // If high confidence required and not high, fallback
  if (options.requireHighConfidence && confidence !== 'high') {
    return true
  }

  return false
}


/**
 * AI Safety Checks
 * Validates inputs, outputs, and API responses for safety and correctness
 */

import { ModelResponse, TaskType, ModelName } from '../types'
import { logError, logWarn, ErrorContext } from '@/lib/errors/logger'

export interface SafetyCheckResult {
  passed: boolean
  warnings: string[]
  errors: string[]
  score: number // 0.0 to 1.0 (1.0 = completely safe)
}

/**
 * Validate input prompt for safety
 */
export function validateInput(
  prompt: string,
  systemPrompt?: string,
  taskType?: TaskType
): SafetyCheckResult {
  const warnings: string[] = []
  const errors: string[] = []

  // Check prompt length
  if (prompt.length === 0) {
    errors.push('Prompt is empty')
  } else if (prompt.length > 100000) {
    errors.push('Prompt exceeds maximum length (100,000 characters)')
  } else if (prompt.length > 50000) {
    warnings.push('Prompt is very long (>50,000 characters), may cause issues')
  }

  // Check for potentially harmful content
  const harmfulPatterns = [
    /password|secret|api[_-]?key|token|credential/i,
    /ssn|social[_-]?security|credit[_-]?card|bank[_-]?account/i,
    /delete|drop|truncate|alter|create[_-]?table/i, // SQL injection patterns
    /<script|javascript:|onerror=|onload=/i, // XSS patterns
  ]

  // Only check for harmful patterns in user prompts, not system prompts
  harmfulPatterns.forEach((pattern, index) => {
    if (pattern.test(prompt)) {
      warnings.push(`Potentially sensitive content detected in prompt (pattern ${index + 1})`)
    }
  })

  // Check for excessive special characters (potential injection)
  const specialCharRatio = (prompt.match(/[<>{}[\]\\|`~!@#$%^&*()_+\-=\s]/g) || []).length / prompt.length
  if (specialCharRatio > 0.5) {
    warnings.push('High ratio of special characters detected')
  }

  // Check system prompt length
  if (systemPrompt && systemPrompt.length > 10000) {
    warnings.push('System prompt is very long (>10,000 characters)')
  }

  // Task-specific validations
  if (taskType) {
    const taskValidations = validateTaskSpecificInput(prompt, taskType)
    warnings.push(...taskValidations.warnings)
    errors.push(...taskValidations.errors)
  }

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const score = hasErrors ? 0 : hasWarnings ? 0.7 : 1.0

  return {
    passed: !hasErrors,
    warnings,
    errors,
    score,
  }
}

/**
 * Validate model output for safety and correctness
 */
export function validateOutput(
  output: any,
  taskType: TaskType,
  modelName: ModelName,
  expectedFormat?: 'json' | 'text' | 'array'
): SafetyCheckResult {
  const warnings: string[] = []
  const errors: string[] = []

  // Check if output exists
  if (output === null || output === undefined) {
    errors.push('Output is null or undefined')
    return {
      passed: false,
      warnings,
      errors,
      score: 0,
    }
  }

  // Check output type
  if (expectedFormat === 'json' && typeof output !== 'object') {
    errors.push('Expected JSON object but got different type')
  } else if (expectedFormat === 'text' && typeof output !== 'string') {
    errors.push('Expected text string but got different type')
  } else if (expectedFormat === 'array' && !Array.isArray(output)) {
    errors.push('Expected array but got different type')
  }

  // Check for malicious content in string outputs
  if (typeof output === 'string') {
    const maliciousPatterns = [
      /<script|javascript:|onerror=|onload=/i,
      /eval\(|exec\(|Function\(/i,
      /\.\.\/|\.\.\\|\.\.\/\.\./i, // Path traversal
    ]

    maliciousPatterns.forEach((pattern, index) => {
      if (pattern.test(output)) {
        errors.push(`Potentially malicious content detected in output (pattern ${index + 1})`)
      }
    })

    // Check for extremely long strings
    if (output.length > 100000) {
      warnings.push('Output string is extremely long (>100,000 characters)')
    }
  }

  // Check for circular references in objects
  if (typeof output === 'object' && output !== null) {
    try {
      JSON.stringify(output)
    } catch (error: any) {
      if (error.message.includes('circular')) {
        errors.push('Output contains circular references')
      }
    }
  }

  // Check output size (prevent memory issues)
  const outputSize = JSON.stringify(output).length
  if (outputSize > 1000000) { // 1MB
    warnings.push(`Output is very large (${(outputSize / 1024 / 1024).toFixed(2)}MB)`)
  }

  // Task-specific validations
  const taskValidations = validateTaskSpecificOutput(output, taskType)
  warnings.push(...taskValidations.warnings)
  errors.push(...taskValidations.errors)

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const score = hasErrors ? 0 : hasWarnings ? 0.7 : 1.0

  return {
    passed: !hasErrors,
    warnings,
    errors,
    score,
  }
}

/**
 * Validate API response
 */
export function validateApiResponse(
  response: ModelResponse,
  modelName: ModelName
): SafetyCheckResult {
  const warnings: string[] = []
  const errors: string[] = []

  // Check if response indicates success
  if (!response.success) {
    errors.push(`API call failed: ${response.error || 'Unknown error'}`)
    return {
      passed: false,
      warnings,
      errors,
      score: 0,
    }
  }

  // Check for output
  if (response.output === undefined || response.output === null) {
    errors.push('API response has no output')
  }

  // Check processing time (unusually long might indicate issues)
  if (response.processingTimeMs && response.processingTimeMs > 60000) {
    warnings.push(`Processing time is very long (${response.processingTimeMs}ms)`)
  }

  // Check token usage (unusually high might indicate issues)
  if (response.tokensUsed && response.tokensUsed > 100000) {
    warnings.push(`Token usage is very high (${response.tokensUsed} tokens)`)
  }

  // Check cost (unusually high might indicate issues)
  if (response.costUsd && response.costUsd > 1.0) {
    warnings.push(`API call cost is high ($${response.costUsd.toFixed(4)})`)
  }

  // Check confidence score if provided
  if (response.confidenceScore !== undefined) {
    if (response.confidenceScore < 0 || response.confidenceScore > 1) {
      warnings.push(`Confidence score is out of valid range: ${response.confidenceScore}`)
    } else if (response.confidenceScore > 0.99) {
      warnings.push('Confidence score is suspiciously high (>0.99), possible overconfidence')
    }
  }

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const score = hasErrors ? 0 : hasWarnings ? 0.7 : 1.0

  return {
    passed: !hasErrors,
    warnings,
    errors,
    score,
  }
}

/**
 * Validate task-specific input
 */
function validateTaskSpecificInput(
  prompt: string,
  taskType: TaskType
): { warnings: string[]; errors: string[] } {
  const warnings: string[] = []
  const errors: string[] = []

  switch (taskType) {
    case 'skill_extraction':
      // Should contain candidate information
      if (!prompt.includes('skill') && !prompt.includes('experience') && !prompt.includes('resume')) {
        warnings.push('Prompt may not contain candidate information for skill extraction')
      }
      break

    case 'role_clarity':
      // Should contain job/role information
      if (!prompt.includes('role') && !prompt.includes('job') && !prompt.includes('position')) {
        warnings.push('Prompt may not contain role information for role clarity')
      }
      break

    case 'match_reasoning':
      // Should contain both candidate and job information
      if (!prompt.includes('candidate') && !prompt.includes('job') && !prompt.includes('match')) {
        warnings.push('Prompt may not contain match information for match reasoning')
      }
      break

    default:
      // No specific validations
      break
  }

  return { warnings, errors }
}

/**
 * Validate task-specific output
 */
function validateTaskSpecificOutput(
  output: any,
  taskType: TaskType
): { warnings: string[]; errors: string[] } {
  const warnings: string[] = []
  const errors: string[] = []

  switch (taskType) {
    case 'skill_extraction':
      // Should return an array or object with skills
      if (typeof output === 'object' && !Array.isArray(output)) {
        if (!('skills' in output) && !Array.isArray(output)) {
          warnings.push('Output may not contain skills array for skill extraction')
        }
      } else if (!Array.isArray(output)) {
        warnings.push('Expected array or object with skills for skill extraction')
      }
      break

    case 'role_clarity':
      // Should return structured information about the role
      if (typeof output !== 'object' || Array.isArray(output)) {
        warnings.push('Expected object with role information for role clarity')
      }
      break

    case 'match_reasoning':
      // Should return match score and reasoning
      if (typeof output === 'object' && !Array.isArray(output)) {
        if (!('score' in output) && !('match_score' in output)) {
          warnings.push('Output may not contain match score for match reasoning')
        }
      }
      break

    default:
      // No specific validations
      break
  }

  return { warnings, errors }
}

/**
 * Perform comprehensive safety check
 */
export function performSafetyCheck(
  prompt: string,
  systemPrompt: string | undefined,
  output: any,
  response: ModelResponse,
  taskType: TaskType,
  modelName: ModelName
): SafetyCheckResult {
  const inputCheck = validateInput(prompt, systemPrompt, taskType)
  const outputCheck = validateOutput(output, taskType, modelName)
  const apiCheck = validateApiResponse(response, modelName)

  // Combine all checks
  const allWarnings = [...inputCheck.warnings, ...outputCheck.warnings, ...apiCheck.warnings]
  const allErrors = [...inputCheck.errors, ...outputCheck.errors, ...apiCheck.errors]

  // Calculate overall score (weighted average)
  const overallScore = (
    inputCheck.score * 0.3 +
    outputCheck.score * 0.5 +
    apiCheck.score * 0.2
  )

  // Log warnings and errors
  if (allWarnings.length > 0) {
    logWarn('Safety check warnings', {
      taskType,
      modelName,
      warnings: allWarnings,
    })
  }

  if (allErrors.length > 0) {
    logError('Safety check errors', undefined, {
      taskType,
      modelName,
      errors: allErrors,
    })
  }

  return {
    passed: allErrors.length === 0,
    warnings: allWarnings,
    errors: allErrors,
    score: overallScore,
  }
}


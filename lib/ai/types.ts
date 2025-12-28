/**
 * Multi-Model Intelligence (MMI) Type Definitions
 */

export type ModelName = 'gpt-4' | 'claude-3' | 'gemini-pro'
export type TaskType = 'skill_extraction' | 'role_clarity' | 'match_reasoning' | 'assessment_scoring' | 'cultural_fit' | 'risk_flagging' | 'hiring_recommendation'
export type ConsensusMethod = 'highest_score' | 'merge' | 'weighted_average' | 'judge_selection'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ModelRun {
  id?: string
  task_id: string
  task_type: TaskType
  model_name: ModelName
  model_version?: string
  input_data: any
  output_data: any
  raw_response?: string
  tokens_used?: number
  processing_time_ms?: number
  cost_usd?: number
  success: boolean
  error_message?: string
  confidence_score?: number
}

export interface ConsensusResult {
  id?: string
  task_id: string
  task_type: TaskType
  model_runs: string[] // Array of model run IDs
  consensus_output: any
  consensus_method: ConsensusMethod
  confidence_level: ConfidenceLevel
  confidence_score: number // 0.0 to 1.0
  judge_scores?: Record<string, number>
  explanation?: string
  model_agreement?: number // 0.0 to 1.0
  fallback_used?: boolean
}

export interface ModelResponse {
  success: boolean
  output?: any
  rawResponse?: string
  tokensUsed?: number
  processingTimeMs?: number
  costUsd?: number
  error?: string
  confidenceScore?: number
}

export interface JudgeScores {
  logicalConsistency: number // 0-100
  completeness: number // 0-100
  riskAwareness: number // 0-100
  overconfidence: number // 0-100 (lower is better)
  overall: number // 0-100
}

export interface OrchestrationOptions {
  models?: ModelName[] // Which models to use (default: all)
  timeout?: number // Timeout in ms (default: 30000)
  requireAll?: boolean // Require all models to succeed (default: false)
  fallbackEnabled?: boolean // Enable fallback if models fail (default: true)
  routingMode?: 'auto' | 'all' | 'best' | 'custom' // Routing mode (Phase 7)
  costOptimized?: boolean // Optimize for cost (Phase 7)
  performanceOptimized?: boolean // Optimize for performance (Phase 7)
  useCache?: boolean // Use caching (Phase 7)
}


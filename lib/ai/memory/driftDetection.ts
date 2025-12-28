/**
 * AI Model Drift Detection
 * Detects changes in model behavior over time by comparing current outputs with historical patterns
 */

import { ModelRun, ConsensusResult, TaskType, ModelName } from '../types'
import { supabaseAdmin } from '@/lib/supabase'

export interface DriftAlert {
  id: string
  task_type: TaskType
  model_name?: ModelName
  drift_type: 'output_drift' | 'confidence_drift' | 'agreement_drift' | 'cost_drift' | 'performance_drift'
  severity: 'low' | 'medium' | 'high' | 'critical'
  current_value: number
  historical_average: number
  change_percentage: number
  description: string
  detected_at: Date
  recommendation?: string
}

export interface DriftMetrics {
  outputSimilarity: number // 0.0 to 1.0
  confidenceChange: number // Percentage change
  agreementChange: number // Percentage change
  costChange: number // Percentage change
  performanceChange: number // Percentage change (processing time)
  overallDriftScore: number // 0.0 to 1.0 (higher = more drift)
}

/**
 * Detect drift for a specific task type
 */
export async function detectDrift(
  taskType: TaskType,
  currentResult: ConsensusResult,
  lookbackDays: number = 30
): Promise<DriftAlert[]> {
  const alerts: DriftAlert[] = []

  // Get historical data
  const historicalData = await getHistoricalData(taskType, lookbackDays)

  if (historicalData.length === 0) {
    // No historical data - cannot detect drift
    return []
  }

  // Calculate historical averages
  const historicalAvg = calculateHistoricalAverages(historicalData)

  // Detect different types of drift
  alerts.push(...detectOutputDrift(currentResult, historicalData, historicalAvg))
  alerts.push(...detectConfidenceDrift(currentResult, historicalAvg))
  alerts.push(...detectAgreementDrift(currentResult, historicalAvg))
  alerts.push(...(await detectCostDrift(currentResult, historicalData, historicalAvg)))
  alerts.push(...(await detectPerformanceDrift(currentResult, historicalData, historicalAvg)))

  // Store drift alerts in database
  if (alerts.length > 0) {
    await storeDriftAlerts(alerts)
  }

  return alerts
}

/**
 * Detect output drift - changes in actual model outputs
 */
function detectOutputDrift(
  current: ConsensusResult,
  historical: ConsensusResult[],
  historicalAvg: any
): DriftAlert[] {
  const alerts: DriftAlert[] = []

  // Compare current output with recent historical outputs
  const recentOutputs = historical
    .slice(0, 10) // First 10 (most recent) results
    .map((h: any) => h.consensus_output)

  if (recentOutputs.length === 0) return []

  // Calculate average similarity with historical outputs
  const similarities = recentOutputs.map(output =>
    calculateSimilarity(current.consensus_output, output)
  )

  const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length

  // If similarity is below threshold, there's drift
  if (avgSimilarity < 0.7) {
    const changePercentage = (1 - avgSimilarity) * 100
    const severity = avgSimilarity < 0.5 ? 'high' : avgSimilarity < 0.6 ? 'medium' : 'low'

    alerts.push({
      id: generateAlertId(),
      task_type: current.task_type,
      drift_type: 'output_drift',
      severity,
      current_value: avgSimilarity,
      historical_average: 0.85, // Expected average similarity
      change_percentage: changePercentage,
      description: `Model outputs have changed significantly. Similarity with historical outputs: ${(avgSimilarity * 100).toFixed(1)}%`,
      detected_at: new Date(),
      recommendation: 'Review recent model outputs and verify if the change is expected or indicates model degradation.',
    })
  }

  return alerts
}

/**
 * Detect confidence drift - changes in confidence scores
 */
function detectConfidenceDrift(
  current: ConsensusResult,
  historicalAvg: any
): DriftAlert[] {
  const alerts: DriftAlert[] = []

  if (!historicalAvg.confidence_score) return []

  const currentConfidence = current.confidence_score
  const historicalConfidence = historicalAvg.confidence_score
  const changePercentage = ((currentConfidence - historicalConfidence) / historicalConfidence) * 100

  // Alert if confidence changed significantly (>20%)
  if (Math.abs(changePercentage) > 20) {
    const severity = Math.abs(changePercentage) > 40 ? 'high' : Math.abs(changePercentage) > 30 ? 'medium' : 'low'

    alerts.push({
      id: generateAlertId(),
      task_type: current.task_type,
      drift_type: 'confidence_drift',
      severity,
      current_value: currentConfidence,
      historical_average: historicalConfidence,
      change_percentage: changePercentage,
      description: `Confidence score changed by ${changePercentage.toFixed(1)}%. Current: ${(currentConfidence * 100).toFixed(1)}%, Historical avg: ${(historicalConfidence * 100).toFixed(1)}%`,
      detected_at: new Date(),
      recommendation: changePercentage < 0
        ? 'Investigate why confidence decreased. Check for model updates or input changes.'
        : 'Verify if increased confidence is justified or indicates overconfidence.',
    })
  }

  return alerts
}

/**
 * Detect agreement drift - changes in model agreement
 */
function detectAgreementDrift(
  current: ConsensusResult,
  historicalAvg: any
): DriftAlert[] {
  const alerts: DriftAlert[] = []

  if (!historicalAvg.model_agreement || current.model_agreement === undefined) return []

  const currentAgreement = current.model_agreement
  const historicalAgreement = historicalAvg.model_agreement
  const changePercentage = ((currentAgreement - historicalAgreement) / historicalAgreement) * 100

  // Alert if agreement changed significantly (>25%)
  if (Math.abs(changePercentage) > 25) {
    const severity = Math.abs(changePercentage) > 50 ? 'high' : Math.abs(changePercentage) > 35 ? 'medium' : 'low'

    alerts.push({
      id: generateAlertId(),
      task_type: current.task_type,
      drift_type: 'agreement_drift',
      severity,
      current_value: currentAgreement,
      historical_average: historicalAgreement,
      change_percentage: changePercentage,
      description: `Model agreement changed by ${changePercentage.toFixed(1)}%. Current: ${(currentAgreement * 100).toFixed(1)}%, Historical avg: ${(historicalAgreement * 100).toFixed(1)}%`,
      detected_at: new Date(),
      recommendation: changePercentage < 0
        ? 'Models are disagreeing more. Check for model updates or input quality issues.'
        : 'Models are agreeing more. Verify if this is expected or indicates reduced diversity.',
    })
  }

  return alerts
}

/**
 * Detect cost drift - changes in API costs
 */
async function detectCostDrift(
  current: ConsensusResult,
  historical: ConsensusResult[],
  historicalAvg: any
): Promise<DriftAlert[]> {
  const alerts: DriftAlert[] = []

  // Get current cost from model runs
  const currentCost = await getCurrentCost(current.task_id)
  if (!currentCost || !historicalAvg.cost_usd) return []

  const changePercentage = ((currentCost - historicalAvg.cost_usd) / historicalAvg.cost_usd) * 100

  // Alert if cost increased significantly (>30%)
  if (changePercentage > 30) {
    const severity = changePercentage > 60 ? 'high' : changePercentage > 45 ? 'medium' : 'low'

    alerts.push({
      id: generateAlertId(),
      task_type: current.task_type,
      drift_type: 'cost_drift',
      severity,
      current_value: currentCost,
      historical_average: historicalAvg.cost_usd,
      change_percentage: changePercentage,
      description: `API costs increased by ${changePercentage.toFixed(1)}%. Current: $${currentCost.toFixed(4)}, Historical avg: $${historicalAvg.cost_usd.toFixed(4)}`,
      detected_at: new Date(),
      recommendation: 'Investigate cost increase. Check for token usage changes, model updates, or prompt modifications.',
    })
  }

  return alerts
}

/**
 * Detect performance drift - changes in processing time
 */
async function detectPerformanceDrift(
  current: ConsensusResult,
  historical: ConsensusResult[],
  historicalAvg: any
): Promise<DriftAlert[]> {
  const alerts: DriftAlert[] = []

  // Get current processing time from model runs
  const currentTime = await getCurrentProcessingTime(current.task_id)
  if (!currentTime || !historicalAvg.processing_time_ms) return []

  const changePercentage = ((currentTime - historicalAvg.processing_time_ms) / historicalAvg.processing_time_ms) * 100

  // Alert if performance degraded significantly (>40%)
  if (changePercentage > 40) {
    const severity = changePercentage > 80 ? 'high' : changePercentage > 60 ? 'medium' : 'low'

    alerts.push({
      id: generateAlertId(),
      task_type: current.task_type,
      drift_type: 'performance_drift',
      severity,
      current_value: currentTime,
      historical_average: historicalAvg.processing_time_ms,
      change_percentage: changePercentage,
      description: `Processing time increased by ${changePercentage.toFixed(1)}%. Current: ${currentTime}ms, Historical avg: ${historicalAvg.processing_time_ms}ms`,
      detected_at: new Date(),
      recommendation: 'Investigate performance degradation. Check for API latency issues, model updates, or increased input size.',
    })
  }

  return alerts
}

/**
 * Get historical data for a task type
 */
async function getHistoricalData(
  taskType: TaskType,
  lookbackDays: number
): Promise<ConsensusResult[]> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays)

    const { data, error } = await supabaseAdmin
      .from('ai_consensus_result')
      .select('*')
      .eq('task_type', taskType)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100) // Limit to last 100 results

    if (error) {
      console.error('Error fetching historical data:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      task_id: row.task_id,
      task_type: row.task_type as TaskType,
      model_runs: row.model_runs || [],
      consensus_output: row.consensus_output,
      consensus_method: row.consensus_method,
      confidence_level: row.confidence_level,
      confidence_score: row.confidence_score,
      judge_scores: row.judge_scores,
      explanation: row.explanation,
      model_agreement: row.model_agreement,
      fallback_used: row.fallback_used || false,
      created_at: row.created_at, // Include for date comparisons
    }))
  } catch (error) {
    console.error('Exception fetching historical data:', error)
    return []
  }
}

/**
 * Calculate historical averages
 */
function calculateHistoricalAverages(historical: ConsensusResult[]): any {
  if (historical.length === 0) {
    return {
      confidence_score: 0,
      model_agreement: 0,
      cost_usd: 0,
      processing_time_ms: 0,
    }
  }

  const confidences = historical.map(h => h.confidence_score).filter(c => c !== undefined)
  const agreements = historical.map(h => h.model_agreement).filter(a => a !== undefined)

  // Get costs and processing times from model runs
  const costs: number[] = []
  const processingTimes: number[] = []

  // Note: In a real implementation, we'd fetch these from ai_model_run table
  // For now, we'll use placeholder values
  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0.7

  const avgAgreement = agreements.length > 0
    ? agreements.reduce((a, b) => a + b, 0) / agreements.length
    : 0.8

  return {
    confidence_score: avgConfidence,
    model_agreement: avgAgreement,
    cost_usd: 0.01, // Placeholder - would calculate from model runs
    processing_time_ms: 2000, // Placeholder - would calculate from model runs
  }
}

/**
 * Get current cost for a task
 */
async function getCurrentCost(taskId: string): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_model_run')
      .select('cost_usd')
      .eq('task_id', taskId)
      .not('cost_usd', 'is', null)

    if (error || !data || data.length === 0) return null

    return data.reduce((sum, run) => sum + (run.cost_usd || 0), 0)
  } catch (error) {
    console.error('Error fetching current cost:', error)
    return null
  }
}

/**
 * Get current processing time for a task
 */
async function getCurrentProcessingTime(taskId: string): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_model_run')
      .select('processing_time_ms')
      .eq('task_id', taskId)
      .not('processing_time_ms', 'is', null)

    if (error || !data || data.length === 0) return null

    // Return max processing time (total time for all models)
    return Math.max(...data.map(run => run.processing_time_ms || 0))
  } catch (error) {
    console.error('Error fetching current processing time:', error)
    return null
  }
}

/**
 * Store drift alerts in database
 * Note: This would require a drift_alerts table in the database
 * For now, we'll log them
 */
async function storeDriftAlerts(alerts: DriftAlert[]): Promise<void> {
  // TODO: Create drift_alerts table and store alerts
  // For now, just log them
  console.log(`[DRIFT DETECTION] ${alerts.length} drift alert(s) detected:`)
  alerts.forEach(alert => {
    console.log(`  - ${alert.severity.toUpperCase()}: ${alert.drift_type} for ${alert.task_type} - ${alert.description}`)
  })
}

/**
 * Calculate similarity between two outputs
 * Re-export from scorer for convenience
 */
function calculateSimilarity(output1: any, output2: any): number {
  // Use the same similarity calculation from scorer
  if (JSON.stringify(output1) === JSON.stringify(output2)) {
    return 1.0
  }

  if (typeof output1 !== typeof output2) {
    return 0.0
  }

  if (typeof output1 === 'object' && output1 !== null && output2 !== null) {
    if (Array.isArray(output1) && Array.isArray(output2)) {
      return arraySimilarity(output1, output2)
    } else {
      return objectSimilarity(output1, output2)
    }
  }

  return 0.5
}

function arraySimilarity(arr1: any[], arr2: any[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1.0
  if (arr1.length === 0 || arr2.length === 0) return 0.0

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

function objectSimilarity(obj1: any, obj2: any): number {
  const keys1 = new Set(Object.keys(obj1))
  const keys2 = new Set(Object.keys(obj2))

  if (keys1.size === 0 && keys2.size === 0) return 1.0
  if (keys1.size === 0 || keys2.size === 0) return 0.0

  const keyIntersection = new Set([...keys1].filter(k => keys2.has(k)))
  const keyUnion = new Set([...keys1, ...keys2])
  const keySimilarity = keyUnion.size > 0 ? keyIntersection.size / keyUnion.size : 0.0

  const valueSimilarities: number[] = []
  keyIntersection.forEach(key => {
    valueSimilarities.push(calculateSimilarity(obj1[key], obj2[key]))
  })

  const valueSimilarity = valueSimilarities.length > 0
    ? valueSimilarities.reduce((a, b) => a + b, 0) / valueSimilarities.length
    : 0.0

  return (keySimilarity * 0.4) + (valueSimilarity * 0.6)
}

/**
 * Generate unique alert ID
 */
function generateAlertId(): string {
  return `drift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get all drift alerts
 */
export async function getDriftAlerts(
  taskType?: TaskType,
  severity?: 'low' | 'medium' | 'high' | 'critical',
  limit: number = 50
): Promise<DriftAlert[]> {
  // TODO: Fetch from drift_alerts table
  // For now, return empty array
  return []
}

/**
 * Calculate overall drift metrics for a task type
 */
export async function calculateDriftMetrics(
  taskType: TaskType,
  lookbackDays: number = 30
): Promise<DriftMetrics> {
  const historical = await getHistoricalData(taskType, lookbackDays)

  if (historical.length < 2) {
    return {
      outputSimilarity: 1.0,
      confidenceChange: 0,
      agreementChange: 0,
      costChange: 0,
      performanceChange: 0,
      overallDriftScore: 0,
    }
  }

  // Calculate metrics
  const recent = historical.slice(0, 5) // Most recent 5
  const older = historical.slice(5, 10) // Next 5 (older)

  if (older.length === 0) {
    return {
      outputSimilarity: 1.0,
      confidenceChange: 0,
      agreementChange: 0,
      costChange: 0,
      performanceChange: 0,
      overallDriftScore: 0,
    }
  }

  // Output similarity
  const outputSimilarities = recent.map(r =>
    older.map(o => calculateSimilarity(r.consensus_output, o.consensus_output))
  ).flat()
  const outputSimilarity = outputSimilarities.length > 0
    ? outputSimilarities.reduce((a, b) => a + b, 0) / outputSimilarities.length
    : 1.0

  // Confidence change
  const recentConfidence = recent.map(r => r.confidence_score).reduce((a, b) => a + b, 0) / recent.length
  const olderConfidence = older.map(o => o.confidence_score).reduce((a, b) => a + b, 0) / older.length
  const confidenceChange = olderConfidence > 0
    ? ((recentConfidence - olderConfidence) / olderConfidence) * 100
    : 0

  // Agreement change
  const recentAgreement = recent
    .map(r => r.model_agreement || 0)
    .filter(a => a > 0)
    .reduce((a, b) => a + b, 0) / recent.length
  const olderAgreement = older
    .map(o => o.model_agreement || 0)
    .filter(a => a > 0)
    .reduce((a, b) => a + b, 0) / older.length
  const agreementChange = olderAgreement > 0
    ? ((recentAgreement - olderAgreement) / olderAgreement) * 100
    : 0

  // Overall drift score (0.0 = no drift, 1.0 = maximum drift)
  const overallDriftScore = Math.min(
    1.0,
    (1 - outputSimilarity) * 0.4 +
    Math.abs(confidenceChange) / 100 * 0.3 +
    Math.abs(agreementChange) / 100 * 0.3
  )

  return {
    outputSimilarity,
    confidenceChange,
    agreementChange,
    costChange: 0, // Would calculate from model runs
    performanceChange: 0, // Would calculate from model runs
    overallDriftScore,
  }
}


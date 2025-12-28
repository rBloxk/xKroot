/**
 * AI Model History & Memory System
 * Stores and retrieves historical AI model runs and consensus results
 */

import { ModelRun, ConsensusResult, TaskType, ModelName } from '../types'
import { supabaseAdmin } from '@/lib/supabase'

export interface HistoricalStats {
  totalRuns: number
  totalConsensusResults: number
  byTaskType: Record<TaskType, number>
  byModel: Record<ModelName, number>
  averageConfidence: number
  averageAgreement: number
  totalCost: number
  averageProcessingTime: number
  dateRange: {
    earliest: Date
    latest: Date
  }
}

export interface TimeSeriesData {
  date: string
  count: number
  averageConfidence: number
  averageAgreement: number
  totalCost: number
}

/**
 * Get historical model runs for a task type
 */
export async function getHistoricalModelRuns(
  taskType: TaskType,
  limit: number = 100,
  startDate?: Date,
  endDate?: Date
): Promise<ModelRun[]> {
  try {
    let query = supabaseAdmin
      .from('ai_model_run')
      .select('*')
      .eq('task_type', taskType)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching historical model runs:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      task_id: row.task_id,
      task_type: row.task_type as TaskType,
      model_name: row.model_name as ModelName,
      model_version: row.model_version,
      input_data: row.input_data,
      output_data: row.output_data,
      raw_response: row.raw_response,
      tokens_used: row.tokens_used,
      processing_time_ms: row.processing_time_ms,
      cost_usd: row.cost_usd,
      success: row.success,
      error_message: row.error_message,
      confidence_score: row.confidence_score,
      created_at: row.created_at, // Include for date comparisons
    }))
  } catch (error) {
    console.error('Exception fetching historical model runs:', error)
    return []
  }
}

/**
 * Get historical consensus results for a task type
 */
export async function getHistoricalConsensusResults(
  taskType: TaskType,
  limit: number = 100,
  startDate?: Date,
  endDate?: Date
): Promise<ConsensusResult[]> {
  try {
    let query = supabaseAdmin
      .from('ai_consensus_result')
      .select('*')
      .eq('task_type', taskType)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching historical consensus results:', error)
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
    console.error('Exception fetching historical consensus results:', error)
    return []
  }
}

/**
 * Get historical statistics
 */
export async function getHistoricalStats(
  taskType?: TaskType,
  startDate?: Date,
  endDate?: Date
): Promise<HistoricalStats> {
  try {
    // Build query for model runs
    let modelRunsQuery = supabaseAdmin
      .from('ai_model_run')
      .select('*')

    if (taskType) {
      modelRunsQuery = modelRunsQuery.eq('task_type', taskType)
    }

    if (startDate) {
      modelRunsQuery = modelRunsQuery.gte('created_at', startDate.toISOString())
    }

    if (endDate) {
      modelRunsQuery = modelRunsQuery.lte('created_at', endDate.toISOString())
    }

    const { data: modelRuns, error: modelRunsError } = await modelRunsQuery

    // Build query for consensus results
    let consensusQuery = supabaseAdmin
      .from('ai_consensus_result')
      .select('*')

    if (taskType) {
      consensusQuery = consensusQuery.eq('task_type', taskType)
    }

    if (startDate) {
      consensusQuery = consensusQuery.gte('created_at', startDate.toISOString())
    }

    if (endDate) {
      consensusQuery = consensusQuery.lte('created_at', endDate.toISOString())
    }

    const { data: consensusResults, error: consensusError } = await consensusQuery

    if (modelRunsError || consensusError) {
      console.error('Error fetching historical stats:', modelRunsError || consensusError)
      return getEmptyStats()
    }

    const runs = modelRuns || []
    const results = consensusResults || []

    // Calculate statistics
    const byTaskType: Record<string, number> = {}
    const byModel: Record<string, number> = {}

    runs.forEach(run => {
      byTaskType[run.task_type] = (byTaskType[run.task_type] || 0) + 1
      byModel[run.model_name] = (byModel[run.model_name] || 0) + 1
    })

    const confidences = results
      .map(r => r.confidence_score)
      .filter(c => c !== undefined && c !== null)
    const agreements = results
      .map(r => r.model_agreement)
      .filter(a => a !== undefined && a !== null)

    const costs = runs
      .map(r => r.cost_usd)
      .filter(c => c !== undefined && c !== null)
    const processingTimes = runs
      .map(r => r.processing_time_ms)
      .filter(t => t !== undefined && t !== null)

    const dates = [
      ...runs.map((r: any) => new Date(r.created_at || new Date())),
      ...results.map((r: any) => new Date(r.created_at || new Date())),
    ]

    return {
      totalRuns: runs.length,
      totalConsensusResults: results.length,
      byTaskType: byTaskType as Record<TaskType, number>,
      byModel: byModel as Record<ModelName, number>,
      averageConfidence: confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0,
      averageAgreement: agreements.length > 0
        ? agreements.reduce((a, b) => a + b, 0) / agreements.length
        : 0,
      totalCost: costs.reduce((a, b) => a + (b || 0), 0),
      averageProcessingTime: processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + (b || 0), 0) / processingTimes.length
        : 0,
      dateRange: {
        earliest: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(),
        latest: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date(),
      },
    }
  } catch (error) {
    console.error('Exception fetching historical stats:', error)
    return getEmptyStats()
  }
}

/**
 * Get time series data for visualization
 */
export async function getTimeSeriesData(
  taskType: TaskType,
  days: number = 30,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<TimeSeriesData[]> {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const results = await getHistoricalConsensusResults(taskType, 1000, startDate, endDate)

    // Group by time period
    const grouped: Record<string, {
      count: number
      confidences: number[]
      agreements: number[]
      costs: number[]
    }> = {}

    results.forEach((result: any) => {
      const date = new Date(result.created_at || new Date())
      let key: string

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]
      } else if (groupBy === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!grouped[key]) {
        grouped[key] = {
          count: 0,
          confidences: [],
          agreements: [],
          costs: [],
        }
      }

      grouped[key].count++
      if (result.confidence_score !== undefined) {
        grouped[key].confidences.push(result.confidence_score)
      }
      if (result.model_agreement !== undefined) {
        grouped[key].agreements.push(result.model_agreement)
      }

      // Get costs from model runs
      // Note: This would require fetching model runs for each result
      // For now, we'll use placeholder
    })

    // Convert to array and calculate averages
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        count: data.count,
        averageConfidence: data.confidences.length > 0
          ? data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length
          : 0,
        averageAgreement: data.agreements.length > 0
          ? data.agreements.reduce((a, b) => a + b, 0) / data.agreements.length
          : 0,
        totalCost: data.costs.reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Exception fetching time series data:', error)
    return []
  }
}

/**
 * Get model performance comparison
 */
export async function getModelPerformanceComparison(
  taskType: TaskType,
  days: number = 30
): Promise<Record<ModelName, {
  totalRuns: number
  successRate: number
  averageConfidence: number
  averageCost: number
  averageProcessingTime: number
}>> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const runs = await getHistoricalModelRuns(taskType, 1000, startDate)

    const byModel: Record<string, {
      totalRuns: number
      successfulRuns: number
      confidences: number[]
      costs: number[]
      processingTimes: number[]
    }> = {}

    runs.forEach(run => {
      if (!byModel[run.model_name]) {
        byModel[run.model_name] = {
          totalRuns: 0,
          successfulRuns: 0,
          confidences: [],
          costs: [],
          processingTimes: [],
        }
      }

      byModel[run.model_name].totalRuns++
      if (run.success) {
        byModel[run.model_name].successfulRuns++
      }
      if (run.confidence_score !== undefined) {
        byModel[run.model_name].confidences.push(run.confidence_score)
      }
      if (run.cost_usd !== undefined) {
        byModel[run.model_name].costs.push(run.cost_usd)
      }
      if (run.processing_time_ms !== undefined) {
        byModel[run.model_name].processingTimes.push(run.processing_time_ms)
      }
    })

    const result: Record<ModelName, any> = {}

    Object.entries(byModel).forEach(([modelName, data]) => {
      result[modelName as ModelName] = {
        totalRuns: data.totalRuns,
        successRate: data.totalRuns > 0 ? data.successfulRuns / data.totalRuns : 0,
        averageConfidence: data.confidences.length > 0
          ? data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length
          : 0,
        averageCost: data.costs.length > 0
          ? data.costs.reduce((a, b) => a + b, 0) / data.costs.length
          : 0,
        averageProcessingTime: data.processingTimes.length > 0
          ? data.processingTimes.reduce((a, b) => a + b, 0) / data.processingTimes.length
          : 0,
      }
    })

    return result
  } catch (error) {
    console.error('Exception fetching model performance comparison:', error)
    return {} as Record<ModelName, any>
  }
}

/**
 * Get empty stats (default)
 */
function getEmptyStats(): HistoricalStats {
  return {
    totalRuns: 0,
    totalConsensusResults: 0,
    byTaskType: {} as Record<TaskType, number>,
    byModel: {} as Record<ModelName, number>,
    averageConfidence: 0,
    averageAgreement: 0,
    totalCost: 0,
    averageProcessingTime: 0,
    dateRange: {
      earliest: new Date(),
      latest: new Date(),
    },
  }
}


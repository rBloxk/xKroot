/**
 * Admin API: Drift Detection & History
 * Provides endpoints for viewing AI model drift and historical data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalStats, getTimeSeriesData, getModelPerformanceComparison } from '@/lib/ai/memory/history'
import { calculateDriftMetrics, getDriftAlerts } from '@/lib/ai/memory/driftDetection'
import { TaskType } from '@/lib/ai/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'stats'

    switch (action) {
      case 'stats': {
        const taskType = searchParams.get('task_type') as TaskType | null
        const days = parseInt(searchParams.get('days') || '30')

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const stats = await getHistoricalStats(taskType || undefined, startDate)

        return NextResponse.json({
          success: true,
          stats,
        })
      }

      case 'timeseries': {
        const taskType = searchParams.get('task_type') as TaskType
        const days = parseInt(searchParams.get('days') || '30')
        const groupBy = (searchParams.get('group_by') || 'day') as 'day' | 'week' | 'month'

        if (!taskType) {
          return NextResponse.json(
            { success: false, error: 'task_type is required' },
            { status: 400 }
          )
        }

        const timeSeries = await getTimeSeriesData(taskType, days, groupBy)

        return NextResponse.json({
          success: true,
          timeSeries,
        })
      }

      case 'model-performance': {
        const taskType = searchParams.get('task_type') as TaskType
        const days = parseInt(searchParams.get('days') || '30')

        if (!taskType) {
          return NextResponse.json(
            { success: false, error: 'task_type is required' },
            { status: 400 }
          )
        }

        const performance = await getModelPerformanceComparison(taskType, days)

        return NextResponse.json({
          success: true,
          performance,
        })
      }

      case 'drift-metrics': {
        const taskType = searchParams.get('task_type') as TaskType
        const days = parseInt(searchParams.get('days') || '30')

        if (!taskType) {
          return NextResponse.json(
            { success: false, error: 'task_type is required' },
            { status: 400 }
          )
        }

        const metrics = await calculateDriftMetrics(taskType, days)

        return NextResponse.json({
          success: true,
          metrics,
        })
      }

      case 'alerts': {
        const taskType = searchParams.get('task_type') as TaskType | null
        const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical' | null
        const limit = parseInt(searchParams.get('limit') || '50')

        const alerts = await getDriftAlerts(taskType || undefined, severity || undefined, limit)

        return NextResponse.json({
          success: true,
          alerts,
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Error in drift API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}


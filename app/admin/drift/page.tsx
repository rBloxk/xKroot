'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'
import { TaskType } from '@/lib/ai/types'

interface HistoricalStats {
  totalRuns: number
  totalConsensusResults: number
  byTaskType: Record<TaskType, number>
  byModel: Record<string, number>
  averageConfidence: number
  averageAgreement: number
  totalCost: number
  averageProcessingTime: number
  dateRange: {
    earliest: string
    latest: string
  }
}

interface TimeSeriesData {
  date: string
  count: number
  averageConfidence: number
  averageAgreement: number
  totalCost: number
}

interface DriftMetrics {
  outputSimilarity: number
  confidenceChange: number
  agreementChange: number
  costChange: number
  performanceChange: number
  overallDriftScore: number
}

interface ModelPerformance {
  totalRuns: number
  successRate: number
  averageConfidence: number
  averageCost: number
  averageProcessingTime: number
}

export default function AdminDriftPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | 'all'>('all')
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<HistoricalStats | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([])
  const [driftMetrics, setDriftMetrics] = useState<DriftMetrics | null>(null)
  const [modelPerformance, setModelPerformance] = useState<Record<string, ModelPerformance>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'drift' | 'performance' | 'history'>('overview')

  useEffect(() => {
    loadData()
  }, [selectedTaskType, days])

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Load stats
      const statsParams = new URLSearchParams()
      if (selectedTaskType !== 'all') {
        statsParams.set('task_type', selectedTaskType)
      }
      statsParams.set('days', days.toString())

      const statsResponse = await fetch(`/api/admin/drift?action=stats&${statsParams}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      // Load time series if task type is selected
      if (selectedTaskType !== 'all') {
        const timeSeriesParams = new URLSearchParams()
        timeSeriesParams.set('task_type', selectedTaskType)
        timeSeriesParams.set('days', days.toString())

        const timeSeriesResponse = await fetch(`/api/admin/drift?action=timeseries&${timeSeriesParams}`)
        if (timeSeriesResponse.ok) {
          const timeSeriesData = await timeSeriesResponse.json()
          setTimeSeries(timeSeriesData.timeSeries)
        }

        // Load drift metrics
        const driftParams = new URLSearchParams()
        driftParams.set('task_type', selectedTaskType)
        driftParams.set('days', days.toString())

        const driftResponse = await fetch(`/api/admin/drift?action=drift-metrics&${driftParams}`)
        if (driftResponse.ok) {
          const driftData = await driftResponse.json()
          setDriftMetrics(driftData.metrics)
        }

        // Load model performance
        const perfParams = new URLSearchParams()
        perfParams.set('task_type', selectedTaskType)
        perfParams.set('days', days.toString())

        const perfResponse = await fetch(`/api/admin/drift?action=model-performance&${perfParams}`)
        if (perfResponse.ok) {
          const perfData = await perfResponse.json()
          setModelPerformance(perfData.performance)
        }
      }
    } catch (error) {
      console.error('Error loading drift data:', error)
      setError('Failed to load drift data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <RoleProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
            <p className="mt-4 text-gray-dark dark:text-gray-300">Loading drift data...</p>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
                  AI Model Drift Detection
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Monitor AI model behavior and detect drift over time
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={loadData}
                  className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                  Task Type
                </label>
                <select
                  value={selectedTaskType}
                  onChange={(e) => setSelectedTaskType(e.target.value as TaskType | 'all')}
                  className="px-3 py-2 border border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#1a1a1a] text-black dark:text-gray"
                >
                  <option value="all">All Tasks</option>
                  <option value="skill_extraction">Skill Extraction</option>
                  <option value="role_clarity">Role Clarity</option>
                  <option value="match_reasoning">Match Reasoning</option>
                  <option value="assessment_scoring">Assessment Scoring</option>
                  <option value="cultural_fit">Cultural Fit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                  Time Period
                </label>
                <select
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#1a1a1a] text-black dark:text-gray"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="180">Last 180 days</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-300 dark:border-[#333333]">
            <nav className="flex space-x-8">
              {(['overview', 'drift', 'performance', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-black dark:border-gray text-black dark:text-gray'
                      : 'border-transparent text-gray-dark dark:text-gray-300 hover:text-black dark:hover:text-gray hover:border-gray-300 dark:hover:border-[#333333]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                    Total Model Runs
                  </h3>
                  <p className="text-3xl font-bold text-black dark:text-gray">
                    {stats.totalRuns.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-dark dark:text-gray-300 mt-2">
                    {stats.totalConsensusResults} consensus results
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                    Average Confidence
                  </h3>
                  <p className="text-3xl font-bold text-black dark:text-gray">
                    {(stats.averageConfidence * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-dark dark:text-gray-300 mt-2">
                    Avg agreement: {(stats.averageAgreement * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                    Total Cost
                  </h3>
                  <p className="text-3xl font-bold text-black dark:text-gray">
                    ${stats.totalCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-dark dark:text-gray-300 mt-2">
                    Avg: ${(stats.totalCost / Math.max(stats.totalRuns, 1)).toFixed(4)} per run
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                    Avg Processing Time
                  </h3>
                  <p className="text-3xl font-bold text-black dark:text-gray">
                    {Math.round(stats.averageProcessingTime)}ms
                  </p>
                  <p className="text-xs text-gray-dark dark:text-gray-300 mt-2">
                    Per model run
                  </p>
                </div>
              </div>

              {/* Task Type Breakdown */}
              {Object.keys(stats.byTaskType).length > 0 && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    Runs by Task Type
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byTaskType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-dark dark:text-gray-300 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-medium text-black dark:text-gray">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Breakdown */}
              {Object.keys(stats.byModel).length > 0 && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    Runs by Model
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byModel).map(([model, count]) => (
                      <div key={model} className="flex justify-between items-center">
                        <span className="text-sm text-gray-dark dark:text-gray-300">
                          {model}
                        </span>
                        <span className="text-sm font-medium text-black dark:text-gray">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Drift Tab */}
          {activeTab === 'drift' && selectedTaskType !== 'all' && (
            <div className="space-y-6">
              {driftMetrics ? (
                <>
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                    <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                      Overall Drift Score
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-8 bg-gray-200 dark:bg-[#333333] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 via-[#004bff] to-red-500 transition-all"
                            style={{ width: `${driftMetrics.overallDriftScore * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-black dark:text-gray">
                        {(driftMetrics.overallDriftScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-dark dark:text-gray-300 mt-2">
                      {driftMetrics.overallDriftScore < 0.2
                        ? 'Low drift - models are stable'
                        : driftMetrics.overallDriftScore < 0.5
                        ? 'Moderate drift - monitor closely'
                        : 'High drift - investigation recommended'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                      <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                        Output Similarity
                      </h3>
                      <p className="text-3xl font-bold text-black dark:text-gray">
                        {(driftMetrics.outputSimilarity * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                      <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                        Confidence Change
                      </h3>
                      <p className={`text-3xl font-bold ${
                        driftMetrics.confidenceChange > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {driftMetrics.confidenceChange > 0 ? '+' : ''}
                        {driftMetrics.confidenceChange.toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                      <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                        Agreement Change
                      </h3>
                      <p className={`text-3xl font-bold ${
                        driftMetrics.agreementChange > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {driftMetrics.agreementChange > 0 ? '+' : ''}
                        {driftMetrics.agreementChange.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <p className="text-gray-dark dark:text-gray-300">
                    Select a task type to view drift metrics
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && selectedTaskType !== 'all' && (
            <div className="space-y-6">
              {Object.keys(modelPerformance).length > 0 ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    Model Performance Comparison
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(modelPerformance).map(([model, perf]) => (
                      <div key={model} className="border-b border-gray-300 dark:border-[#333333] pb-4 last:border-0">
                        <h4 className="font-medium text-black dark:text-gray mb-2">{model}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-dark dark:text-gray-300">Runs:</span>
                            <span className="ml-2 font-medium text-black dark:text-gray">{perf.totalRuns}</span>
                          </div>
                          <div>
                            <span className="text-gray-dark dark:text-gray-300">Success:</span>
                            <span className="ml-2 font-medium text-black dark:text-gray">
                              {(perf.successRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-dark dark:text-gray-300">Confidence:</span>
                            <span className="ml-2 font-medium text-black dark:text-gray">
                              {(perf.averageConfidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-dark dark:text-gray-300">Cost:</span>
                            <span className="ml-2 font-medium text-black dark:text-gray">
                              ${perf.averageCost.toFixed(4)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-dark dark:text-gray-300">Time:</span>
                            <span className="ml-2 font-medium text-black dark:text-gray">
                              {Math.round(perf.averageProcessingTime)}ms
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <p className="text-gray-dark dark:text-gray-300">
                    No performance data available for selected task type
                  </p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && selectedTaskType !== 'all' && (
            <div className="space-y-6">
              {timeSeries.length > 0 ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    Time Series Data
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-[#333333]">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark dark:text-gray-300 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark dark:text-gray-300 uppercase">
                            Count
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark dark:text-gray-300 uppercase">
                            Avg Confidence
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark dark:text-gray-300 uppercase">
                            Avg Agreement
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 dark:divide-[#333333]">
                        {timeSeries.map((item) => (
                          <tr key={item.date}>
                            <td className="px-4 py-3 text-sm text-black dark:text-gray">
                              {item.date}
                            </td>
                            <td className="px-4 py-3 text-sm text-black dark:text-gray">
                              {item.count}
                            </td>
                            <td className="px-4 py-3 text-sm text-black dark:text-gray">
                              {(item.averageConfidence * 100).toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-sm text-black dark:text-gray">
                              {(item.averageAgreement * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <p className="text-gray-dark dark:text-gray-300">
                    No historical data available for selected task type
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  )
}


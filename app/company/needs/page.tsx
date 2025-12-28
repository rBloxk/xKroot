'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'

interface CompanyNeed {
  id: string
  need_type: string
  priority_level: string
  description: string
  required_skills: string[]
  preferred_skills: string[]
  nice_to_have_skills: string[]
  urgency_score: number
  budget_range_min: number | null
  budget_range_max: number | null
  timeline: string | null
  status: string
  created_at: string
}

export default function CompanyNeedsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [needs, setNeeds] = useState<CompanyNeed[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingNeed, setEditingNeed] = useState<CompanyNeed | null>(null)
  const [formData, setFormData] = useState({
    need_type: '',
    priority_level: 'medium',
    description: '',
    required_skills: '',
    preferred_skills: '',
    nice_to_have_skills: '',
    urgency_score: '50',
    budget_range_min: '',
    budget_range_max: '',
    timeline: '',
    status: 'active',
  })

  useEffect(() => {
    loadCompanyProfile()
  }, [])

  const loadCompanyProfile = async () => {
    try {
      const response = await fetch('/api/company/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile?.id) {
          setCompanyId(data.profile.id)
          loadNeeds(data.profile.id)
        } else {
          setError('Please complete your company profile first')
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load profile')
      setIsLoading(false)
    }
  }

  const loadNeeds = async (companyId: string) => {
    try {
      const response = await fetch(`/api/company/needs?company_id=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setNeeds(data.needs || [])
      }
    } catch (error) {
      console.error('Error loading needs:', error)
      setError('Failed to load company needs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    setError('')

    try {
      const url = editingNeed
        ? `/api/company/needs/${editingNeed.id}`
        : '/api/company/needs'
      
      const method = editingNeed ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company_id: companyId,
        }),
      })

      if (response.ok) {
        setFormData({
          need_type: '',
          priority_level: 'medium',
          description: '',
          required_skills: '',
          preferred_skills: '',
          nice_to_have_skills: '',
          urgency_score: '50',
          budget_range_min: '',
          budget_range_max: '',
          timeline: '',
          status: 'active',
        })
        setShowAddForm(false)
        setEditingNeed(null)
        if (companyId) loadNeeds(companyId)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save company need')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  const handleEdit = (need: CompanyNeed) => {
    setEditingNeed(need)
    setFormData({
      need_type: need.need_type,
      priority_level: need.priority_level,
      description: need.description,
      required_skills: Array.isArray(need.required_skills) ? need.required_skills.join(', ') : '',
      preferred_skills: Array.isArray(need.preferred_skills) ? need.preferred_skills.join(', ') : '',
      nice_to_have_skills: Array.isArray(need.nice_to_have_skills) ? need.nice_to_have_skills.join(', ') : '',
      urgency_score: need.urgency_score.toString(),
      budget_range_min: need.budget_range_min?.toString() || '',
      budget_range_max: need.budget_range_max?.toString() || '',
      timeline: need.timeline || '',
      status: need.status,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (needId: string) => {
    if (!confirm('Are you sure you want to delete this company need?')) return

    try {
      const response = await fetch(`/api/company/needs/${needId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (companyId) loadNeeds(companyId)
      } else {
        setError('Failed to delete company need')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  if (isLoading) {
    return (
      <RoleProtectedRoute allowedRoles={['company']}>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
            <p className="mt-4 text-gray-dark dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  return (
    <RoleProtectedRoute allowedRoles={['company']}>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
                  Company Needs
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Define what your company needs to grow
                </p>
              </div>
              <Link
                href="/company/dashboard"
                className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!companyId ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300 mb-4">
                Please complete your company profile first.
              </p>
              <Link
                href="/company/setup"
                className="inline-block px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          ) : (
            <>
              {/* Add/Edit Form */}
              {showAddForm ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 mb-6">
                  <h2 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    {editingNeed ? 'Edit Company Need' : 'Add New Company Need'}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Need Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.need_type}
                          onChange={(e) => setFormData({ ...formData, need_type: e.target.value })}
                          required
                          placeholder="e.g., immediate_hiring, talent_pool, skill_gap"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Priority Level
                        </label>
                        <select
                          value={formData.priority_level}
                          onChange={(e) => setFormData({ ...formData, priority_level: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={4}
                        placeholder="Describe what your company needs..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Required Skills (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={formData.required_skills}
                          onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                          placeholder="e.g., React, Node.js, AWS"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Preferred Skills
                        </label>
                        <input
                          type="text"
                          value={formData.preferred_skills}
                          onChange={(e) => setFormData({ ...formData, preferred_skills: e.target.value })}
                          placeholder="e.g., TypeScript, Docker"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Nice to Have Skills
                        </label>
                        <input
                          type="text"
                          value={formData.nice_to_have_skills}
                          onChange={(e) => setFormData({ ...formData, nice_to_have_skills: e.target.value })}
                          placeholder="e.g., GraphQL, Kubernetes"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Urgency Score (0-100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.urgency_score}
                          onChange={(e) => setFormData({ ...formData, urgency_score: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Budget Min
                        </label>
                        <input
                          type="number"
                          value={formData.budget_range_min}
                          onChange={(e) => setFormData({ ...formData, budget_range_min: e.target.value })}
                          placeholder="e.g., 50000"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Budget Max
                        </label>
                        <input
                          type="number"
                          value={formData.budget_range_max}
                          onChange={(e) => setFormData({ ...formData, budget_range_max: e.target.value })}
                          placeholder="e.g., 100000"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Timeline
                        </label>
                        <input
                          type="text"
                          value={formData.timeline}
                          onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                          placeholder="e.g., ASAP, Q1 2024, 3 months"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                      >
                        <option value="active">Active</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="on_hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false)
                          setEditingNeed(null)
                          setFormData({
                            need_type: '',
                            priority_level: 'medium',
                            description: '',
                            required_skills: '',
                            preferred_skills: '',
                            nice_to_have_skills: '',
                            urgency_score: '50',
                            budget_range_min: '',
                            budget_range_max: '',
                            timeline: '',
                            status: 'active',
                          })
                        }}
                        className="px-4 py-2 text-sm font-medium text-black dark:text-gray bg-white dark:bg-gray-dark/30 hover:bg-gray-50 dark:hover:bg-gray-dark/50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                      >
                        {editingNeed ? 'Update Need' : 'Create Need'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mb-6">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                  >
                    + Add Company Need
                  </button>
                </div>
              )}

              {/* Needs List */}
              {needs.length === 0 ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
                  <p className="text-gray-dark dark:text-gray-300 mb-4">
                    No company needs defined yet. Add your first need to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {needs.map((need) => (
                    <div
                      key={need.id}
                      className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-black dark:text-gray">
                              {need.need_type}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded capitalize ${
                              need.priority_level === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                              need.priority_level === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' :
                              need.priority_level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                              'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
                            }`}>
                              {need.priority_level}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded capitalize ${
                              need.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                              need.status === 'fulfilled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                              need.status === 'on_hold' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                              'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
                            }`}>
                              {need.status}
                            </span>
                          </div>
                          <p className="text-gray-dark dark:text-gray-300 mb-3">{need.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {need.required_skills && need.required_skills.length > 0 && (
                              <div>
                                <span className="font-medium text-black dark:text-gray">Required: </span>
                                <span className="text-gray-dark dark:text-gray-300">
                                  {Array.isArray(need.required_skills) ? need.required_skills.join(', ') : need.required_skills}
                                </span>
                              </div>
                            )}
                            {need.timeline && (
                              <div>
                                <span className="font-medium text-black dark:text-gray">Timeline: </span>
                                <span className="text-gray-dark dark:text-gray-300">{need.timeline}</span>
                              </div>
                            )}
                            {(need.budget_range_min || need.budget_range_max) && (
                              <div>
                                <span className="font-medium text-black dark:text-gray">Budget: </span>
                                <span className="text-gray-dark dark:text-gray-300">
                                  ${need.budget_range_min || '0'} - ${need.budget_range_max || '∞'}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-black dark:text-gray">Urgency: </span>
                              <span className="text-gray-dark dark:text-gray-300">{need.urgency_score}/100</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(need)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(need.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  )
}


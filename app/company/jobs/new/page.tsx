'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'
import RoleClarityAssistant from '@/components/company/RoleClarityAssistant'

export default function NewJobPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyNeeds, setCompanyNeeds] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [useRoleClarity, setUseRoleClarity] = useState(false)
  const [companyStage, setCompanyStage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    company_need_id: '',
    role_title: '',
    role_level: '',
    department: '',
    job_description: '',
    required_skills: '{}',
    preferred_qualifications: '',
    responsibilities: '',
    work_type: '',
    location: '',
    salary_min: '',
    salary_max: '',
    equity_offered: false,
    benefits: '',
    application_deadline: '',
  })

  useEffect(() => {
    loadCompanyData()
  }, [])

  const loadCompanyData = async () => {
    try {
      // Load company profile
      const profileResponse = await fetch('/api/company/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.profile?.id) {
          setCompanyId(profileData.profile.id)
          setCompanyStage(profileData.profile.startup_stage || null)
          
          // Load company needs
          const needsResponse = await fetch(`/api/company/needs?company_id=${profileData.profile.id}`)
          if (needsResponse.ok) {
            const needsData = await needsResponse.json()
            setCompanyNeeds(needsData.needs || [])
          }
        } else {
          setError('Please complete your company profile first')
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error)
      setError('Failed to load company data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    setError('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company_id: companyId,
          company_need_id: formData.company_need_id || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/company/jobs')
      } else {
        setError(data.error || 'Failed to create job posting')
        setIsSaving(false)
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
                  Create New Job Posting
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Post a job to find the right candidates
                </p>
              </div>
              <Link
                href="/company/jobs"
                className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
              >
                ← Back to Jobs
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
          ) : useRoleClarity ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-black dark:text-gray mb-2">
                  AI Role Clarity Assistant
                </h2>
                <p className="text-sm text-gray-dark dark:text-gray-300 mb-4">
                  Answer a few questions to help us understand what you're looking for. We'll generate a structured job posting for you.
                </p>
                <button
                  onClick={() => setUseRoleClarity(false)}
                  className="text-sm text-gray-dark dark:text-gray-300 hover:text-black dark:hover:text-gray"
                >
                  ← Or fill out manually
                </button>
              </div>
              <RoleClarityAssistant
                onComplete={(roleRequirements) => {
                  // Populate form with generated requirements
                  setFormData({
                    ...formData,
                    role_title: roleRequirements.role_title,
                    role_level: roleRequirements.role_level,
                    job_description: roleRequirements.job_description,
                    required_skills: JSON.stringify(roleRequirements.required_skills),
                    responsibilities: roleRequirements.responsibilities.join('\n'),
                  })
                  setUseRoleClarity(false)
                }}
                companyStage={companyStage || undefined}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 space-y-6">
              {/* Role Clarity Assistant Option */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                      Need help defining the role?
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Use our AI Role Clarity Assistant to answer a few questions and automatically generate a structured job posting.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseRoleClarity(true)}
                    className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors"
                  >
                    Use Assistant
                  </button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black dark:text-gray">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                    Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="role_title"
                    value={formData.role_title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      Role Level
                    </label>
                    <select
                      name="role_level"
                      value={formData.role_level}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                    >
                      <option value="">Select...</option>
                      <option value="intern">Intern</option>
                      <option value="junior">Junior</option>
                      <option value="mid">Mid-level</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead</option>
                      <option value="principal">Principal</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g., Engineering, Product, Design"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                    Related Company Need (Optional)
                  </label>
                  <select
                    name="company_need_id"
                    value={formData.company_need_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                  >
                    <option value="">None</option>
                    {companyNeeds.filter(n => n.status === 'active').map((need) => (
                      <option key={need.id} value={need.id}>
                        {need.need_type} - {need.description.substring(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="job_description"
                    value={formData.job_description}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Skills & Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black dark:text-gray">Skills & Requirements</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                    Required Skills (JSON format)
                  </label>
                  <textarea
                    name="required_skills"
                    value={formData.required_skills}
                    onChange={handleChange}
                    rows={4}
                    placeholder='{"technical": ["React", "Node.js"], "soft": ["Communication", "Leadership"]}'
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-dark dark:text-gray-300">
                    Enter skills as JSON object with categories
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                    Preferred Qualifications (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="preferred_qualifications"
                    value={formData.preferred_qualifications}
                    onChange={handleChange}
                    placeholder="e.g., 5+ years experience, Master's degree, Startup experience"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                    Responsibilities (one per line)
                  </label>
                  <textarea
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleChange}
                    rows={4}
                    placeholder="List key responsibilities, one per line..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Work Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black dark:text-gray">Work Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      Work Type
                    </label>
                    <select
                      name="work_type"
                      value={formData.work_type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                    >
                      <option value="">Select...</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., San Francisco, CA or Remote"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      Salary Min
                    </label>
                    <input
                      type="number"
                      name="salary_min"
                      value={formData.salary_min}
                      onChange={handleChange}
                      placeholder="e.g., 80000"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      Salary Max
                    </label>
                    <input
                      type="number"
                      name="salary_max"
                      value={formData.salary_max}
                      onChange={handleChange}
                      placeholder="e.g., 120000"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="equity_offered"
                    id="equity_offered"
                    checked={formData.equity_offered}
                    onChange={handleChange}
                    className="w-4 h-4 text-black dark:text-gray border-gray-300 dark:border-[#333333] rounded focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07]"
                  />
                  <label htmlFor="equity_offered" className="text-sm font-medium text-gray-dark dark:text-gray-300">
                    Equity Offered
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                    Benefits (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleChange}
                    placeholder="e.g., Health Insurance, Remote Work, Stock Options"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="application_deadline"
                    value={formData.application_deadline}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Link
                  href="/company/jobs"
                  className="px-6 py-2 text-sm font-medium text-black dark:text-gray bg-white dark:bg-gray-dark/30 hover:bg-gray-50 dark:hover:bg-gray-dark/50 rounded-lg transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Creating...' : 'Create Job Posting'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  )
}


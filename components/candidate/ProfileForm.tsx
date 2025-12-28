'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ProfileFormProps {
  onComplete: () => void
}

interface Field {
  id: string
  question: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'url' | 'resume'
  required: boolean
  placeholder?: string
  helperText?: string
  options?: Array<{ value: string; label: string }>
}

// Common position titles for autocomplete suggestions
const POSITION_SUGGESTIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Lead Software Engineer',
  'Principal Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Mobile Developer',
  'iOS Developer',
  'Android Developer',
  'Data Scientist',
  'Data Engineer',
  'Data Analyst',
  'Machine Learning Engineer',
  'AI Engineer',
  'Product Manager',
  'Senior Product Manager',
  'Product Designer',
  'UX Designer',
  'UI Designer',
  'UX/UI Designer',
  'Graphic Designer',
  'Marketing Manager',
  'Digital Marketing Specialist',
  'Content Marketing Manager',
  'Sales Manager',
  'Business Development Manager',
  'Account Manager',
  'Customer Success Manager',
  'Operations Manager',
  'Project Manager',
  'Scrum Master',
  'QA Engineer',
  'QA Automation Engineer',
  'Security Engineer',
  'Cloud Engineer',
  'Systems Administrator',
  'Database Administrator',
  'Technical Writer',
  'Business Analyst',
  'Financial Analyst',
  'HR Manager',
  'Recruiter',
  'Legal Counsel',
  'Consultant',
  'Freelancer',
  'Student',
  'Intern',
  'Entry Level',
]

// Education level suggestions
const EDUCATION_LEVEL_SUGGESTIONS = [
  'High School Diploma',
  'Associate Degree',
  "Bachelor's Degree",
  "Bachelor's in Computer Science",
  "Bachelor's in Software Engineering",
  "Bachelor's in Information Technology",
  "Bachelor's in Data Science",
  "Bachelor's in Business Administration",
  "Bachelor's in Marketing",
  "Bachelor's in Finance",
  "Bachelor's in Engineering",
  "Bachelor's in Electrical Engineering",
  "Bachelor's in Mechanical Engineering",
  "Master's Degree",
  "Master's in Computer Science",
  "Master's in Software Engineering",
  "Master's in Data Science",
  "Master's in Business Administration (MBA)",
  "Master's in Information Systems",
  "Master's in Engineering",
  "Master's in Artificial Intelligence",
  "Master's in Machine Learning",
  'Doctorate (PhD)',
  'PhD in Computer Science',
  'PhD in Data Science',
  'PhD in Engineering',
  'Professional Certificate',
  'Bootcamp Graduate',
  'Self-Taught',
  'Online Course Completion',
  'Industry Certification',
  'Technical Diploma',
  'Vocational Training',
]

const PROFILE_FIELDS: Field[] = [
  {
    id: 'bio',
    question: 'Tell us about yourself',
    type: 'textarea',
    required: true,
    placeholder: 'Share a brief bio about your background, interests, and what drives you...',
    helperText: 'This helps companies get to know you better',
  },
  {
    id: 'location',
    question: 'Where are you located?',
    type: 'text',
    required: true,
    placeholder: 'e.g., San Francisco, CA or Remote',
  },
  {
    id: 'current_position',
    question: 'What is your current position?',
    type: 'text',
    required: true,
    placeholder: 'e.g., Senior Software Engineer, Product Designer, Data Scientist',
  },
  {
    id: 'years_experience',
    question: 'How many years of professional experience do you have?',
    type: 'number',
    required: false,
    placeholder: 'Enter 0 if you are a fresher',
    helperText: 'Enter 0 if you are a fresher or have less than 1 year of experience',
  },
  {
    id: 'education_level',
    question: 'What is your education level?',
    type: 'text',
    required: false,
    placeholder: 'e.g., Bachelor\'s in Computer Science, Master\'s in Data Science',
  },
  {
    id: 'availability_status',
    question: 'What is your availability status?',
    type: 'select',
    required: false,
    options: [
      { value: 'available', label: 'Available' },
      { value: 'open', label: 'Open to Opportunities' },
      { value: 'not_looking', label: 'Not Looking' },
      { value: 'passive', label: 'Passive' },
    ],
  },
  {
    id: 'preferred_work_type',
    question: 'What is your preferred work arrangement?',
    type: 'select',
    required: false,
    options: [
      { value: 'remote', label: 'Fully Remote' },
      { value: 'hybrid', label: 'Hybrid (Remote + Office)' },
      { value: 'onsite', label: 'On-site' },
      { value: 'flexible', label: 'Flexible' },
    ],
  },
  {
    id: 'preferred_location',
    question: 'Where would you prefer to work?',
    type: 'text',
    required: false,
    placeholder: 'e.g., San Francisco, CA or Anywhere Remote',
  },
  {
    id: 'salary_expectation_min',
    question: 'What is your minimum salary expectation?',
    type: 'number',
    required: false,
    placeholder: 'e.g., 80000',
    helperText: 'Enter your minimum expected annual salary',
  },
  {
    id: 'salary_expectation_max',
    question: 'What is your maximum salary expectation?',
    type: 'number',
    required: false,
    placeholder: 'e.g., 120000',
    helperText: 'Enter your maximum expected annual salary',
  },
  {
    id: 'linkedin_url',
    question: 'What is your LinkedIn profile URL?',
    type: 'url',
    required: false,
    placeholder: 'https://linkedin.com/in/yourprofile',
  },
  {
    id: 'github_url',
    question: 'What is your GitHub profile URL?',
    type: 'url',
    required: false,
    placeholder: 'https://github.com/yourusername',
  },
  {
    id: 'portfolio_url',
    question: 'What is your portfolio website URL?',
    type: 'url',
    required: false,
    placeholder: 'https://yourportfolio.com',
  },
  {
    id: 'resume',
    question: 'Add your resume',
    type: 'resume',
    required: false,
    placeholder: 'Paste your resume content here for AI processing...',
    helperText: 'Upload a PDF file or paste your resume text. This helps our AI better understand your skills and experience',
  },
]

export default function ProfileForm({ onComplete }: ProfileFormProps) {
  const [formData, setFormData] = useState<Record<string, string | number>>({})
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [fieldHistory, setFieldHistory] = useState<number[]>([])
  const [resumeUploadMode, setResumeUploadMode] = useState<'upload' | 'paste'>('upload')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [resumeFileName, setResumeFileName] = useState<string>('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset suggestions when field changes
  useEffect(() => {
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedSuggestionIndex(-1)
  }, [currentFieldIndex])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/candidate/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          const loadedData: Record<string, string | number> = {
            bio: data.profile.bio || '',
            location: data.profile.location || '',
            current_position: data.profile.current_position || '',
            years_experience: data.profile.years_experience?.toString() || '',
            education_level: data.profile.education_level || '',
            availability_status: data.profile.availability_status || 'available',
            salary_expectation_min: data.profile.salary_expectation_min?.toString() || '',
            salary_expectation_max: data.profile.salary_expectation_max?.toString() || '',
            preferred_work_type: data.profile.preferred_work_type || '',
            preferred_location: data.profile.preferred_location || '',
            linkedin_url: data.profile.linkedin_url || '',
            github_url: data.profile.github_url || '',
            portfolio_url: data.profile.portfolio_url || '',
            raw_resume_text: data.profile.raw_resume_text || '',
            resume_file_url: data.profile.resume_file_url || '',
          }
          
          // Set resume mode based on what's available
          if (data.profile.resume_file_url) {
            setResumeUploadMode('upload')
            const fileName = data.profile.resume_file_url.split('/').pop() || ''
            setResumeFileName(fileName)
            // Set the resume_file_url in formData so it's available for preview
            setFormData(prev => ({ ...prev, resume_file_url: data.profile.resume_file_url }))
          } else if (data.profile.raw_resume_text) {
            setResumeUploadMode('paste')
          }
          setFormData(loadedData)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentField = PROFILE_FIELDS[currentFieldIndex]
  const currentValue = currentField?.type === 'resume' 
    ? (resumeUploadMode === 'upload' ? formData.resume_file_url : formData.raw_resume_text) || ''
    : formData[currentField?.id] || ''

  const handleNext = async () => {
    if (!currentField) return

    // Special handling for resume field
    if (currentField.type === 'resume') {
      if (resumeUploadMode === 'upload' && !resumeFile && !formData.resume_file_url) {
        setError('Please upload a PDF file or switch to paste mode')
        return
      } else if (resumeUploadMode === 'paste' && !formData.raw_resume_text) {
        setError('Please paste your resume text or switch to upload mode')
        return
      }
      
      // If uploading, upload the file first
      if (resumeUploadMode === 'upload' && resumeFile) {
        await uploadResumeFile()
        // Continue after upload completes
        if (currentFieldIndex === PROFILE_FIELDS.length - 1) {
          await saveProfile()
        } else {
          setFieldHistory(prev => [...prev, currentFieldIndex])
          setCurrentFieldIndex(prev => prev + 1)
          setError('')
        }
        return
      }
    }

    // Validation
    if (currentField.required) {
      if (currentField.type === 'number') {
        if (currentValue === '' || currentValue === null || currentValue === undefined) {
          setError(`${currentField.question} is required`)
          return
        }
      } else if (!currentValue || currentValue === '') {
        setError(`${currentField.question} is required`)
        return
      }
    }

    // If this is the last field, save the entire profile
    if (currentFieldIndex === PROFILE_FIELDS.length - 1) {
      await saveProfile()
    } else {
      // Move to next field
      setFieldHistory(prev => [...prev, currentFieldIndex])
      setCurrentFieldIndex(prev => prev + 1)
      setError('')
    }
  }

  const uploadResumeFile = async () => {
    if (!resumeFile) return

    setIsUploadingResume(true)
    setError('')

    try {
      // Check for session before uploading
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to upload images')
        setIsUploadingResume(false)
        return
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', resumeFile)
      uploadFormData.append('type', 'resume')

      const response = await fetch('/api/candidate/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: uploadFormData,
      })

      const data = await response.json()

      if (response.ok) {
        setFormData(prev => ({ ...prev, resume_file_url: data.url, raw_resume_text: '' }))
        setResumeFileName(resumeFile.name)
      } else {
        setError(data.error || 'Failed to upload resume')
        setIsUploadingResume(false)
        return
      }
    } catch (error: any) {
      setError(error.message || 'Failed to upload resume')
      setIsUploadingResume(false)
      return
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file only')
        return
      }
      // Validate file size (20MB max)
      if (file.size > 20 * 1024 * 1024) {
        setError('File size exceeds 20MB limit')
        return
      }
      setResumeFile(file)
      setResumeFileName(file.name)
      setError('')
      // Clear text resume if uploading file
      setFormData(prev => ({ ...prev, raw_resume_text: '' }))
    }
  }

  const handleBack = () => {
    if (fieldHistory.length === 0) return

    const newHistory = [...fieldHistory]
    const previousIndex = newHistory.pop()
    
    if (previousIndex !== undefined) {
      setFieldHistory(newHistory)
      setCurrentFieldIndex(previousIndex)
      setError('')
    }
  }

  const saveProfile = async () => {
    setIsSaving(true)
    setError('')

    try {
      // Prepare data - ensure resume_file_url is included if uploaded
      const profileData = { ...formData }
      
      // If resume was uploaded, make sure we have the URL
      if (resumeUploadMode === 'upload' && resumeFile && !profileData.resume_file_url) {
        await uploadResumeFile()
        // Wait a bit for the upload to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const response = await fetch('/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (response.ok) {
        setCompleted(true)
        setTimeout(() => {
          onComplete()
        }, 1500)
      } else {
        setError(data.error || 'Failed to save profile')
        setIsSaving(false)
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setIsSaving(false)
    }
  }

  const handleChange = (value: string | number) => {
    setFormData(prev => ({ ...prev, [currentField.id]: value }))
    setError('')
  }

  // Handle suggestions for fields with autocomplete
  const handleSuggestionsInput = (value: string) => {
    handleChange(value)
    
    // Show suggestions for fields that support autocomplete
    if (currentField?.id === 'current_position' || currentField?.id === 'education_level') {
      const searchTerm = value.toLowerCase().trim()
      
      if (searchTerm.length > 0) {
        const suggestionsList = currentField.id === 'current_position' 
          ? POSITION_SUGGESTIONS 
          : EDUCATION_LEVEL_SUGGESTIONS
        
        const filtered = suggestionsList.filter(item =>
          item.toLowerCase().includes(searchTerm) &&
          item.toLowerCase() !== searchTerm
        ).slice(0, 8)
        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
        setSelectedSuggestionIndex(-1)
      } else {
        setShowSuggestions(false)
        setSuggestions([])
      }
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  const insertSuggestion = (suggestion: string) => {
    if (!currentField || (currentField.id !== 'current_position' && currentField.id !== 'education_level')) return
    
    handleChange(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedSuggestionIndex(-1)
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isSuggestionsField = currentField?.id === 'current_position' || currentField?.id === 'education_level'
    
    if (showSuggestions && suggestions.length > 0 && isSuggestionsField) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault()
        insertSuggestion(suggestions[selectedSuggestionIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setSuggestions([])
        setSelectedSuggestionIndex(-1)
      } else if (e.key === 'Enter' && selectedSuggestionIndex === -1) {
        // Allow Enter to proceed if no suggestion is selected
        e.preventDefault()
        handleNext()
      }
    } else if (e.key === 'Enter' && currentField && currentField.type !== 'textarea' && currentField.type !== 'resume') {
      e.preventDefault()
      handleNext()
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentField && currentField.type !== 'textarea' && currentField.type !== 'resume') {
      e.preventDefault()
      handleNext()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-[#ffdf07] mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-[#ffdf07] dark:text-[#ffdf07] text-6xl mb-6">✓</div>
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            Profile Complete!
          </h2>
          <p className="text-lg text-gray-dark dark:text-gray-400">
            Your profile has been saved successfully.
          </p>
        </div>
      </div>
    )
  }

  if (!currentField) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-dark dark:text-gray-300">No fields available</p>
        </div>
      </div>
    )
  }

  const progressPercentage = ((currentFieldIndex + 1) / PROFILE_FIELDS.length) * 100
  const canGoBack = fieldHistory.length > 0
  const isLastField = currentFieldIndex === PROFILE_FIELDS.length - 1

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-dark dark:text-gray-400">
            Field {currentFieldIndex + 1} of {PROFILE_FIELDS.length}
          </span>
          <span className="text-sm font-medium text-gray-dark dark:text-gray-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#ffdf07] dark:bg-[#ffdf07] transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Question Label */}
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4 leading-tight">
              {currentField.question}
              {currentField.required && (
                <span className="text-red-500 ml-2">*</span>
              )}
            </h2>
            {currentField.helperText && (
              <p className="text-lg text-gray-dark dark:text-gray-400">
                {currentField.helperText}
              </p>
            )}
          </div>

          {/* Input Field */}
          <div className="mb-12">
            {currentField.type === 'resume' ? (
              <div className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setResumeUploadMode('upload')
                      setError('')
                    }}
                    className={`px-6 py-3 text-lg font-medium rounded-xl transition-all duration-200 ${
                      resumeUploadMode === 'upload'
                        ? 'bg-[#ffdf07] text-black shadow-lg'
                        : 'bg-gray-200 dark:bg-[#333333] text-black dark:text-white hover:bg-gray-300 dark:hover:bg-[#444444]'
                    }`}
                  >
                    Upload PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeUploadMode('paste')
                      setResumeFile(null)
                      setResumeFileName('')
                      setError('')
                    }}
                    className={`px-6 py-3 text-lg font-medium rounded-xl transition-all duration-200 ${
                      resumeUploadMode === 'paste'
                        ? 'bg-[#ffdf07] text-black shadow-lg'
                        : 'bg-gray-200 dark:bg-[#333333] text-black dark:text-white hover:bg-gray-300 dark:hover:bg-[#444444]'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>

                {/* Upload Mode */}
                {resumeUploadMode === 'upload' && (
                  <div className="space-y-4">
                    {/* Show PDF Preview if resume is already uploaded */}
                    {formData.resume_file_url && !resumeFile ? (
                      <div className="space-y-4">
                        <div className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                                  {resumeFileName || 'Resume.pdf'}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">Resume uploaded successfully</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setResumeFile(null)
                                setResumeFileName('')
                                setFormData(prev => ({ ...prev, resume_file_url: '' }))
                              }}
                              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                        {/* PDF Preview */}
                        <div className="w-full border-2 border-gray-300 dark:border-[#333333] rounded-2xl overflow-hidden">
                          <iframe
                            src={`${formData.resume_file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                            className="w-full h-[600px]"
                            title="Resume Preview"
                            style={{ minHeight: '600px' }}
                          />
                        </div>
                        {/* Upload New File Option */}
                        <div className="text-center">
                          <label htmlFor="resume-upload" className="inline-block px-6 py-3 text-lg font-medium text-black dark:text-white bg-gray-200 dark:bg-[#333333] rounded-xl hover:bg-gray-300 dark:hover:bg-[#444444] transition-colors cursor-pointer">
                            Upload New Resume
                          </label>
                          <input
                            id="resume-upload"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleResumeFileChange}
                            className="hidden"
                            disabled={isUploadingResume}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Upload Area (when no resume uploaded or replacing) */
                      <>
                        <label htmlFor="resume-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-[#333333] border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-12 h-12 mb-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-xl text-gray-700 dark:text-gray-300">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-lg text-gray-500 dark:text-gray-400">PDF (MAX. 20MB)</p>
                          </div>
                          <input
                            id="resume-upload"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleResumeFileChange}
                            className="hidden"
                            disabled={isUploadingResume}
                          />
                        </label>
                        {resumeFileName && !formData.resume_file_url && (
                          <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                            <p className="text-lg text-blue-800 dark:text-blue-200">
                              Selected: {resumeFileName}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Click "Next" to upload</p>
                          </div>
                        )}
                        {isUploadingResume && (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffdf07] mx-auto"></div>
                            <p className="mt-2 text-gray-dark dark:text-gray-300">Uploading...</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Paste Mode */}
                {resumeUploadMode === 'paste' && (
                  <textarea
                    value={(formData.raw_resume_text as string) || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, raw_resume_text: e.target.value, resume_file_url: '' }))
                      setError('')
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={currentField.placeholder}
                    required={currentField.required}
                    rows={8}
                    className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#ffdf07]/30 dark:focus:ring-[#ffdf07]/30 focus:border-[#ffdf07] dark:focus:border-[#ffdf07] transition-all duration-200 resize-none"
                    style={{ minHeight: '200px' }}
                  />
                )}
              </div>
            ) : currentField.type === 'textarea' ? (
              <textarea
                value={currentValue as string}
                onChange={(e) => handleChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentField.placeholder}
                required={currentField.required}
                rows={6}
                className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#ffdf07]/30 dark:focus:ring-[#ffdf07]/30 focus:border-[#ffdf07] dark:focus:border-[#ffdf07] transition-all duration-200 resize-none"
                style={{ minHeight: '150px' }}
              />
            ) : currentField.type === 'select' ? (
              <select
                value={currentValue as string}
                onChange={(e) => handleChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#ffdf07]/30 dark:focus:ring-[#ffdf07]/30 focus:border-[#ffdf07] dark:focus:border-[#ffdf07] transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="">{currentField.placeholder || 'Select an option...'}</option>
                {currentField.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : currentField.type === 'number' ? (
              <input
                type="number"
                value={currentValue === '' || currentValue === null || currentValue === undefined ? '' : currentValue}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    handleChange('')
                  } else if (!isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
                    const numValue = parseFloat(value)
                    handleChange(isNaN(numValue) ? '' : numValue)
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder={currentField.placeholder}
                required={currentField.required}
                min="0"
                step="0.5"
                className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#ffdf07]/30 dark:focus:ring-[#ffdf07]/30 focus:border-[#ffdf07] dark:focus:border-[#ffdf07] transition-all duration-200"
              />
            ) : (
              <div className="relative">
                <input
                  ref={(currentField.id === 'current_position' || currentField.id === 'education_level') ? inputRef : undefined}
                  type={currentField.type}
                  value={currentValue as string}
                  onChange={(e) => {
                    if (currentField.id === 'current_position' || currentField.id === 'education_level') {
                      handleSuggestionsInput(e.target.value)
                    } else {
                      handleChange(e.target.value)
                    }
                  }}
                  onKeyDown={(currentField.id === 'current_position' || currentField.id === 'education_level') ? handleInputKeyDown : undefined}
                  onKeyPress={(currentField.id === 'current_position' || currentField.id === 'education_level') ? undefined : handleKeyPress}
                  placeholder={currentField.placeholder}
                  required={currentField.required}
                  className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#ffdf07]/30 dark:focus:ring-[#ffdf07]/30 focus:border-[#ffdf07] dark:focus:border-[#ffdf07] transition-all duration-200"
                />
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (currentField.id === 'current_position' || currentField.id === 'education_level') && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-[#333333] rounded-xl shadow-xl max-h-64 overflow-y-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => insertSuggestion(suggestion)}
                        className={`w-full text-left px-4 py-3 text-lg hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors ${
                          index === selectedSuggestionIndex
                            ? 'bg-[#ffdf07]/10 dark:bg-[#ffdf07]/20 border-l-4 border-[#ffdf07]'
                            : 'border-l-4 border-transparent'
                        }`}
                      >
                        <span className="text-black dark:text-white">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4">
            {canGoBack && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSaving}
                className="px-8 py-4 text-xl font-bold text-black dark:text-white bg-gray-200 dark:bg-[#333333] rounded-xl hover:bg-gray-300 dark:hover:bg-[#444444] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isSaving || isUploadingResume || (currentField.required && (
                currentField.type === 'number' 
                  ? (currentValue === '' || currentValue === null || currentValue === undefined)
                  : currentField.type === 'resume'
                    ? (resumeUploadMode === 'upload' ? (!resumeFile && !formData.resume_file_url) : !formData.raw_resume_text)
                    : (!currentValue || currentValue === '')
              ))}
              className="px-12 py-4 text-xl font-bold text-black bg-[#ffdf07] dark:bg-[#ffdf07] rounded-xl hover:bg-[#ffdf07]/90 dark:hover:bg-[#ffdf07]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {isSaving ? 'Saving...' : isUploadingResume ? 'Uploading...' : isLastField ? 'Save Profile' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

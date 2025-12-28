'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  published: boolean
  published_at?: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [showLogin, setShowLogin] = useState(true)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [postForm, setPostForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: 'xkroot Team',
    category: 'General',
    tags: '',
    featuredImage: '',
    published: false,
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null)
  const [activeTab, setActiveTab] = useState<'blog' | 'jobs' | 'messages' | 'admins'>('blog')
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [adminError, setAdminError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null)
  const [filterRead, setFilterRead] = useState<string>('all')
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    salaryRange: '',
    applicationEmail: '',
    applicationUrl: '',
    published: false,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify')
      if (response.ok) {
        setAuthenticated(true)
        setShowLogin(false)
        fetchPosts()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (response.ok) {
        setAuthenticated(true)
        setShowLogin(false)
        fetchPosts()
      } else {
        setLoginError(data.error || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      setLoginError('Network error. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog')
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams()
      if (filterRead !== 'all') {
        params.append('read', filterRead)
      }
      const response = await fetch(`/api/contact/messages?${params.toString()}`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleEdit = async (post: BlogPost) => {
    try {
      // Fetch full post data including content
      const response = await fetch(`/api/blog/${post.slug}`)
      const data = await response.json()

      if (response.ok && data.post) {
        setPostForm({
          title: data.post.title || '',
          excerpt: data.post.excerpt || '',
          content: data.post.content || '',
          author: data.post.author || 'xkroot Team',
          category: data.post.category || 'General',
          tags: Array.isArray(data.post.tags) ? data.post.tags.join(', ') : '',
          featuredImage: data.post.featured_image || '',
          published: data.post.published || false,
        })
        setEditingSlug(post.slug)
        setPreviewUrl(data.post.featured_image || null)
        setPreviewType(
          data.post.featured_image && isVideoUrl(data.post.featured_image) ? 'video' : 
          data.post.featured_image ? 'image' : null
        )
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        alert('Failed to load post for editing')
      }
    } catch (error) {
      alert('Failed to load post for editing. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setEditingSlug(null)
    setPostForm({
      title: '',
      excerpt: '',
      content: '',
      author: 'xkroot Team',
      category: 'General',
      tags: '',
      featuredImage: '',
      published: false,
    })
    setPreviewUrl(null)
    setPreviewType(null)
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        setAuthenticated(false)
        setShowLogin(true)
        // Clear any local state
        setPosts([])
        setJobs([])
        setMessages([])
        setEditingSlug(null)
        // Redirect to home or stay on admin page (will show login)
        router.push('/admin')
      } else {
        alert('Failed to logout. Please try again.')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if API call fails, clear local state and show login
      setAuthenticated(false)
      setShowLogin(true)
      router.push('/admin')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEditing = editingSlug !== null
      const url = isEditing ? `/api/blog/${editingSlug}` : '/api/blog'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postForm,
          tags: postForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(isEditing ? 'Blog post updated successfully!' : 'Blog post created successfully!')
        setPostForm({
          title: '',
          excerpt: '',
          content: '',
          author: 'xkroot Team',
          category: 'General',
          tags: '',
          featuredImage: '',
          published: false,
        })
        setEditingSlug(null)
        setPreviewUrl(null)
        setPreviewType(null)
        fetchPosts()
      } else {
        alert(data.error || `Failed to ${isEditing ? 'update' : 'create'} post`)
      }
    } catch (error) {
      alert(`Failed to ${editingSlug ? 'update' : 'create'} post. Please try again.`)
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/blog/${slug}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Post deleted successfully!')
        fetchPosts()
      } else {
        alert('Failed to delete post')
      }
    } catch (error) {
      alert('Failed to delete post. Please try again.')
    }
  }

  const togglePublish = async (post: BlogPost) => {
    try {
      const response = await fetch(`/api/blog/${post.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      })

      if (response.ok) {
        fetchPosts()
      } else {
        alert('Failed to update post')
      }
    } catch (error) {
      alert('Failed to update post. Please try again.')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      alert('Please upload an image or video file')
      return
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB')
      return
    }

    // Create preview URL
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setPreviewType(isImage ? 'image' : 'video')

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setPostForm({ ...postForm, featuredImage: data.url })
        setUploadProgress(100)
        // Keep preview for uploaded file
        setPreviewUrl(data.url)
        alert('File uploaded successfully!')
      } else {
        alert(data.error || 'Failed to upload file')
        setPreviewUrl(null)
        setPreviewType(null)
      }
    } catch (error) {
      alert('Failed to upload file. Please try again.')
      setPreviewUrl(null)
      setPreviewType(null)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Clean up blob URL after upload completes
      if (preview && preview.startsWith('blob:')) {
        setTimeout(() => {
          URL.revokeObjectURL(preview)
        }, 1000)
      }
    }
  }

  const removeImage = () => {
    setPostForm({ ...postForm, featuredImage: '' })
    setPreviewUrl(null)
    setPreviewType(null)
  }

  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi']
    return videoExtensions.some(ext => url.toLowerCase().includes(ext))
  }

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobForm,
          requirements: jobForm.requirements.split('\n').filter(Boolean),
          responsibilities: jobForm.responsibilities.split('\n').filter(Boolean),
          benefits: jobForm.benefits.split('\n').filter(Boolean),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Job created successfully!')
        setJobForm({
          title: '',
          department: '',
          location: '',
          type: 'Full-time',
          description: '',
          requirements: '',
          responsibilities: '',
          benefits: '',
          salaryRange: '',
          applicationEmail: '',
          applicationUrl: '',
          published: false,
        })
        fetchJobs()
      } else {
        alert(data.error || 'Failed to create job')
      }
    } catch (error) {
      alert('Failed to create job. Please try again.')
    }
  }

  const handleJobDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      const response = await fetch(`/api/jobs/${slug}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Job deleted successfully!')
        fetchJobs()
      } else {
        alert('Failed to delete job')
      }
    } catch (error) {
      alert('Failed to delete job. Please try again.')
    }
  }

  const toggleJobPublish = async (job: any) => {
    try {
      const response = await fetch(`/api/jobs/${job.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !job.published }),
      })

      if (response.ok) {
        fetchJobs()
      } else {
        alert('Failed to update job')
      }
    } catch (error) {
      alert('Failed to update job. Please try again.')
    }
  }

  const toggleMessageRead = async (message: any) => {
    try {
      const response = await fetch(`/api/contact/messages/${message.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !message.read }),
      })

      if (response.ok) {
        fetchMessages()
        if (selectedMessage?.id === message.id) {
          setSelectedMessage({ ...message, read: !message.read })
        }
      } else {
        alert('Failed to update message')
      }
    } catch (error) {
      alert('Failed to update message. Please try again.')
    }
  }

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/contact/messages/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (selectedMessage?.id === id) {
          setSelectedMessage(null)
        }
        fetchMessages()
      } else {
        alert('Failed to delete message')
      }
    } catch (error) {
      alert('Failed to delete message. Please try again.')
    }
  }

  useEffect(() => {
    if (activeTab === 'messages' && authenticated) {
      fetchMessages()
    }
  }, [filterRead, activeTab, authenticated])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    )
  }

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beige-light via-purple-50 to-beige-light dark:from-black dark:via-purple-950/20 dark:to-black p-4 transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="glass rounded-3xl p-8 md:p-10 border border-white/20 dark:border-gray-dark/30 backdrop-blur-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-gray">Admin Login</h1>
              <p className="text-sm text-gray-dark dark:text-gray-dark">Enter your credentials to access the dashboard</p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700 dark:text-red-400">{loginError}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, username: e.target.value })
                      setLoginError('')
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-strong text-black dark:text-gray placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter your username or email"
                    required
                    disabled={loginLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, password: e.target.value })
                      setLoginError('')
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-strong text-black dark:text-gray placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                    disabled={loginLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer Note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-dark dark:text-gray-dark">
                Secure admin access • Protected by Supabase Auth
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige-light dark:bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-gray">Admin Dashboard</h1>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/blog"
              className="glass-strong px-6 py-3 rounded-lg text-black dark:text-gray font-semibold hover:scale-105 transition-transform"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Blog
            </Link>
            <Link
              href="/jobs"
              className="glass-strong px-6 py-3 rounded-lg text-black dark:text-gray font-semibold hover:scale-105 transition-transform"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Jobs
            </Link>
            <button
              onClick={handleLogout}
              className="glass-strong px-6 py-3 rounded-lg text-red-600 dark:text-red-400 font-semibold hover:scale-105 transition-transform flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('blog')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'blog'
                ? 'glass-strong text-black dark:text-gray'
                : 'glass text-gray-dark dark:text-gray-dark hover:glass-strong'
            }`}
          >
            Blog Posts
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'jobs'
                ? 'glass-strong text-black dark:text-gray'
                : 'glass text-gray-dark dark:text-gray-dark hover:glass-strong'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
              activeTab === 'messages'
                ? 'glass-strong text-black dark:text-gray'
                : 'glass text-gray-dark dark:text-gray-dark hover:glass-strong'
            }`}
          >
            Messages
            {messages.filter((m: any) => !m.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {messages.filter((m: any) => !m.read).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'admins'
                ? 'glass-strong text-black dark:text-gray'
                : 'glass text-gray-dark dark:text-gray-dark hover:glass-strong'
            }`}
          >
            Admins
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Blog Posts Section */}
          {activeTab === 'blog' && (
            <>
              {/* Create/Edit Post Form */}
              <div className="lg:col-span-2">
                <div className="glass rounded-3xl p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-black dark:text-gray">
                      {editingSlug ? 'Edit Post' : 'Create New Post'}
                    </h2>
                    {editingSlug && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-lg glass-strong text-black dark:text-gray hover:scale-105 transition-transform text-sm font-semibold"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Title *</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Excerpt *</label>
                  <textarea
                    value={postForm.excerpt}
                    onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                    Content * 
                    <span className="text-xs font-normal text-gray-dark dark:text-gray-dark ml-2">
                      (Supports Markdown: **bold**, *italic*, `code`, # headers, {'>'} quotes, - lists, [links](url))
                    </span>
                  </label>
                  <textarea
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm leading-relaxed"
                    rows={15}
                    required
                    placeholder="Write your blog post content here...

You can use Markdown formatting:
**Bold text** or __bold__
*Italic text* or _italic_
`inline code`
# Heading 1
## Heading 2
### Heading 3
{'>'} Blockquote
- List item
1. Numbered item
[Link text](https://example.com)
![Image alt](https://example.com/image.jpg)

Separate paragraphs with blank lines."
                  />
                  <div className="mt-2 text-xs text-gray-dark dark:text-gray-dark">
                    <p><strong>Tips:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Use double line breaks to create new paragraphs</li>
                      <li>Use **text** for bold, *text* for italic</li>
                      <li>Use {'>'} for blockquotes</li>
                      <li>Use # for headings (## for H2, ### for H3)</li>
                      <li>Use - or * for bullet lists</li>
                    </ul>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Author</label>
                    <input
                      type="text"
                      value={postForm.author}
                      onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Category</label>
                    <input
                      type="text"
                      value={postForm.category}
                      onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={postForm.tags}
                    onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="technology, blockchain, ai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                    Featured Image/Video
                  </label>
                  
                  {/* File Upload Input */}
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className={`flex items-center justify-center w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray cursor-pointer hover:scale-105 transition-transform ${
                          uploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploading ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                            Uploading... {uploadProgress}%
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Choose Image or Video
                          </span>
                        )}
                      </label>
                    </div>

                    {/* Preview */}
                    {(previewUrl || postForm.featuredImage) && (
                      <div className="relative rounded-lg overflow-hidden glass-strong p-2">
                        <div className="relative w-full h-48">
                          {(() => {
                            const url = previewUrl || postForm.featuredImage
                            const isVideo = previewType === 'video' || (url && isVideoUrl(url))
                            
                            return isVideo ? (
                              <video
                                src={url}
                                controls
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <img
                                src={url}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  // If image fails to load, try as video
                                  const target = e.target as HTMLImageElement
                                  const parent = target.parentElement
                                  if (parent && url) {
                                    const video = document.createElement('video')
                                    video.src = url
                                    video.controls = true
                                    video.className = 'w-full h-full object-cover rounded-lg'
                                    parent.replaceChild(video, target)
                                  }
                                }}
                              />
                            )
                          })()}
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-10"
                            title="Remove"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Manual URL Input (Optional) */}
                    <div className="text-xs text-gray-dark dark:text-gray-dark">
                      Or enter URL manually:
                    </div>
                    <input
                      type="url"
                      value={postForm.featuredImage}
                      onChange={(e) => {
                        const url = e.target.value
                        setPostForm({ ...postForm, featuredImage: url })
                        if (url) {
                          setPreviewUrl(url)
                          setPreviewType(isVideoUrl(url) ? 'video' : 'image')
                        } else {
                          setPreviewUrl(null)
                          setPreviewType(null)
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="published"
                    checked={postForm.published}
                    onChange={(e) => setPostForm({ ...postForm, published: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor="published" className="text-sm font-semibold text-black dark:text-gray">
                    Publish immediately
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full glass-strong px-6 py-4 rounded-lg text-black dark:text-gray font-semibold hover:scale-105 transition-transform"
                >
                  {editingSlug ? 'Update Post' : 'Create Post'}
                </button>
              </form>
            </div>
          </div>

              {/* Posts List */}
              <div className="lg:col-span-1">
                <div className="glass rounded-3xl p-6">
                  <h2 className="text-xl font-bold mb-4 text-black dark:text-gray">All Posts ({posts.length})</h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {posts.map((post) => (
                      <div key={post.id} className="glass-strong rounded-lg p-4">
                        <h3 className="font-semibold mb-2 text-black dark:text-gray line-clamp-2">{post.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => togglePublish(post)}
                            className={`text-xs px-2 py-1 rounded ${
                              post.published
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {post.published ? 'Published' : 'Draft'}
                          </button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleEdit(post)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(post.slug)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Jobs Section */}
          {activeTab === 'jobs' && (
            <>
              {/* Create Job Form */}
              <div className="lg:col-span-2">
                <div className="glass rounded-3xl p-8 mb-8">
                  <h2 className="text-2xl font-bold mb-6 text-black dark:text-gray">Create New Job</h2>
                  <form onSubmit={handleJobSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Job Title *</label>
                        <input
                          type="text"
                          value={jobForm.title}
                          onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Department *</label>
                        <input
                          type="text"
                          value={jobForm.department}
                          onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Location *</label>
                        <input
                          type="text"
                          value={jobForm.location}
                          onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Job Type *</label>
                        <select
                          value={jobForm.type}
                          onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Remote">Remote</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Description *</label>
                      <textarea
                        value={jobForm.description}
                        onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Requirements (one per line)</label>
                      <textarea
                        value={jobForm.requirements}
                        onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={4}
                        placeholder="Bachelor's degree in Computer Science&#10;3+ years of experience&#10;Proficiency in React"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Responsibilities (one per line)</label>
                      <textarea
                        value={jobForm.responsibilities}
                        onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={4}
                        placeholder="Develop and maintain web applications&#10;Collaborate with cross-functional teams"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Benefits (one per line)</label>
                      <textarea
                        value={jobForm.benefits}
                        onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                        placeholder="Health insurance&#10;Flexible working hours&#10;Remote work options"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Salary Range</label>
                        <input
                          type="text"
                          value={jobForm.salaryRange}
                          onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="$50,000 - $80,000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Application Email</label>
                        <input
                          type="email"
                          value={jobForm.applicationEmail}
                          onChange={(e) => setJobForm({ ...jobForm, applicationEmail: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="jobs@xkroot.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">Application URL</label>
                      <input
                        type="url"
                        value={jobForm.applicationUrl}
                        onChange={(e) => setJobForm({ ...jobForm, applicationUrl: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="job-published"
                        checked={jobForm.published}
                        onChange={(e) => setJobForm({ ...jobForm, published: e.target.checked })}
                        className="w-5 h-5 rounded"
                      />
                      <label htmlFor="job-published" className="text-sm font-semibold text-black dark:text-gray">
                        Publish immediately
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full glass-strong px-6 py-4 rounded-lg text-black dark:text-gray font-semibold hover:scale-105 transition-transform"
                    >
                      Create Job
                    </button>
                  </form>
                </div>
              </div>

              {/* Jobs List */}
              <div className="lg:col-span-1">
                <div className="glass rounded-3xl p-6">
                  <h2 className="text-xl font-bold mb-4 text-black dark:text-gray">All Jobs ({jobs.length})</h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {jobs.map((job) => (
                      <div key={job.id} className="glass-strong rounded-lg p-4">
                        <h3 className="font-semibold mb-2 text-black dark:text-gray line-clamp-2">{job.title}</h3>
                        <p className="text-xs text-gray-dark dark:text-gray-dark mb-2">{job.department} • {job.location}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => toggleJobPublish(job)}
                            className={`text-xs px-2 py-1 rounded ${
                              job.published
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {job.published ? 'Published' : 'Draft'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/jobs/${job.slug}`}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleJobDelete(job.slug)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Messages Section */}
          {activeTab === 'messages' && (
            <div className="lg:col-span-3">
              <div className="glass rounded-3xl p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-black dark:text-gray">Contact Messages</h2>
                  <select
                    value={filterRead}
                    onChange={(e) => setFilterRead(e.target.value)}
                    className="px-4 py-2 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Messages</option>
                    <option value="false">Unread Only</option>
                    <option value="true">Read Only</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Messages List */}
                  <div className="lg:col-span-1">
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {messages.length === 0 ? (
                        <p className="text-gray-dark dark:text-gray-dark text-center py-8">No messages found</p>
                      ) : (
                        messages.map((message: any) => (
                          <div
                            key={message.id}
                            onClick={() => setSelectedMessage(message)}
                            className={`glass-strong rounded-lg p-4 cursor-pointer hover:scale-105 transition-all ${
                              selectedMessage?.id === message.id ? 'ring-2 ring-purple-500' : ''
                            } ${!message.read ? 'border-l-4 border-purple-500' : ''}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-black dark:text-gray line-clamp-1">{message.subject}</h3>
                              {!message.read && (
                                <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-xs text-gray-dark dark:text-gray-dark mb-2">{message.name} &lt;{message.email}&gt;</p>
                            <p className="text-xs text-gray-dark dark:text-gray-dark line-clamp-2">{message.message}</p>
                            <p className="text-xs text-gray-dark dark:text-gray-dark mt-2">
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message Detail */}
                  <div className="lg:col-span-2">
                    {selectedMessage ? (
                      <div className="glass-strong rounded-3xl p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h2 className="text-2xl font-bold mb-2 text-black dark:text-gray">{selectedMessage.subject}</h2>
                            <div className="flex items-center gap-4 text-sm text-gray-dark dark:text-gray-dark">
                              <span>{selectedMessage.name}</span>
                              <span>•</span>
                              <a href={`mailto:${selectedMessage.email}`} className="text-purple-600 dark:text-purple-400 hover:underline">
                                {selectedMessage.email}
                              </a>
                            </div>
                            <div className="mt-2">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                {selectedMessage.inquiry_type}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleMessageRead(selectedMessage)}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                                selectedMessage.read
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                              }`}
                            >
                              {selectedMessage.read ? 'Mark Unread' : 'Mark Read'}
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(selectedMessage.id)}
                              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="mb-4 text-sm text-gray-dark dark:text-gray-dark">
                          Received: {new Date(selectedMessage.created_at).toLocaleString()}
                        </div>
                        <div className="glass rounded-xl p-6">
                          <h3 className="font-semibold mb-4 text-black dark:text-gray">Message:</h3>
                          <p className="text-gray-dark dark:text-gray-dark leading-relaxed whitespace-pre-wrap">
                            {selectedMessage.message}
                          </p>
                        </div>
                        <div className="mt-6">
                          <a
                            href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                            className="inline-flex items-center gap-2 glass-strong px-6 py-3 rounded-lg text-black dark:text-gray font-semibold hover:scale-105 transition-transform"
                          >
                            Reply via Email
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="glass-strong rounded-3xl p-12 text-center">
                        <p className="text-gray-dark dark:text-gray-dark">Select a message to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admins Section */}
          {activeTab === 'admins' && (
            <div className="lg:col-span-3">
              <div className="glass rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-6 text-black dark:text-gray">Create New Admin</h2>
                
                {adminSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm text-green-700 dark:text-green-400">{adminSuccess}</p>
                    </div>
                  </div>
                )}

                {adminError && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-700 dark:text-red-400">{adminError}</p>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setAdminError('')
                    setAdminSuccess('')
                    
                    if (adminForm.password !== adminForm.confirmPassword) {
                      setAdminError('Passwords do not match')
                      return
                    }
                    
                    if (adminForm.password.length < 8) {
                      setAdminError('Password must be at least 8 characters')
                      return
                    }

                    setAdminLoading(true)
                    try {
                      const response = await fetch('/api/admin/init', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          username: adminForm.username,
                          email: adminForm.email,
                          password: adminForm.password,
                        }),
                      })

                      const data = await response.json()

                      if (response.ok) {
                        setAdminSuccess(`Admin "${adminForm.username}" created successfully!`)
                        setAdminForm({
                          username: '',
                          email: '',
                          password: '',
                          confirmPassword: '',
                        })
                      } else {
                        setAdminError(data.error || 'Failed to create admin')
                      }
                    } catch (error: any) {
                      setAdminError('Network error. Please try again.')
                    } finally {
                      setAdminLoading(false)
                    }
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                      Username
                    </label>
                    <input
                      type="text"
                      value={adminForm.username}
                      onChange={(e) => {
                        setAdminForm({ ...adminForm, username: e.target.value })
                        setAdminError('')
                        setAdminSuccess('')
                      }}
                      className="w-full px-4 py-3 rounded-xl glass-strong text-black dark:text-gray placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Enter username"
                      required
                      disabled={adminLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                      Email
                    </label>
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => {
                        setAdminForm({ ...adminForm, email: e.target.value })
                        setAdminError('')
                        setAdminSuccess('')
                      }}
                      className="w-full px-4 py-3 rounded-xl glass-strong text-black dark:text-gray placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Enter email address"
                      required
                      disabled={adminLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                      Password
                    </label>
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => {
                        setAdminForm({ ...adminForm, password: e.target.value })
                        setAdminError('')
                        setAdminSuccess('')
                      }}
                      className="w-full px-4 py-3 rounded-xl glass-strong text-black dark:text-gray placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      disabled={adminLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={adminForm.confirmPassword}
                      onChange={(e) => {
                        setAdminForm({ ...adminForm, confirmPassword: e.target.value })
                        setAdminError('')
                        setAdminSuccess('')
                      }}
                      className="w-full px-4 py-3 rounded-xl glass-strong text-black dark:text-gray placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Confirm password"
                      required
                      disabled={adminLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {adminLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating Admin...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Create Admin</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 p-4 rounded-xl glass-strong">
                  <p className="text-sm text-gray-dark dark:text-gray-dark">
                    <strong className="text-black dark:text-gray">Note:</strong> New admins will be created in Supabase Auth and can immediately log in to the admin dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


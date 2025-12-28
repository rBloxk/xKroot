'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Post {
  id: string
  user_id: string
  user_name: string
  avatar_url: string | null
  content: string | null
  media_type: 'text' | 'photo' | 'video'
  media_url: string | null
  created_at: string
  like_count: number
  repost_count: number
  comment_count: number
  is_liked: boolean
  is_reposted: boolean
  is_saved: boolean
}

interface PostMedia {
  type: 'photo' | 'video' | 'audio'
  url: string
  file: File | null
}

export default function FeedPage() {
  const { user, authenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const emojiPickerRef = useRef<HTMLDivElement | null>(null)
  
  // Post creation state
  const [postContent, setPostContent] = useState('')
  const [postMedia, setPostMedia] = useState<PostMedia | null>(null)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/login')
    } else if (!authLoading && authenticated && user?.user_type !== 'candidate') {
      router.push('/')
    }
  }, [authLoading, authenticated, user, router])

  useEffect(() => {
    if (authenticated && user?.user_type === 'candidate') {
      loadPosts()
      loadUserProfile()
    }
  }, [authenticated, user])

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/candidate/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile({ avatar_url: data.profile?.avatar_url || null })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(dropdownRefs.current).forEach(postId => {
        const ref = dropdownRefs.current[postId]
        if (ref && !ref.contains(event.target as Node)) {
          setActiveDropdown(null)
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/api/posts', {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        setPosts(data.posts || [])
      } else {
        // Show more detailed error message
        if (data.code === 'TABLE_NOT_FOUND') {
          setError('Database tables not found. Please run the migration: supabase/migrations/create_posts_table.sql')
        } else {
          setError(data.error || data.details || 'Failed to load posts')
        }
        console.error('Error loading posts:', data)
      }
    } catch (error: any) {
      console.error('Error loading posts:', error)
      setError(error.message || 'Failed to load posts')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        // Reload posts to get accurate counts from server
        loadPosts()
      } else {
        const errorData = await response.json()
        console.error('Error liking post:', errorData)
        if (response.status === 401) {
          alert('Please log in to like posts')
        }
      }
    } catch (error) {
      console.error('Error liking post:', error)
      alert('Failed to like post. Please try again.')
    }
  }

  const handleRepost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        // Reload posts to get accurate counts from server
        loadPosts()
      } else {
        const errorData = await response.json()
        console.error('Error reposting:', errorData)
        if (response.status === 401) {
          alert('Please log in to repost')
        }
      }
    } catch (error) {
      console.error('Error reposting:', error)
      alert('Failed to repost. Please try again.')
    }
  }

  const handleSave = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id === postId) {
              return { ...post, is_saved: data.saved }
            }
            return post
          })
        )
        setActiveDropdown(null)
      }
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const handleHide = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/hide`, {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
        setActiveDropdown(null)
      }
    } catch (error) {
      console.error('Error hiding post:', error)
    }
  }

  const handleReport = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Inappropriate content' }),
      })
      if (response.ok) {
        alert('Post reported successfully')
        setActiveDropdown(null)
      }
    } catch (error) {
      console.error('Error reporting post:', error)
    }
  }

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return

    // Optimistic update - add comment immediately to UI
    const tempCommentId = `temp-${Date.now()}`
    const optimisticComment = {
      id: tempCommentId,
      user_id: user?.id || '',
      user_name: user?.full_name || user?.email || 'You',
      avatar_url: userProfile?.avatar_url || null,
      content: content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Update UI immediately
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), optimisticComment],
    }))
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, comment_count: post.comment_count + 1 }
        }
        return post
      })
    )

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      })
      if (response.ok) {
        const data = await response.json()
        // Replace optimistic comment with real comment from server (just update the ID)
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map(c => 
            c.id === tempCommentId 
              ? { ...c, id: data.comment.id, created_at: data.comment.created_at, updated_at: data.comment.updated_at }
              : c
          ),
        }))
      } else {
        // Rollback optimistic update on error
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== tempCommentId),
        }))
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id === postId) {
              return { ...post, comment_count: Math.max(0, post.comment_count - 1) }
            }
            return post
          })
        )
        setCommentInputs(prev => ({ ...prev, [postId]: content })) // Restore input
        
        const errorData = await response.json()
        console.error('Error commenting:', errorData)
        if (response.status === 401) {
          alert('Please log in to comment')
        } else {
          alert('Failed to post comment. Please try again.')
        }
      }
    } catch (error) {
      // Rollback optimistic update on error
      setComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== tempCommentId),
      }))
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return { ...post, comment_count: Math.max(0, post.comment_count - 1) }
          }
          return post
        })
      )
      setCommentInputs(prev => ({ ...prev, [postId]: content })) // Restore input
      
      console.error('Error commenting:', error)
      alert('Failed to post comment. Please try again.')
    }
  }

  const loadComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({ ...prev, [postId]: data.comments || [] }))
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const toggleComments = (postId: string) => {
    const isShowing = showComments[postId]
    setShowComments(prev => ({ ...prev, [postId]: !isShowing }))
    if (!isShowing && !comments[postId]) {
      loadComments(postId)
    }
  }

  const handleShare = async (postId: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post',
          url: `${window.location.origin}/feed?post=${postId}`,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/feed?post=${postId}`)
      alert('Link copied to clipboard!')
    }
  }

  const handleMediaUpload = async (file: File, type: 'photo' | 'video' | 'audio') => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/posts/upload-media', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setPostMedia({ type, url: data.url, file })
        return data.url
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload media')
        return null
      }
    } catch (error) {
      console.error('Error uploading media:', error)
      alert('Failed to upload media')
      return null
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleMediaUpload(file, 'photo')
    }
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleMediaUpload(file, 'video')
    }
  }

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleMediaUpload(file, 'audio')
    }
  }

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `${position.coords.latitude}, ${position.coords.longitude}`
          setPostContent(prev => prev ? `${prev}\n📍 ${location}` : `📍 ${location}`)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Failed to get location')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser')
    }
  }

  const handleCreatePost = async () => {
    if (!postContent.trim() && !postMedia) {
      alert('Please add some content or media to your post')
      return
    }

    try {
      setIsCreatingPost(true)
      
      // If audio, we'll store it as video type in the database (since schema only supports text/photo/video)
      // But we can handle it differently in the UI
      const mediaType = postMedia?.type === 'audio' ? 'video' : (postMedia?.type || 'text')
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent.trim() || null,
          media_type: mediaType,
          media_url: postMedia?.url || null,
        }),
      })

      if (response.ok) {
        setPostContent('')
        setPostMedia(null)
        // Reset file inputs
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (videoInputRef.current) videoInputRef.current.value = ''
        if (audioInputRef.current) audioInputRef.current.value = ''
        // Reload posts
        loadPosts()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post')
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setPostContent(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  // Common emojis organized by category
  const emojiCategories = {
    'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👤', '👥', '🗣️', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', '👩‍🦱', '👩‍🦳', '👩‍🦲', '👱‍♀️', '👱‍♂️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '💆', '💆‍♂️', '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️', '🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🏃', '🏃‍♂️', '🏃‍♀️', '💃', '🕺', '🕴️', '👯', '👯‍♂️', '👯‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🧑‍🤝‍🧑', '👭', '👫', '👬', '💏', '💑', '👪', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥'],
    'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
    'Food & Drink': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊'],
    'Activity & Sports': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳️', '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
    'Travel & Places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⌛️', '⏳', '⌚️', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎈', '🎉', '🎊', '🎀', '🪄', '🪅', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'],
    'Objects': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚️', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿️', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩️', '⏪️', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '⚪️', '⚫️', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾️', '◽️', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛️', '⬜️', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁️‍🗨️', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'],
    'Symbols': ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭', '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸', '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫', '🇨🇬', '🇨🇭', '🇨🇮', '🇨🇰', '🇨🇱', '🇨🇲', '🇨🇳', '🇨🇴', '🇨🇵', '🇨🇷', '🇨🇺', '🇨🇻', '🇨🇼', '🇨🇽', '🇨🇾', '🇨🇿', '🇩🇪', '🇩🇬', '🇩🇯', '🇩🇰', '🇩🇲', '🇩🇴', '🇩🇿', '🇪🇦', '🇪🇨', '🇪🇪', '🇪🇬', '🇪🇭', '🇪🇷', '🇪🇸', '🇪🇹', '🇪🇺', '🇫🇮', '🇫🇯', '🇫🇰', '🇫🇲', '🇫🇴', '🇫🇷', '🇬🇦', '🇬🇧', '🇬🇩', '🇬🇪', '🇬🇫', '🇬🇬', '🇬🇭', '🇬🇮', '🇬🇱', '🇬🇲', '🇬🇳', '🇬🇵', '🇬🇶', '🇬🇷', '🇬🇸', '🇬🇹', '🇬🇺', '🇬🇼', '🇬🇾', '🇭🇰', '🇭🇲', '🇭🇳', '🇭🇷', '🇭🇹', '🇭🇺', '🇮🇩', '🇮🇪', '🇮🇱', '🇮🇲', '🇮🇳', '🇮🇴', '🇮🇶', '🇮🇷', '🇮🇸', '🇮🇹', '🇯🇪', '🇯🇲', '🇯🇴', '🇯🇵', '🇰🇪', '🇰🇬', '🇰🇭', '🇰🇮', '🇰🇲', '🇰🇳', '🇰🇵', '🇰🇷', '🇰🇼', '🇰🇾', '🇰🇿', '🇱🇦', '🇱🇧', '🇱🇨', '🇱🇮', '🇱🇰', '🇱🇷', '🇱🇸', '🇱🇹', '🇱🇺', '🇱🇻', '🇱🇾', '🇲🇦', '🇲🇨', '🇲🇩', '🇲🇪', '🇲🇫', '🇲🇬', '🇲🇭', '🇲🇰', '🇲🇱', '🇲🇲', '🇲🇳', '🇲🇴', '🇲🇵', '🇲🇶', '🇲🇷', '🇲🇸', '🇲🇹', '🇲🇺', '🇲🇻', '🇲🇼', '🇲🇽', '🇲🇾', '🇲🇿', '🇳🇦', '🇳🇨', '🇳🇪', '🇳🇫', '🇳🇬', '🇳🇮', '🇳🇱', '🇳🇴', '🇳🇵', '🇳🇷', '🇳🇺', '🇳🇿', '🇴🇲', '🇵🇦', '🇵🇪', '🇵🇫', '🇵🇬', '🇵🇭', '🇵🇰', '🇵🇱', '🇵🇲', '🇵🇳', '🇵🇷', '🇵🇸', '🇵🇹', '🇵🇼', '🇵🇾', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇸', '🇷🇺', '🇷🇼', '🇸🇦', '🇸🇧', '🇸🇨', '🇸🇩', '🇸🇪', '🇸🇬', '🇸🇭', '🇸🇮', '🇸🇯', '🇸🇰', '🇸🇱', '🇸🇲', '🇸🇳', '🇸🇴', '🇸🇷', '🇸🇸', '🇸🇹', '🇸🇻', '🇸🇽', '🇸🇾', '🇸🇿', '🇹🇦', '🇹🇨', '🇹🇩', '🇹🇫', '🇹🇬', '🇹🇭', '🇹🇯', '🇹🇰', '🇹🇱', '🇹🇲', '🇹🇳', '🇹🇴', '🇹🇷', '🇹🇹', '🇹🇻', '🇹🇼', '🇹🇿', '🇺🇦', '🇺🇬', '🇺🇲', '🇺🇳', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇦', '🇻🇨', '🇻🇪', '🇻🇬', '🇻🇮', '🇻🇳', '🇻🇺', '🇼🇫', '🇼🇸', '🇽🇰', '🇾🇪', '🇾🇹', '🇿🇦', '🇿🇲', '🇿🇼', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿']
  }

  // Skeleton component for loading state
  const PostSkeleton = () => (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div>
            <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700"></div>
      </div>

      {/* Content skeleton */}
      <div className="mb-4 space-y-2">
        <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-4/6 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Media skeleton */}
      <div className="mb-4 h-64 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>

      {/* Action buttons skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-[#333333]">
        <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  )

  if (authLoading || !authenticated || user?.user_type !== 'candidate') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-2xl mx-auto">
        {/* Post Creation Component */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-300 dark:border-[#333333] p-4 mb-6">
          <div className="flex items-start gap-3 mb-4">
            {userProfile?.avatar_url ? (
              <Image
                src={userProfile.avatar_url}
                alt={user?.full_name || user?.email || 'User'}
                width={64}
                height={64}
                className="rounded-full object-cover"
                unoptimized
              />
            ) : (
              <Image
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.email || 'User')}&background=random&size=64&rounded=true`}
                alt={user?.full_name || user?.email || 'User'}
                width={64}
                height={64}
                className="rounded-full object-cover"
                unoptimized
              />
            )}
            <div className="flex-1">
              
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder= "What are you working on today?"
                className="w-full bg-transparent text-lg text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none min-h-[70px] pt-2"
                rows={3}
              />
              {postMedia && (
                <div className="mt-3 relative">
                  {postMedia.type === 'photo' && (
                    <div className="relative">
                      <Image
                        src={postMedia.url}
                        alt="Post media"
                        width={600}
                        height={400}
                        className="w-full h-auto rounded-lg object-cover max-h-96"
                        unoptimized
                      />
                      <button
                        onClick={() => setPostMedia(null)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {postMedia.type === 'video' && (
                    <div className="relative">
                      <video src={postMedia.url} controls className="w-full rounded-lg max-h-96" />
                      <button
                        onClick={() => setPostMedia(null)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {postMedia.type === 'audio' && (
                    <div className="relative p-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg">
                      <audio src={postMedia.url} controls className="w-full" />
                      <button
                        onClick={() => setPostMedia(null)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Media Options and Post Button */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-[#333333]">
            <div className="flex items-center gap-12">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                title="Add image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <button
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                title="Add video"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />

              <button
                onClick={() => audioInputRef.current?.click()}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                title="Add audio"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                className="hidden"
              />

              <button
                onClick={handleLocationClick}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                title="Add location"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                title="Add poll"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>

              <div className="relative" ref={emojiPickerRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  title="Add emoji"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-80 h-96 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333333] rounded-lg shadow-lg z-50 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-gray-200 dark:border-[#333333] flex-shrink-0">
                      <input
                        type="text"
                        placeholder="Search emojis..."
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#444444] rounded-lg text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                      {Object.entries(emojiCategories).map(([category, emojis]) => (
                        <div key={category} className="mb-4">
                          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                            {category}
                          </h3>
                          <div className="grid grid-cols-8 gap-1">
                            {emojis.map((emoji, index) => (
                              <button
                                key={`${category}-${index}`}
                                onClick={() => handleEmojiClick(emoji)}
                                className="text-2xl hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded p-1 transition-colors"
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCreatePost}
              disabled={isCreatingPost || (!postContent.trim() && !postMedia)}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingPost ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <div
                key={post.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6"
              >
                {/* Header: Profile pic, username, time, more options */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/candidate/profile/${post.user_id}`}>
                      {post.avatar_url ? (
                        <Image
                          src={post.avatar_url}
                          alt={post.user_name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                            {post.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </Link>
                    <div>
                      <Link
                        href={`/candidate/profile/${post.user_id}`}
                        className="font-semibold text-black dark:text-white hover:underline"
                      >
                        {post.user_name}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(post.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* More options dropdown */}
                  <div className="relative" ref={el => { dropdownRefs.current[post.id] = el }}>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                      aria-label="More options"
                    >
                      <svg
                        className="w-5 h-5 text-gray-600 dark:text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="6" cy="12" r="1.5" />
                        <circle cx="18" cy="12" r="1.5" />
                      </svg>
                    </button>

                    {activeDropdown === post.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#444444] rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleReport(post.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#333333] rounded-t-lg"
                        >
                          Report
                        </button>
                        <button
                          onClick={() => handleHide(post.id)}
                          className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#333333]"
                        >
                          Hide
                        </button>
                        <button
                          onClick={() => handleSave(post.id)}
                          className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#333333] rounded-b-lg"
                        >
                          {post.is_saved ? 'Unsave' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post content */}
                {post.content && (
                  <div className="mb-4">
                    <p className="text-black dark:text-white whitespace-pre-wrap">{post.content}</p>
                  </div>
                )}

                {/* Media */}
                {post.media_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    {post.media_type === 'photo' ? (
                      <Image
                        src={post.media_url}
                        alt="Post media"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                        unoptimized
                      />
                    ) : post.media_type === 'video' ? (
                      // Check if it's actually audio by file extension
                      post.media_url.match(/\.(mp3|wav|ogg|webm|mpeg)$/i) ? (
                        <div className="p-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg">
                          <audio src={post.media_url} controls className="w-full" />
                        </div>
                      ) : (
                        <video
                          src={post.media_url}
                          controls
                          className="w-full h-auto"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )
                    ) : null}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-[#333333]">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      post.is_liked
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={post.is_liked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">{post.like_count}</span>
                  </button>

                  <button
                    onClick={() => handleRepost(post.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      post.is_reposted
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="text-sm font-medium">{post.repost_count}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span className="text-sm font-medium">{post.comment_count}</span>
                  </button>

                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Share</span>
                  </button>
                </div>

                {/* Comments section */}
                {showComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#333333]">
                    {/* Comment input */}
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={e => e.key === 'Enter' && handleComment(post.id)}
                        placeholder="Write a comment..."
                        className="flex-1 px-4 py-2 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#444444] rounded-full text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                      >
                        Post
                      </button>
                    </div>

                    {/* Comments list */}
                    <div className="space-y-3">
                      {comments[post.id]?.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          {comment.avatar_url ? (
                            <Image
                              src={comment.avatar_url}
                              alt={comment.user_name}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                {comment.user_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="bg-gray-100 dark:bg-[#2a2a2a] rounded-lg p-3">
                              <p className="font-semibold text-sm text-black dark:text-white mb-1">
                                {comment.user_name}
                              </p>
                              <p className="text-sm text-black dark:text-white">{comment.content}</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-3">
                              {formatTimeAgo(comment.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


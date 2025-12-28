import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUserAuth } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication (handles token refresh automatically)
    const user = await verifyUserAuth(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user's hidden posts
    const { data: hiddenPosts } = await supabase
      .from('hidden_post')
      .select('post_id')
      .eq('user_id', user.id)

    const hiddenPostIds = hiddenPosts?.map(h => h.post_id) || []

    // Fetch posts excluding hidden ones
    let query = supabase
      .from('post')
      .select(`
        id,
        user_id,
        content,
        media_type,
        media_url,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: allPosts, error: postsError } = await query

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      // Check if it's a table doesn't exist error
      if (postsError.code === 'PGRST116' || postsError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Posts table does not exist. Please run the database migration.',
          code: 'TABLE_NOT_FOUND'
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: 'Failed to fetch posts',
        details: postsError.message 
      }, { status: 500 })
    }

    // Filter out hidden posts
    const posts = hiddenPostIds.length > 0
      ? allPosts?.filter(p => !hiddenPostIds.includes(p.id)) || []
      : allPosts || []

    // If no posts, return empty array
    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // Get user data and candidate profiles for avatar URLs
    const userIds = posts.map(p => p.user_id)
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('candidate_profile')
      .select('user_id, avatar_url')
      .in('user_id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    const userMap = new Map(users?.map(u => [u.id, u]) || [])
    const profileMap = new Map(profiles?.map(p => [p.user_id, p.avatar_url]) || [])

    // Get interaction counts and user's interactions
    const postIds = posts.map(p => p.id)
    
    // Get likes
    const { data: likes, error: likesError } = postIds.length > 0
      ? await supabase
          .from('post_like')
          .select('post_id, user_id')
          .in('post_id', postIds)
      : { data: null, error: null }

    if (likesError) {
      console.error('Error fetching likes:', likesError)
    }

    // Get reposts
    const { data: reposts, error: repostsError } = postIds.length > 0
      ? await supabase
          .from('post_repost')
          .select('post_id, user_id')
          .in('post_id', postIds)
      : { data: null, error: null }

    if (repostsError) {
      console.error('Error fetching reposts:', repostsError)
    }

    // Get comments count
    const { data: comments, error: commentsError } = postIds.length > 0
      ? await supabase
          .from('post_comment')
          .select('post_id')
          .in('post_id', postIds)
      : { data: null, error: null }

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
    }

    // Get saved posts
    const { data: savedPosts, error: savedError } = await supabase
      .from('saved_post')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds.length > 0 ? postIds : [])

    if (savedError) {
      console.error('Error fetching saved posts:', savedError)
    }

    // Aggregate data
    const likeCounts = new Map<string, number>()
    const repostCounts = new Map<string, number>()
    const commentCounts = new Map<string, number>()
    const userLiked = new Set<string>()
    const userReposted = new Set<string>()
    const userSaved = new Set<string>()

    likes?.forEach(like => {
      likeCounts.set(like.post_id, (likeCounts.get(like.post_id) || 0) + 1)
      if (like.user_id === user.id) {
        userLiked.add(like.post_id)
      }
    })

    reposts?.forEach(repost => {
      repostCounts.set(repost.post_id, (repostCounts.get(repost.post_id) || 0) + 1)
      if (repost.user_id === user.id) {
        userReposted.add(repost.post_id)
      }
    })

    comments?.forEach(comment => {
      commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) || 0) + 1)
    })

    savedPosts?.forEach(saved => {
      userSaved.add(saved.post_id)
    })

    // Format response
    const formattedPosts = posts?.map(post => {
      const userData = userMap.get(post.user_id)
      const likeCount = Math.max(0, likeCounts.get(post.id) || 0)
      const repostCount = Math.max(0, repostCounts.get(post.id) || 0)
      const commentCount = Math.max(0, commentCounts.get(post.id) || 0)
      return {
        id: post.id,
        user_id: post.user_id,
        user_name: userData?.full_name || userData?.email || 'Unknown',
        avatar_url: profileMap.get(post.user_id) || null,
        content: post.content,
        media_type: post.media_type,
        media_url: post.media_url,
        created_at: post.created_at,
        updated_at: post.updated_at,
        like_count: likeCount,
        repost_count: repostCount,
        comment_count: commentCount,
        is_liked: userLiked.has(post.id),
        is_reposted: userReposted.has(post.id),
        is_saved: userSaved.has(post.id),
      }
    }) || []

    return NextResponse.json({ posts: formattedPosts })
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication (handles token refresh automatically)
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await request.json()
    const { content, media_type, media_url } = body

    if (!content && !media_url) {
      return NextResponse.json({ error: 'Content or media is required' }, { status: 400 })
    }

    // Validate media_type
    const validMediaTypes = ['text', 'photo', 'video']
    const finalMediaType = media_type && validMediaTypes.includes(media_type) ? media_type : (media_url ? 'photo' : 'text')

    const { data: post, error: postError } = await supabase
      .from('post')
      .insert({
        user_id: user.id,
        content: content || null,
        media_type: finalMediaType,
        media_url: media_url || null,
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


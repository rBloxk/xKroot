import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUserAuth } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user authentication (handles token refresh automatically)
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const postId = params.id

    const { data: comments, error: commentsError } = await supabase
      .from('post_comment')
      .select(`
        id,
        user_id,
        content,
        created_at,
        updated_at
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Get user data and candidate profiles for avatar URLs
    const userIds = comments?.map(c => c.user_id) || []
    
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)

    const { data: profiles } = await supabase
      .from('candidate_profile')
      .select('user_id, avatar_url')
      .in('user_id', userIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])
    const profileMap = new Map(profiles?.map(p => [p.user_id, p.avatar_url]) || [])

    const formattedComments = comments?.map(comment => {
      const userData = userMap.get(comment.user_id)
      return {
        id: comment.id,
        user_id: comment.user_id,
        user_name: userData?.full_name || userData?.email || 'Unknown',
        avatar_url: profileMap.get(comment.user_id) || null,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
      }
    }) || []

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error('Error in GET /api/posts/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user authentication (handles token refresh automatically)
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const postId = params.id
    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const { data: comment, error: commentError } = await supabase
      .from('post_comment')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (commentError) {
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


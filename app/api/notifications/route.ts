import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET - Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('notification')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('notification')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      count: notifications?.length || 0,
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a notification (internal use)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { user_id, notification_type, title, message, link_url, metadata } = body

    if (!user_id || !notification_type || !title || !message) {
      return NextResponse.json(
        { error: 'user_id, notification_type, title, and message are required' },
        { status: 400 }
      )
    }

    // Verify the requesting user has permission (admin or creating for themselves)
    if (user_id !== user.id) {
      // Check if user is admin
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (!userData || userData.user_type !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized to create notifications for other users' },
          { status: 403 }
        )
      }
    }

    const { data: notification, error } = await supabaseAdmin
      .from('notification')
      .insert({
        user_id,
        notification_type,
        title,
        message,
        link_url: link_url || null,
        metadata: metadata || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification,
      message: 'Notification created successfully',
    })
  } catch (error: any) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


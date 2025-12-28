import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET - Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAuth(request)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('user_type')
      .eq('id', admin.id)
      .single()

    if (!user || user.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userType = searchParams.get('user_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        candidate_profile(id),
        company_profile(id, company_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userType) {
      query = query.eq('user_type', userType)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get total count
    let countQuery = supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (userType) {
      countQuery = countQuery.eq('user_type', userType)
    }

    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { count } = await countQuery

    return NextResponse.json({
      users: users || [],
      count: count || 0,
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


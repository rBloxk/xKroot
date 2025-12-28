import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUserAuth } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
    const { reason } = body

    const { error: insertError } = await supabase
      .from('post_report')
      .insert({
        post_id: postId,
        user_id: user.id,
        reason: reason || null,
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to report post' }, { status: 500 })
    }

    return NextResponse.json({ reported: true })
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


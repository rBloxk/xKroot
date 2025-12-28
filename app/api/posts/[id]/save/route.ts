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

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('saved_post')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (existingSave) {
      // Unsave
      const { error: deleteError } = await supabase
        .from('saved_post')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to unsave post' }, { status: 500 })
      }

      return NextResponse.json({ saved: false })
    } else {
      // Save
      const { error: insertError } = await supabase
        .from('saved_post')
        .insert({
          post_id: postId,
          user_id: user.id,
        })

      if (insertError) {
        return NextResponse.json({ error: 'Failed to save post' }, { status: 500 })
      }

      return NextResponse.json({ saved: true })
    }
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/save:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


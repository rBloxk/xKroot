import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the access token from cookies
    const accessToken = request.cookies.get('sb-access-token')?.value ||
                       request.cookies.get('supabase-auth-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      access_token: accessToken,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get session token' },
      { status: 500 }
    )
  }
}

